const path = require("path");
const { Worker } = require("worker_threads");
const { db } = require("../db");
const { pdfUploads, notebooks } = require("../db/schema");
const { eq, and } = require("drizzle-orm");

function verifyPdfMagicBytes(buffer) {
  if (!buffer || buffer.length < 4) return false;
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  );
}

function stripNullBytes(str) {
  return typeof str === "string" ? str.replace(/\u0000/g, "") : str;
}

// pdf-parse does genuinely CPU-bound synchronous work (decompression, font
// decoding via pdf.js internals) — running it on the main thread blocks
// Node's single event loop, which freezes every other in-flight request on
// this process until it finishes. Running it in a worker thread keeps the
// main thread free to keep handling other users' requests concurrently.
function parsePdfInWorker(buffer) {
  return new Promise((resolve) => {
    const worker = new Worker(
      path.join(__dirname, "../workers/pdfParseWorker.js"),
      { workerData: { buffer } },
    );

    const timeout = setTimeout(() => {
      worker.terminate();
      resolve({ success: false, error: "PDF parsing timed out" });
    }, 30000);

    worker.once("message", (result) => {
      clearTimeout(timeout);
      resolve(result);
      worker.terminate();
    });

    worker.once("error", (err) => {
      clearTimeout(timeout);
      resolve({ success: false, error: err.message || "Worker crashed" });
      worker.terminate();
    });
  });
}

async function upload(req, res) {
  try {
    const user = req.user;
    const file = req.file;
    const { notebookId } = req.body;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!file.originalname.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({ error: "Only PDF files are allowed" });
    }

    if (file.size > 20 * 1024 * 1024) {
      return res.status(400).json({ error: "File size must be under 20MB" });
    }

    if (!verifyPdfMagicBytes(file.buffer)) {
      return res.status(415).json({
        error:
          "Invalid file format. The file signature does not match a valid PDF header (%PDF-).",
      });
    }

    if (notebookId) {
      const [notebook] = await db
        .select()
        .from(notebooks)
        .where(and(eq(notebooks.id, notebookId), eq(notebooks.userId, user.id)))
        .limit(1);

      if (!notebook) {
        return res.status(400).json({ error: "Invalid notebook" });
      }
    }

    let extractedText = "";
    let pageCount = 0;

    const pdfResult = await parsePdfInWorker(file.buffer);
    if (pdfResult.success) {
      extractedText = stripNullBytes(pdfResult.text);
      pageCount = pdfResult.numpages;
    } else {
      console.error("PDF parsing error:", pdfResult.error);
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(422).json({
        error:
          "Could not extract sufficient text from PDF. The file may be scanned or image-based.",
      });
    }

    if (extractedText.length > 100000) {
      extractedText = extractedText.substring(0, 100000);
    }

    const [upload] = await db
      .insert(pdfUploads)
      .values({
        userId: user.id,
        notebookId: notebookId || null,
        fileName: stripNullBytes(file.originalname),
        fileSize: file.size,
        pageCount,
        extractedText,
        status: "processed",
      })
      .returning();

    return res.status(201).json({ upload });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { upload };

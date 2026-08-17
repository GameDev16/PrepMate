const pdfParse = require("pdf-parse");
const { db } = require("../db");
const { pdfUploads, notebooks } = require("../db/schema");
const { eq, and } = require("drizzle-orm");

function verifyPdfMagicBytes(buffer) {
  if (!buffer || buffer.length < 4) return false;
  // PDF magic header signature: %PDF (0x25 0x50 0x44 0x46)
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  );
}

// Postgres text/varchar columns reject NUL (0x00) bytes outright, throwing
// "invalid byte sequence for encoding UTF8". Some PDFs (depending on their
// internal font encoding) yield extracted text containing literal NUL
// characters, which would otherwise crash the insert below.
function stripNullBytes(str) {
  return typeof str === "string" ? str.replace(/\u0000/g, "") : str;
}

async function upload(req, res) {
  try {
    const user = req.user;
    const file = req.file;
    const { notebookId } = req.body;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Validate file type
    if (!file.originalname.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({ error: "Only PDF files are allowed" });
    }

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      return res.status(400).json({ error: "File size must be under 20MB" });
    }

    // Strict Magic Byte Signature Verification
    if (!verifyPdfMagicBytes(file.buffer)) {
      return res.status(415).json({
        error:
          "Invalid file format. The file signature does not match a valid PDF header (%PDF-).",
      });
    }

    // Validate notebook ownership if provided
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

    // Extract text from PDF
    let extractedText = "";
    let pageCount = 0;

    try {
      const pdfData = await pdfParse(new Uint8Array(file.buffer));
      extractedText = stripNullBytes(pdfData.text || "");
      pageCount = pdfData.numpages || 0;
    } catch (pdfError) {
      console.error("PDF parsing error:", pdfError);
      extractedText = "";
      pageCount = 0;
    }

    // Check if extracted text is sufficient
    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(422).json({
        error:
          "Could not extract sufficient text from PDF. The file may be scanned or image-based.",
      });
    }

    // Truncate to 100,000 characters
    if (extractedText.length > 100000) {
      extractedText = extractedText.substring(0, 100000);
    }

    // Create upload record
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

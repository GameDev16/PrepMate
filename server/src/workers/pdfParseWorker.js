const { parentPort, workerData } = require("worker_threads");
const pdfParse = require("pdf-parse");

(async () => {
  try {
    const { buffer } = workerData;
    const pdfData = await pdfParse(new Uint8Array(buffer));
    parentPort.postMessage({
      success: true,
      text: pdfData.text || "",
      numpages: pdfData.numpages || 0,
    });
  } catch (err) {
    parentPort.postMessage({
      success: false,
      error: err.message || "PDF parsing failed",
    });
  }
})();

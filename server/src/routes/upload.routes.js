const express = require("express");
const multer = require("multer");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { generateLimiter } = require("../middleware/rateLimiter");
const uploadController = require("../controllers/upload.controller");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

router.post(
  "/",
  requireAuth,
  generateLimiter,
  upload.single("file"),
  uploadController.upload,
);

module.exports = router;



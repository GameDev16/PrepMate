const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { generateLimiter } = require("../middleware/rateLimiter");
const generateController = require("../controllers/generate.controller");

router.post("/", requireAuth, generateLimiter, generateController.generate);

module.exports = router;



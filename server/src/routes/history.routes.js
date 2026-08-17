const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const historyController = require("../controllers/history.controller");

router.get("/", requireAuth, historyController.getHistory);

module.exports = router;



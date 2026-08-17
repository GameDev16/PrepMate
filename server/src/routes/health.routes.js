const express = require("express");
const router = express.Router();
const { pool } = require("../db");

router.get("/", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Health check failed:", error);
    return res.status(500).json({ ok: false });
  }
});

module.exports = router;



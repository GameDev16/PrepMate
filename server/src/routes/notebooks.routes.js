const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const notebooksController = require("../controllers/notebooks.controller");

router.get("/", requireAuth, notebooksController.getNotebooks);
router.get("/:id", requireAuth, notebooksController.getNotebook);
router.post("/", requireAuth, notebooksController.createNotebook);
router.patch("/:id", requireAuth, notebooksController.updateNotebook);
router.delete("/:id", requireAuth, notebooksController.deleteNotebook);

module.exports = router;



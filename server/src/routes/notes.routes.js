const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const notesController = require("../controllers/notes.controller");

router.get("/", requireAuth, notesController.getNotes);
router.get("/:id/notebooks", requireAuth, notesController.getNoteNotebooks);
router.put("/:id/notebooks", requireAuth, notesController.updateNoteNotebooks);
router.get("/:id", requireAuth, notesController.getNote);
router.patch("/:id", requireAuth, notesController.updateNote);
router.delete("/:id", requireAuth, notesController.deleteNote);

module.exports = router;

const { db } = require("../db");
const { generatedNotes, pdfUploads, notebooks, notebookNotes } = require("../db/schema");
const { eq, and, desc, sql, inArray, notInArray, ilike, or } = require("drizzle-orm");

async function getNotes(req, res) {
  try {
    const user = req.user;
    const { notebookId, search, bookmarked, templateType } = req.query;

    let conditions = [eq(generatedNotes.userId, user.id)];

    if (notebookId) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM notebook_notes nn WHERE nn.note_id = ${generatedNotes.id} AND nn.notebook_id = ${notebookId})`
      );
    }

    if (templateType) {
      conditions.push(eq(generatedNotes.templateType, templateType));
    }

    if (bookmarked === "true") {
      conditions.push(eq(generatedNotes.isBookmarked, true));
    }

    // Multi-item search across title AND content in SQL before .limit(50)
    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(generatedNotes.title, searchPattern),
          ilike(generatedNotes.content, searchPattern)
        )
      );
    }

    let query = db
      .select({
        id: generatedNotes.id,
        title: generatedNotes.title,
        templateType: generatedNotes.templateType,
        depthLevel: generatedNotes.depthLevel,
        outputLanguage: generatedNotes.outputLanguage,
        isBookmarked: generatedNotes.isBookmarked,
        isPinned: generatedNotes.isPinned,
        createdAt: generatedNotes.createdAt,
        pdfFileName: pdfUploads.fileName,
      })
      .from(generatedNotes)
      .leftJoin(pdfUploads, eq(generatedNotes.pdfUploadId, pdfUploads.id))
      .where(and(...conditions))
      .orderBy(desc(generatedNotes.isPinned), desc(generatedNotes.createdAt))
      .limit(50);

    const notes = await query;

    return res.status(200).json({ notes });
  } catch (error) {
    console.error("Get notes error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getNote(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const [note] = await db
      .select({
        id: generatedNotes.id,
        title: generatedNotes.title,
        templateType: generatedNotes.templateType,
        depthLevel: generatedNotes.depthLevel,
        persona: generatedNotes.persona,
        outputLanguage: generatedNotes.outputLanguage,
        content: generatedNotes.content,
        contentJson: generatedNotes.contentJson,
        diagrams: generatedNotes.diagrams,
        charts: generatedNotes.charts,
        flashcards: generatedNotes.flashcards,
        mcqs: generatedNotes.mcqs,
        isBookmarked: generatedNotes.isBookmarked,
        isPinned: generatedNotes.isPinned,
        customPrompt: generatedNotes.customPrompt,
        createdAt: generatedNotes.createdAt,
        pdfFileName: pdfUploads.fileName,
        pdfPageCount: pdfUploads.pageCount,
      })
      .from(generatedNotes)
      .leftJoin(pdfUploads, eq(generatedNotes.pdfUploadId, pdfUploads.id))
      .where(and(eq(generatedNotes.id, id), eq(generatedNotes.userId, user.id)))
      .limit(1);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    return res.status(200).json({ note });
  } catch (error) {
    console.error("Get note error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function updateNote(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const body = req.body;

    // notebookId intentionally NOT in this allowlist — notebook membership is
    // managed exclusively through the notebook_notes join table via
    // /api/notes/:id/notebooks (see getNoteNotebooks/updateNoteNotebooks
    // below), which is now the single source of truth. See db/schema.js for
    // why the old generatedNotes.notebookId column was removed.
    const allowedFields = ["isBookmarked", "isPinned", "title", "subject"];
    const updates = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(generatedNotes)
      .set(updates)
      .where(and(eq(generatedNotes.id, id), eq(generatedNotes.userId, user.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Note not found" });
    }

    return res.status(200).json({ note: updated });
  } catch (error) {
    console.error("Update note error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteNote(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    await db
      .delete(generatedNotes)
      .where(and(eq(generatedNotes.id, id), eq(generatedNotes.userId, user.id)));

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete note error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getNoteNotebooks(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const [note] = await db
      .select()
      .from(generatedNotes)
      .where(and(eq(generatedNotes.id, id), eq(generatedNotes.userId, user.id)))
      .limit(1);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    const nbs = await db
      .select({
        id: notebooks.id,
        name: notebooks.name,
        emoji: notebooks.emoji,
        color: notebooks.color,
      })
      .from(notebooks)
      .innerJoin(notebookNotes, eq(notebooks.id, notebookNotes.notebookId))
      .where(and(eq(notebookNotes.noteId, id), eq(notebooks.userId, user.id)));

    return res.status(200).json({ notebooks: nbs });
  } catch (error) {
    console.error("Get note notebooks error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function updateNoteNotebooks(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const { notebookIds } = req.body;

    if (!Array.isArray(notebookIds)) {
      return res.status(400).json({ error: "notebookIds must be an array" });
    }

    const [note] = await db
      .select()
      .from(generatedNotes)
      .where(and(eq(generatedNotes.id, id), eq(generatedNotes.userId, user.id)))
      .limit(1);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    if (notebookIds.length > 0) {
      const validNbs = await db
        .select({ id: notebooks.id })
        .from(notebooks)
        .where(and(inArray(notebooks.id, notebookIds), eq(notebooks.userId, user.id)));

      if (validNbs.length !== new Set(notebookIds).size) {
        return res.status(400).json({ error: "One or more notebooks do not belong to user" });
      }
    }

    if (notebookIds.length === 0) {
      await db.delete(notebookNotes).where(eq(notebookNotes.noteId, id));
    } else {
      await db
        .delete(notebookNotes)
        .where(
          and(
            eq(notebookNotes.noteId, id),
            notInArray(notebookNotes.notebookId, notebookIds)
          )
        );

      const existingRows = await db
        .select({ notebookId: notebookNotes.notebookId })
        .from(notebookNotes)
        .where(eq(notebookNotes.noteId, id));
      const existingIds = new Set(existingRows.map((r) => r.notebookId));

      const toInsert = notebookIds
        .filter((nbId) => !existingIds.has(nbId))
        .map((nbId) => ({
          noteId: id,
          notebookId: nbId,
        }));

      if (toInsert.length > 0) {
        await db.insert(notebookNotes).values(toInsert);
      }
    }

    return res.status(200).json({ success: true, notebookIds });
  } catch (error) {
    console.error("Update note notebooks error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  getNotes,
  getNote,
  updateNote,
  deleteNote,
  getNoteNotebooks,
  updateNoteNotebooks,
};

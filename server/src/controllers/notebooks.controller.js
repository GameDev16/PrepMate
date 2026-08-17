const { db } = require("../db");
const { notebooks, generatedNotes, notebookNotes } = require("../db/schema");
const { eq, and, desc, sql } = require("drizzle-orm");

async function getNotebooks(req, res) {
  try {
    const user = req.user;

    const notebookList = await db
      .select({
        id: notebooks.id,
        name: notebooks.name,
        emoji: notebooks.emoji,
        color: notebooks.color,
        description: notebooks.description,
        isPinned: notebooks.isPinned,
        isArchived: notebooks.isArchived,
        isFavorite: notebooks.isFavorite,
        createdAt: notebooks.createdAt,
        updatedAt: notebooks.updatedAt,
        // Correlated subquery must table-qualify both sides explicitly. Interpolating
        // the drizzle column object (${notebooks.id}) renders as a bare, unqualified
        // "id" — which notebook_notes' own "id" primary key column then shadows,
        // turning this into a self-referential (always ~0) comparison instead of a
        // correlation to the outer notebook row. Writing plain qualified SQL avoids that.
        noteCount: sql`(SELECT COUNT(*)::int FROM notebook_notes WHERE notebook_notes.notebook_id = notebooks.id)`.as("note_count"),
      })
      .from(notebooks)
      .where(and(eq(notebooks.userId, user.id), eq(notebooks.isArchived, false)))
      .orderBy(desc(notebooks.isPinned), desc(notebooks.updatedAt));

    return res.status(200).json({ notebooks: notebookList });
  } catch (error) {
    console.error("Get notebooks error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getNotebook(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const [notebook] = await db
      .select({
        id: notebooks.id,
        name: notebooks.name,
        emoji: notebooks.emoji,
        color: notebooks.color,
        description: notebooks.description,
        isPinned: notebooks.isPinned,
        isArchived: notebooks.isArchived,
        isFavorite: notebooks.isFavorite,
        createdAt: notebooks.createdAt,
        updatedAt: notebooks.updatedAt,
        noteCount: sql`(SELECT COUNT(*)::int FROM notebook_notes WHERE notebook_notes.notebook_id = notebooks.id)`.as("note_count"),
      })
      .from(notebooks)
      .where(and(eq(notebooks.id, id), eq(notebooks.userId, user.id)))
      .limit(1);

    if (!notebook) {
      return res.status(404).json({ error: "Notebook not found" });
    }

    return res.status(200).json({ notebook });
  } catch (error) {
    console.error("Get notebook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function createNotebook(req, res) {
  try {
    const user = req.user;
    const { name, emoji, color, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    const [notebook] = await db
      .insert(notebooks)
      .values({
        userId: user.id,
        name: name.trim(),
        emoji: emoji || null,
        color: color || "#6366f1",
        description: description?.trim() || null,
      })
      .returning();

    return res.status(201).json({ notebook });
  } catch (error) {
    console.error("Create notebook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function updateNotebook(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const body = req.body;

    // Allowlist fields
    const allowedFields = [
      "name",
      "emoji",
      "color",
      "description",
      "isPinned",
      "isArchived",
      "isFavorite",
    ];
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
      .update(notebooks)
      .set(updates)
      .where(and(eq(notebooks.id, id), eq(notebooks.userId, user.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Notebook not found" });
    }

    return res.status(200).json({ notebook: updated });
  } catch (error) {
    console.error("Update notebook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteNotebook(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    await db
      .delete(notebooks)
      .where(and(eq(notebooks.id, id), eq(notebooks.userId, user.id)));

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete notebook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  getNotebooks,
  getNotebook,
  createNotebook,
  updateNotebook,
  deleteNotebook,
};

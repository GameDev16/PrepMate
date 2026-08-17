const { db } = require("../db");
const {
  users,
  generatedNotes,
  pdfUploads,
  notebooks,
  transactions,
} = require("../db/schema");
const { eq, desc, sql } = require("drizzle-orm");

async function getDashboard(req, res) {
  try {
    const user = req.user;

    // Get user credits
    const [currentUser] = await db
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    // Get counts
    const [notesCount] = await db
      .select({ count: sql`COUNT(*)` })
      .from(generatedNotes)
      .where(eq(generatedNotes.userId, user.id));

    const [uploadsCount] = await db
      .select({ count: sql`COUNT(*)` })
      .from(pdfUploads)
      .where(eq(pdfUploads.userId, user.id));

    const [notebooksCount] = await db
      .select({ count: sql`COUNT(*)` })
      .from(notebooks)
      .where(eq(notebooks.userId, user.id));

    // Get recent notes
    const recentNotes = await db
      .select({
        id: generatedNotes.id,
        title: generatedNotes.title,
        templateType: generatedNotes.templateType,
        createdAt: generatedNotes.createdAt,
      })
      .from(generatedNotes)
      .where(eq(generatedNotes.userId, user.id))
      .orderBy(desc(generatedNotes.createdAt))
      .limit(5);

    // Get recent uploads
    const recentUploads = await db
      .select({
        id: pdfUploads.id,
        fileName: pdfUploads.fileName,
        pageCount: pdfUploads.pageCount,
        createdAt: pdfUploads.createdAt,
      })
      .from(pdfUploads)
      .where(eq(pdfUploads.userId, user.id))
      .orderBy(desc(pdfUploads.createdAt))
      .limit(5);

    // Get template stats
    const templateStats = await db
      .select({
        templateType: generatedNotes.templateType,
        count: sql`COUNT(*)`,
      })
      .from(generatedNotes)
      .where(eq(generatedNotes.userId, user.id))
      .groupBy(generatedNotes.templateType);

    // Get recent transactions
    const recentTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.createdAt))
      .limit(10);

    return res.status(200).json({
      stats: {
        totalNotes: Number(notesCount.count),
        totalUploads: Number(uploadsCount.count),
        totalNotebooks: Number(notebooksCount.count),
        credits: currentUser.credits,
      },
      recentNotes,
      recentUploads,
      templateStats,
      recentTransactions,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { getDashboard };



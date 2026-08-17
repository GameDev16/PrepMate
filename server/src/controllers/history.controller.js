const { db } = require("../db");
const { generationHistory } = require("../db/schema");
const { eq, desc } = require("drizzle-orm");

async function getHistory(req, res) {
  try {
    const user = req.user;

    const history = await db
      .select()
      .from(generationHistory)
      .where(eq(generationHistory.userId, user.id))
      .orderBy(desc(generationHistory.createdAt))
      .limit(50);

    return res.status(200).json({ history });
  } catch (error) {
    console.error("History error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { getHistory };



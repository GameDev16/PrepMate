const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { db } = require("../db");
const { users } = require("../db/schema");
const { eq } = require("drizzle-orm");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required — refusing to start with no secret configured.");
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function createToken(userId, tokenVersion = 0) {
  return jwt.sign({ userId, ver: tokenVersion }, JWT_SECRET, { algorithm: "HS256", expiresIn: "7d" });
}

function verifyToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    return { userId: payload.userId, ver: payload.ver };
  } catch {
    return null;
  }
}

async function getUserFromToken(token) {
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      credits: users.credits,
      isVerified: users.isVerified,
      preferredLanguage: users.preferredLanguage,
      theme: users.theme,
      learningPreferences: users.learningPreferences,
      avatarUrl: users.avatarUrl,
      tokenVersion: users.tokenVersion,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, decoded.userId))
    .limit(1);

  if (!user) return null;
  if (decoded.ver !== undefined && decoded.ver !== (user.tokenVersion || 0)) {
    return null;
  }
  return user;
}

function getTokenFromRequest(req) {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  if (req.cookies?.token) return req.cookies.token;
  return null;
}

module.exports = {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  getUserFromToken,
  getTokenFromRequest,
};



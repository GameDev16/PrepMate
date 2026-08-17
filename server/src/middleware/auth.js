const { getTokenFromRequest, getUserFromToken } = require("../lib/auth");

async function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = user;
  next();
}

module.exports = { requireAuth };



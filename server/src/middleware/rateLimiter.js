const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register/forgot-password attempts per window
  message: {
    error: "Too many authentication attempts from this IP. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 general API requests per minute
  message: {
    error: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for the two expensive/costly routes: PDF parsing (CPU) and
// Gemini calls (real $ per request). These were previously unprotected —
// apiLimiter existed but was never wired up to them, so an authenticated user
// (or a stolen/shared credit-pack account) could hammer both endpoints with
// no server-side ceiling beyond their credit balance.
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads/generations per IP per 15 minutes
  message: {
    error: "Too many upload/generation requests. Please wait a few minutes and try again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, apiLimiter, generateLimiter };

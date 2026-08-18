require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const { apiLimiter } = require("./middleware/rateLimiter");

// Verify required env vars & enforce minimum secret entropy (#8)
const jwtSecret = process.env.JWT_SECRET;
if (
  !jwtSecret ||
  jwtSecret.length < 32 ||
  jwtSecret.includes("change-in-production")
) {
  console.error(
    "FATAL: JWT_SECRET must be at least 32 characters and not match default example strings.",
  );
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const NODE_ENV = process.env.NODE_ENV || "development";

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// General baseline rate limit across all API routes. Individual routers layer
// stricter limiters on top where it matters (auth: brute-force protection,
// upload/generate: cost/abuse protection) — apiLimiter used to be defined but
// never actually applied anywhere, so nothing outside /api/auth had any
// ceiling at all.
app.use("/api", apiLimiter);

// Routes
const authRoutes = require("./routes/auth.routes");
const uploadRoutes = require("./routes/upload.routes");
const generateRoutes = require("./routes/generate.routes");
const notebooksRoutes = require("./routes/notebooks.routes");
const notesRoutes = require("./routes/notes.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const historyRoutes = require("./routes/history.routes");
const healthRoutes = require("./routes/health.routes");
const paymentsRoutes = require("./routes/payments.routes");

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/notebooks", notebooksRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/payments", paymentsRoutes);

// Serve static files in production
if (NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "../../dist");
  app.use(express.static(clientDist));

  // Catch-all for client-side routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(
    `Mock Mode: ${process.env.MOCK_MODE === "true" ? "ENABLED" : "disabled"}`,
  );
  if (process.env.GEMINI_API_KEY) {
    console.log(
      `Gemini API: configured (${process.env.GEMINI_MODEL || "gemini-3-flash-preview"})`,
    );
  } else {
    console.log("Gemini API: not configured (mock mode)");
  }
});

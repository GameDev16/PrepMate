// One-time helper: creates server/.env from server/.env.example if it doesn't
// already exist, with a real random JWT secret (the placeholder one in
// .env.example contains "change-in-production", which the server refuses to
// boot with) and MOCK_MODE=true so the app runs with zero API keys on first run.
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const envPath = path.join(__dirname, "..", "server", ".env");
const examplePath = path.join(__dirname, "..", "server", ".env.example");

if (fs.existsSync(envPath)) {
  console.log("server/.env already exists — leaving it alone.");
  process.exit(0);
}

let content = fs.readFileSync(examplePath, "utf8");
const secret = crypto.randomBytes(32).toString("hex");
content = content.replace(/JWT_SECRET=.*/, `JWT_SECRET=${secret}`);
content = content.replace(/MOCK_MODE=false/, "MOCK_MODE=true");

fs.writeFileSync(envPath, content);
console.log("Created server/.env with a random JWT secret and MOCK_MODE=true.");
console.log("Edit server/.env later to add a real GEMINI_API_KEY / Razorpay test keys when you have them.");

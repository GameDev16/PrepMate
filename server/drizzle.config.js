require("dotenv").config();

module.exports = {
  dialect: "postgresql",
  schema: "./src/db/schema.js",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL },
};

const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

module.exports = { db, pool };



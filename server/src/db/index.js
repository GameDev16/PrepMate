const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 10000, // fail fast if a connection can't be established
  idleTimeoutMillis: 20000,       // recycle idle connections well before Neon's 5-min auto-suspend
  max: 10,
});
const db = drizzle(pool);

module.exports = { db, pool };



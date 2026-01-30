import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "eldercare",
  password: process.env.PGPASSWORD || "eldercare",
  database: process.env.PGDATABASE || "eldercare"
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS care_links (
      id SERIAL PRIMARY KEY,
      elder_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      caregiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(elder_id, caregiver_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS checkins (
      id SERIAL PRIMARY KEY,
      elder_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      caregiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export default pool;

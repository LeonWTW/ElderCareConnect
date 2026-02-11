import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "eldercare",
  password: process.env.PGPASSWORD || "eldercare",
  database: process.env.PGDATABASE || "eldercare"
});

// Retry connecting to the database in case it hasn't finished initializing yet
// Retries up to 10 times with a 3-second delay between attempts
export async function initDb(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS care_links (
          id SERIAL PRIMARY KEY,
          caregiver_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          elder_names TEXT[] DEFAULT '{}'
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS elder_tasks (
          id SERIAL PRIMARY KEY,
          caregiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          elder_name TEXT NOT NULL,
          task_name TEXT NOT NULL,
          description TEXT,
          is_complete BOOLEAN DEFAULT FALSE,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(caregiver_id, elder_name, task_name)
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS checkins (
          id SERIAL PRIMARY KEY,
          elder_name TEXT NOT NULL,
          caregiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          event_type TEXT NOT NULL DEFAULT 'checkin',
          task_name TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      // Ensure older databases also have notification metadata columns.
      await pool.query(`
        ALTER TABLE checkins
        ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'checkin'
      `);

      await pool.query(`
        ALTER TABLE checkins
        ADD COLUMN IF NOT EXISTS task_name TEXT
      `);

      console.log("Database initialized successfully");
      return;
    } catch (err) {
      console.log(`DB not ready, retrying ${i + 1}/${retries}...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error("Could not connect to database after retries");
}

export default pool;

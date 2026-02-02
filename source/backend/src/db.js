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
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS care_links (
      id SERIAL PRIMARY KEY,
      caregiver_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      elder_names TEXT[] DEFAULT '{}' -- A simple list of names (e.g., {"Alice", "Bob"})
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

  await pool.query(`
  CREATE TABLE IF NOT EXISTS elder_tasks (
    id SERIAL PRIMARY KEY,
    caregiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    elder_name TEXT NOT NULL,
    task_name TEXT NOT NULL,      -- Your "string" (e.g., 'Morning Meds')
    additional_info TEXT,
    is_completed BOOLEAN DEFAULT FALSE, -- Your "0/1" (True/False is cleaner)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevents the same task name appearing twice for the same elder
    UNIQUE(caregiver_id, elder_name, task_name)
  );
`);


}

export default pool;

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
  `)



  //hasn't been updated yet
  await pool.query(`
    CREATE TABLE IF NOT EXISTS checkins (
      id SERIAL PRIMARY KEY,
      elder_name TEXT NOT NULL 
      caregiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export default pool;

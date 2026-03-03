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
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'care_links'
              AND column_name = 'elder_names'
          ) THEN
            ALTER TABLE care_links RENAME TO care_links_legacy;

            CREATE TABLE care_links (
              id SERIAL PRIMARY KEY,
              caregiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              elder_name TEXT NOT NULL
            );

            INSERT INTO care_links (caregiver_id, elder_name)
            SELECT DISTINCT caregiver_id, TRIM(elder_name)
            FROM care_links_legacy
            CROSS JOIN UNNEST(COALESCE(elder_names, '{}'::TEXT[])) AS elder_name
            WHERE TRIM(elder_name) <> '';

            DROP TABLE care_links_legacy;
          ELSE
            CREATE TABLE IF NOT EXISTS care_links (
              id SERIAL PRIMARY KEY,
              caregiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              elder_name TEXT NOT NULL
            );
          END IF;
        END $$;
      `);

      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_care_links_caregiver_elder
        ON care_links (caregiver_id, elder_name);
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_care_links_caregiver
        ON care_links (caregiver_id);
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

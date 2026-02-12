import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import pool, { initDb } from "./db.js";

const app = express();

// Allow your frontend to call the API
app.use(cors({
  origin: true,        // for dev; you can lock this down later
  credentials: false
}));

app.use(express.json());

// Initialize database tables
await initDb();

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "backend", time: new Date().toISOString() });
});

// Example endpoint your frontend can fetch
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Node backend!" });
});




/* REGISTER */
app.post("/api/auth/register", async (req, res) => {
  // TODO: Fix DB entries
  const { username, email, password, eldersList } = req.body;

  if (!username || !email || !password || !Array.isArray(eldersList)) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const newUser = await client.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username",
      [username, email, passwordHash]
    );

    const newId = newUser.rows[0].id;

    await client.query(
      "INSERT INTO care_links (caregiver_id, elder_names) VALUES ($1, $2)",
      [newId, eldersList]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: "User and Care List registered",
      user: newUser.rows[0]
    });
    
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    if (err.code === "23505"){
      res.status(409).json({ error: "Username or email already in use" });
    } else {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } finally {
    if (client) {
      client.release();
    }
  }
});

/* CAREGIVER LOGIN */
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT id, username, password FROM users WHERE username = $1",
      [username]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      user: { id: user.id, username: user.username }
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});


/* ELDER LOGIN */
app.post("/api/auth/elderLogin", async (req, res) => {

  const { elderName, caregiverName } = req.body;

  if (!elderName || !caregiverName) {
    return res.status(400).json({ error: "Missing elder name or caregiver name" });
  }

  try {
    // We join users and care_links to find the elder within the caregiver's list
    // The ANY operator is used to check if a value exists inside a Postgres array
    const query = `
      SELECT u.id AS caregiver_id, u.username AS caregiver_name
      FROM users u
      JOIN care_links cl ON u.id = cl.caregiver_id
      WHERE u.username = $1 AND $2 = ANY(cl.elder_names)
    `;

    const result = await pool.query(query, [caregiverName, elderName]);

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: "Access denied. Verification failed for caregiver or elder name." 
      });
    }

    const authData = result.rows[0];

    res.json({
      message: "Elder login successful",
      caregiverId: authData.caregiver_id,
      elderName: elderName
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
  
});



/* CREATE CHECK-IN */
app.post("/api/checkins", (req, res) => {
  const { elderName, caregiverId } = req.body;

  if (!elderName || !caregiverId) {
    return res.status(400).json({ error: "Missing elderName or caregiverId" });
  }

  pool.query(
    "SELECT 1 FROM care_links WHERE caregiver_id = $1 AND $2 = ANY(elder_names)",
    [caregiverId, elderName]
  )
    .then(result => {
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Elder not linked to caregiver" });
      }

      const inserts = result.rows.map(row => {
        return pool.query(
          "INSERT INTO checkins (elder_name, caregiver_id) VALUES ($1, $2)",
          [elderName, caregiverId]
        );
      });

      return Promise.all(inserts).then(() => {
        res.json({ message: "Check-in recorded", count: inserts.length });
      });
    })
    .catch(() => {
      res.status(500).json({ error: "Server error" });
    });
});

/* GET ELDER LIST FOR A CAREGIVER */
app.get("/api/caregivers/:caregiverId/elders", async (req, res) => {
  const caregiverId = req.params.caregiverId;

  try {
    const result = await pool.query(
      "SELECT elder_names FROM care_links WHERE caregiver_id = $1",
      [caregiverId]
    );

    if (result.rows.length === 0) {
      return res.json([]);
    }

    res.json(result.rows[0].elder_names || []);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

/* CREATE TASK */
app.post("/api/tasks", async (req, res) => {
  const { caregiverId, elderName, taskName, description } = req.body;

  if (!caregiverId || !elderName || !taskName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO elder_tasks (caregiver_id, elder_name, task_name, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [caregiverId, elderName, taskName, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      res.status(409).json({ error: "Task already exists for this elder" });
    } else {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
});

/* GET TASKS FOR AN ELDER */
app.get("/api/tasks/:caregiverId/:elderName", async (req, res) => {
  const { caregiverId, elderName } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, task_name, description, is_complete, updated_at
       FROM elder_tasks
       WHERE caregiver_id = $1 AND elder_name = $2
       ORDER BY id ASC`,
      [caregiverId, elderName]
    );

    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

/* UPDATE TASK STATUS */
app.patch("/api/tasks/:taskId", async (req, res) => {
  const { taskId } = req.params;
  const { isComplete } = req.body;
  const nextIsComplete = isComplete === true || isComplete === "true";

  try {
    const existing = await pool.query(
      `SELECT id, caregiver_id, elder_name, task_name, is_complete
       FROM elder_tasks
       WHERE id = $1`,
      [taskId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const previousTask = existing.rows[0];

    const result = await pool.query(
      `UPDATE elder_tasks
       SET is_complete = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [nextIsComplete, taskId]
    );

    // Only create a notification on a transition to "complete".
    if (nextIsComplete && !previousTask.is_complete) {
      await pool.query(
        `INSERT INTO checkins (elder_name, caregiver_id, event_type, task_name)
         VALUES ($1, $2, 'task_completed', $3)`,
        [previousTask.elder_name, previousTask.caregiver_id, previousTask.task_name]
      );
    }

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

/* DELETE TASK */
app.delete("/api/tasks/:taskId", async (req, res) => {
  const { taskId } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM elder_tasks WHERE id = $1 RETURNING *",
      [taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

/* CAREGIVER NOTIFICATIONS */
app.get("/api/caregivers/:caregiverId/notifications", (req, res) => {
  const caregiverId = req.params.caregiverId;

  pool.query(
    `
      SELECT id, elder_name, created_at, event_type, task_name,
      CASE
        WHEN event_type = 'task_completed' THEN CONCAT(elder_name, ' completed task: ', task_name)
        ELSE CONCAT(elder_name, ' checked in')
      END AS message
      FROM checkins
      WHERE caregiver_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `,
    [caregiverId]
  )
    .then(result => {
      res.json(result.rows);
    })
    .catch(() => {
      res.status(500).json({ error: "Server error" });
    });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});


/* CREATE CHECK-IN */
app.post('/api/addElder', async (req, res) => {
  const { userId, newElder } = req.body;

  if (!userId || !newElder) {
      return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
      const result = await pool.query(
          'SELECT elder_names FROM care_links WHERE caregiver_id = $1',
          [userId]
      );

      if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Caregiver not found.' });
      }

      const currentElders = result.rows[0].elder_names || [];

      if (currentElders.includes(newElder)) {
          return res.status(409).json({ error: 'This elder is already in your list.' });
      }

      const updateResult = await pool.query(
          `UPDATE care_links 
           SET elder_names = array_append(elder_names, $1) 
           WHERE caregiver_id = $2 
           RETURNING elder_names`,
          [newElder, userId]
      );

      res.status(200).json({ 
          message: 'Elder added successfully', 
      });

  } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});
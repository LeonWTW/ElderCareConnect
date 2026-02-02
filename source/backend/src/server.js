import express from "express";
import cors from "cors";
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
  const { username, email, password, elderList } = req.body;

  if (!username || !email || !password || !elderList) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const newUser = await client.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username",
      [username, email, password]
    );

    const newId = newUser.rows[0].id;

    await client.query(
      "INSERT INTO care_links (caregiver_id, elder_names) VALUES ($1, $2)",
      [newId, elderList]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: "User and Care List registered",
      user: newUser.rows[0]
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === "23505"){
      res.status(409).json({ error: "Username or email already in use" });
    } else {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } finally {
    client.release();
  }
});

/* CAREGIVER LOGIN */
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  pool.query(
    "SELECT id, username FROM users WHERE username = $1 AND password = $2",
    [username, password]
  )
    .then(result => {
      const user = result.rows[0];
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({
        message: "Login successful",
        user
      });
    })
    .catch(() => {
      res.status(500).json({ error: "Server error" });
    });
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
  const { elderId } = req.body;

  if (!elderId) {
    return res.status(400).json({ error: "Missing elderId" });
  }

  pool.query(
    "SELECT caregiver_id FROM care_links WHERE elder_id = $1",
    [elderId]
  )
    .then(result => {
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "No caregiver linked to this elder" });
      }

      const inserts = result.rows.map(row => {
        return pool.query(
          "INSERT INTO checkins (elder_id, caregiver_id) VALUES ($1, $2)",
          [elderId, row.caregiver_id]
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

/* CAREGIVER NOTIFICATIONS */
app.get("/api/caregivers/:caregiverId/notifications", (req, res) => {
  const caregiverId = req.params.caregiverId;

  pool.query(
    `
      SELECT c.id, c.created_at, u.username AS elder_name
      FROM checkins c
      JOIN users u ON u.id = c.elder_id
      WHERE c.caregiver_id = $1
      ORDER BY c.created_at DESC
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

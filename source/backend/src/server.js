import express from "express";
import cors from "cors";

const app = express();

// Allow your frontend to call the API
app.use(cors({
  origin: true,        // for dev; you can lock this down later
  credentials: false
}));

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "backend", time: new Date().toISOString() });
});

// Example endpoint your frontend can fetch
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Node backend!" });
});

// TEMP in-memory users (replace with DB later)
const users = [];

/* REGISTER */
app.post("/api/auth/register", (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: "Missing fields" });
  }

  if (users.find(u => u.username === username)) {
    return res.status(409).json({ error: "Username already exists" });
  }

  const user = {
    id: users.length + 1,
    username,
    email,
    password, // ⚠ plain text for now (OK for class demo)
    role
  };

  users.push(user);

  res.status(201).json({
    message: "User registered",
    user: { id: user.id, username, role }
  });
});

/* LOGIN */
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({
    message: "Login successful",
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
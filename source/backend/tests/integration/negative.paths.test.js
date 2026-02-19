import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { app } from "../../src/server.js";
import pool from "../../src/db.js";

let server;
let baseUrl;

async function jsonRequest(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  return { status: response.status, body };
}

async function resetDb() {
  await pool.query(`
    TRUNCATE TABLE checkins, elder_tasks, care_links, users
    RESTART IDENTITY CASCADE
  `);
}

test.before(async () => {
  server = app.listen(0);
  await once(server, "listening");
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.beforeEach(async () => {
  await resetDb();
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close(err => (err ? reject(err) : resolve()));
    });
  }
});

test("register returns 400 when required fields are missing", async () => {
  const response = await jsonRequest("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "missing-fields-user",
      email: "missing@example.com"
    })
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Missing fields");
});

test("login returns 401 for unknown user", async () => {
  const response = await jsonRequest("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "does-not-exist",
      password: "wrong"
    })
  });

  assert.equal(response.status, 401);
  assert.equal(response.body.error, "Invalid credentials");
});

test("elder login returns 401 when elder is not linked to caregiver", async () => {
  await jsonRequest("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "caregiver-negative",
      email: "caregiver-negative@example.com",
      password: "supersecret",
      eldersList: ["Pat"]
    })
  });

  const response = await jsonRequest("/api/auth/elderLogin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      elderName: "NotLinked",
      caregiverName: "caregiver-negative"
    })
  });

  assert.equal(response.status, 401);
  assert.equal(
    response.body.error,
    "Access denied. Verification failed for caregiver or elder name."
  );
});

test("task endpoints return 404 for missing task id on patch and delete", async () => {
  const patchResponse = await jsonRequest("/api/tasks/9999", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ isComplete: true })
  });

  assert.equal(patchResponse.status, 404);
  assert.equal(patchResponse.body.error, "Task not found");

  const deleteResponse = await jsonRequest("/api/tasks/9999", {
    method: "DELETE"
  });

  assert.equal(deleteResponse.status, 404);
  assert.equal(deleteResponse.body.error, "Task not found");
});

test("create task returns 400 when required fields are missing", async () => {
  const response = await jsonRequest("/api/tasks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      caregiverId: 1,
      elderName: "Sam"
    })
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Missing required fields");
});

test("register returns 400 when elder list contains duplicate names", async () => {
  const response = await jsonRequest("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "duplicate-elder-user",
      email: "duplicate-elder-user@example.com",
      password: "supersecret",
      eldersList: ["Alex", " alex "]
    })
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Duplicate elder names are not allowed");
});

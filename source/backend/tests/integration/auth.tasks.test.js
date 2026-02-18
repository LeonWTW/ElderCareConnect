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

test("caregiver auth flow works: register, login, elder login", async () => {
  const register = await jsonRequest("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "caregiver1",
      email: "caregiver1@example.com",
      password: "supersecret",
      eldersList: ["Alex"]
    })
  });

  assert.equal(register.status, 201);
  assert.equal(register.body.user.username, "caregiver1");
  assert.ok(register.body.user.id);

  const login = await jsonRequest("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "caregiver1",
      password: "supersecret"
    })
  });

  assert.equal(login.status, 200);
  assert.equal(login.body.user.username, "caregiver1");
  assert.ok(login.body.user.id);

  const elderLogin = await jsonRequest("/api/auth/elderLogin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      elderName: "Alex",
      caregiverName: "caregiver1"
    })
  });

  assert.equal(elderLogin.status, 200);
  assert.equal(elderLogin.body.elderName, "Alex");
  assert.ok(elderLogin.body.caregiverId);
});

test("task lifecycle works: create, list, complete, delete", async () => {
  const register = await jsonRequest("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "caregiver2",
      email: "caregiver2@example.com",
      password: "supersecret",
      eldersList: ["Sam"]
    })
  });

  const caregiverId = register.body.user.id;

  const createTask = await jsonRequest("/api/tasks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      caregiverId,
      elderName: "Sam",
      taskName: "Take medicine",
      description: "After breakfast"
    })
  });

  assert.equal(createTask.status, 201);
  assert.equal(createTask.body.task_name, "Take medicine");
  const taskId = createTask.body.id;

  const listTasks = await jsonRequest(`/api/tasks/${caregiverId}/Sam`);
  assert.equal(listTasks.status, 200);
  assert.equal(listTasks.body.length, 1);
  assert.equal(listTasks.body[0].is_complete, false);

  const completeTask = await jsonRequest(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ isComplete: true })
  });

  assert.equal(completeTask.status, 200);
  assert.equal(completeTask.body.is_complete, true);

  const notifications = await jsonRequest(`/api/caregivers/${caregiverId}/notifications`);
  assert.equal(notifications.status, 200);
  assert.equal(notifications.body.length, 1);
  assert.equal(notifications.body[0].event_type, "task_completed");
  assert.equal(notifications.body[0].task_name, "Take medicine");

  const deleteTask = await jsonRequest(`/api/tasks/${taskId}`, { method: "DELETE" });
  assert.equal(deleteTask.status, 200);
  assert.equal(deleteTask.body.message, "Task deleted");

  const listAfterDelete = await jsonRequest(`/api/tasks/${caregiverId}/Sam`);
  assert.equal(listAfterDelete.status, 200);
  assert.equal(listAfterDelete.body.length, 0);
});

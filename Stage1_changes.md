# Stage 1: Email-Based Authentication Implementation

## Overview

This document describes the changes made to implement Stage 1 of the ElderCare Connect backend, which switches the authentication system from username-based to email-based login and sets up the database schema for future features.

---

## Files Changed

### 1. `source/backend/requirements.txt`

**Purpose:** Python package dependencies for the backend API.

**Changes Made:**
- Added `pydantic[email]==2.7.4` for email validation in Pydantic schemas
- Added `bcrypt==4.0.1` to fix compatibility issue between `passlib 1.7.4` and newer bcrypt versions

**Why:** The newer versions of bcrypt (4.1+) have breaking API changes that cause passlib to throw `ValueError: password cannot be longer than 72 bytes` errors. Pinning bcrypt to 4.0.1 resolves this.

---

### 2. `source/backend/app/models.py`

**Purpose:** SQLAlchemy ORM models defining the database schema.

**Changes Made:**

#### Updated `User` model:
| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer (PK) | Primary key (unchanged) |
| `role` | String(20) | "elder" or "caregiver" (unchanged) |
| `email` | String(255), unique, nullable | **NEW** - Primary login identifier |
| `display_name` | String(255), nullable | **NEW** - User's display name |
| `password_hash` | String(255), nullable | Password hash (unchanged) |
| `created_at` | DateTime | **NEW** - Account creation timestamp |
| `last_login_at` | DateTime, nullable | **NEW** - Last login timestamp |

#### Added placeholder tables for Stage 2/3:

**`CareLink`** - Links caregivers to elders (many-to-many)
- `caregiver_id` (FK → users.id)
- `elder_id` (FK → users.id)  
- `created_at`, `status`
- Unique constraint on (caregiver_id, elder_id)

**`Task`** - Tasks assigned to elders
- `elder_id` (FK → users.id)
- `title`, `scheduled_time`, `is_active`, `created_at`

**`TaskCompletion`** - Records of completed tasks
- `task_id` (FK → tasks.id)
- `completed_at`, `completed_on`, `completed_by_user_id`
- Unique constraint on (task_id, completed_on) for one completion per day

**`CheckIn`** - Daily elder check-ins
- `elder_id` (FK → users.id)
- `created_at`, `checkin_on`
- Unique constraint on (elder_id, checkin_on) for one check-in per day

**Why:** These tables are created now (via `Base.metadata.create_all()`) but endpoints will be added in Stage 2/3. This ensures the database schema is ready.

---

### 3. `source/backend/app/schemas.py`

**Purpose:** Pydantic schemas for request/response validation and serialization.

**Changes Made:**

#### Authentication Schemas (Updated):
- `RegisterRequest`: Now requires `email` (EmailStr), `password` (min 6 chars), optional `display_name`, optional `role` (defaults to "caregiver")
- `LoginRequest`: Now requires `email` and `password` (previously used username)
- `UserPublic`: Now includes `id`, `email`, `display_name`, `role`, `created_at`, `last_login_at`
- `TokenResponse`: Returns `access_token`, `token_type`, and `user` (UserPublic)

#### Placeholder Schemas for Stage 2/3:
- `ElderCreate`, `ElderPublic` - For creating/returning elder profiles
- `TaskCreate`, `TaskPublic` - For creating/returning tasks
- `DashboardResponse` - For caregiver dashboard data

**Why:** Fixed the schema-model mismatch where the old `UserPublic` expected `email` but the User model only had `username`. All schemas now align with the updated models.

---

### 4. `source/backend/app/routes/users.py`

**Purpose:** Authentication API endpoints.

**Changes Made:**

#### `POST /auth/register`
- Now accepts `email` instead of `username`
- Validates email uniqueness
- Hashes password using bcrypt
- Returns `UserPublic` with user details

#### `POST /auth/login`
- Now authenticates using `email` + `password`
- Updates `last_login_at` timestamp on successful login
- Returns JWT access token and user details

#### `GET /auth/me` (NEW)
- Returns current authenticated user's information
- Requires valid JWT token in Authorization header

**Why:** Migrated from username-based to email-based authentication as required for the demo.

---

### 5. `source/backend/app/auth.py`

**Purpose:** Authentication utilities (password hashing, JWT tokens).

**Changes Made:**
- No functional changes, only added documentation comments
- `hash_password()` - Hashes plaintext passwords using bcrypt
- `verify_password()` - Verifies password against hash
- `create_access_token()` - Generates JWT token with 24-hour expiry
- `get_current_user()` - FastAPI dependency to extract and validate JWT

---

### 6. `source/backend/app/db.py`

**Purpose:** Database connection configuration.

**Changes Made:**
- No functional changes, only added documentation comments
- Reads `DATABASE_URL` from environment variable
- Creates SQLAlchemy engine with connection pooling

---

### 7. `source/backend/app/main.py`

**Purpose:** FastAPI application entry point.

**Changes Made:**
- Added `localhost:3000` to CORS allowed origins (for React development)
- Updated API metadata (title, description, version)

---

### 8. `source/backend/app/routes/health.py`

**Purpose:** Health check endpoint for monitoring.

**Changes Made:**
- Added `service` field to response for easier identification

---

### 9. `source/backend/app/routes/notes.py`

**Purpose:** Notes CRUD endpoints (existing feature).

**Changes Made:**
- No functional changes, kept for backwards compatibility

---

## Breaking Changes

| Before | After |
|--------|-------|
| Login with `username` + `password` | Login with `email` + `password` |
| `POST /auth/register` accepts `username` | `POST /auth/register` accepts `email` |
| `POST /auth/login` accepts `username` | `POST /auth/login` accepts `email` |

**Migration Note:** Any existing users in the database will need to be recreated since they don't have email addresses. For a fresh deployment, run `docker compose down -v` to clear the database volume.

---

## Testing Instructions

### Prerequisites
- Docker and Docker Compose installed
- Terminal/Command prompt access
- (Optional) Postman or curl for API testing

### Step 1: Start the Application

```bash
# Navigate to project root directory
cd app4seniors

# Stop any existing containers and remove volumes (clean start)
docker compose down -v

# Build and start containers
docker compose up --build
```

Wait until you see:
```
api-1  | INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Verify Health Check

**Using Browser:**
Open http://localhost:8000/health

**Using curl:**
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{"ok": true, "service": "eldercare-api"}
```

### Step 3: Test User Registration

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "caregiver@example.com",
    "password": "securepass123",
    "display_name": "John Smith",
    "role": "caregiver"
  }'
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "email": "caregiver@example.com",
  "display_name": "John Smith",
  "role": "caregiver",
  "created_at": "2025-01-25T12:00:00.000000",
  "last_login_at": null
}
```

**Test Duplicate Email (should fail):**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "caregiver@example.com",
    "password": "anotherpass",
    "role": "caregiver"
  }'
```

**Expected Response (409 Conflict):**
```json
{"detail": "Email already registered"}
```

### Step 4: Test User Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "caregiver@example.com",
    "password": "securepass123"
  }'
```

**Expected Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "caregiver@example.com",
    "display_name": "John Smith",
    "role": "caregiver",
    "created_at": "2025-01-25T12:00:00.000000",
    "last_login_at": "2025-01-25T12:05:00.000000"
  }
}
```

**Test Invalid Password (should fail):**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "caregiver@example.com",
    "password": "wrongpassword"
  }'
```

**Expected Response (401 Unauthorized):**
```json
{"detail": "Invalid email or password"}
```

### Step 5: Test Authenticated Endpoint

Copy the `access_token` from the login response and use it:

```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "email": "caregiver@example.com",
  "display_name": "John Smith",
  "role": "caregiver",
  "created_at": "2025-01-25T12:00:00.000000",
  "last_login_at": "2025-01-25T12:05:00.000000"
}
```

**Test Without Token (should fail):**
```bash
curl http://localhost:8000/auth/me
```

**Expected Response (403 Forbidden):**
```json
{"detail": "Not authenticated"}
```

### Step 6: View API Documentation

Open in browser: http://localhost:8000/docs

This shows the Swagger UI with all available endpoints. You can test endpoints directly from this interface.

### Step 7: Verify Database Tables

Connect to the database to verify all tables were created:

```bash
# Connect to the PostgreSQL container
docker compose exec db psql -U postgres -d eldercare

# List all tables
\dt

# Expected output should show:
#  Schema |       Name        | Type  |  Owner   
# --------+-------------------+-------+----------
#  public | care_links        | table | postgres
#  public | checkins          | table | postgres
#  public | notes             | table | postgres
#  public | task_completions  | table | postgres
#  public | tasks             | table | postgres
#  public | users             | table | postgres

# View users table structure
\d users

# Exit psql
\q
```

---

## Quick Test Script

Save this as `test_api.sh` and run with `bash test_api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8000"
EMAIL="testuser$(date +%s)@example.com"

echo "=== Testing ElderCare Connect API ==="
echo ""

echo "1. Health Check..."
curl -s $BASE_URL/health | jq .
echo ""

echo "2. Register User ($EMAIL)..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"test123456\", \"display_name\": \"Test User\"}")
echo $REGISTER_RESPONSE | jq .
echo ""

echo "3. Login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"test123456\"}")
echo $LOGIN_RESPONSE | jq .
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
echo ""

echo "4. Get Current User (with token)..."
curl -s $BASE_URL/auth/me -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "=== All Tests Completed ==="
```

---

## Next Steps (Stage 2)

After Stage 1 is verified, the following will be implemented in Stage 2:

1. **Care Endpoints** (`/care/elders`)
   - POST /care/elders - Create elder profile
   - GET /care/elders - List linked elders

2. **Task Endpoints** (`/elders/{elder_id}/tasks`)
   - POST - Create task for elder
   - GET /today - Get today's tasks with completion status
   - POST /tasks/{task_id}/complete - Mark task complete

3. **Check-in Endpoints** (`/elders/{elder_id}/checkin`)
   - POST - Create daily check-in
   - GET /last - Get last check-in

4. **Dashboard Endpoint** (`/care/elders/{elder_id}/dashboard`)
   - GET - Aggregated stats for caregiver view

---

## Troubleshooting

### Issue: "password cannot be longer than 72 bytes"
**Solution:** Ensure `bcrypt==4.0.1` is in requirements.txt and rebuild with `docker compose build --no-cache`

### Issue: "Email already registered" on first registration
**Solution:** Clear the database with `docker compose down -v` and restart

### Issue: Tables not created
**Solution:** Check docker logs with `docker compose logs api` for SQLAlchemy errors

### Issue: CORS errors in browser
**Solution:** Ensure your frontend origin is listed in `main.py` CORS settings
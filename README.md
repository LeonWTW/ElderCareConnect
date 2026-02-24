# CS410 - ElderCare Connect 👵🏻
--------
## Description

This is a web-app designed for helping the elderly struggling with memory loss, as well as family members that want to monitor their elderly loved ones from anywhere, so long as they have access to a stable internet/cellular connection. The app features daily reminders to take medication, family monitoring, and games to stimulate the brain. There will be a simple and intuitive to use dashboard that allows the elderly to check in and start tasks, and for monitoring family members to quickly keep track of their status (e.g. task completion). These are only a select few things we aim to implement, and the feature set may be subject to new features if time allows for it during our implementation process.

## Target user and problem being solved

There will be two primary users for our application. The first will be the elderly (more for those struggling with memory loss: Alzheimer's, Dementia, etc.) as this targets to help them remember to take their medications and sharpen cognitive skills. The other user will be family members that want to quickly check in with them, while also making sure their tasks are completed.

## Users/uses out of scope

This app will not be of any use for people who don't need reminders for basic tasks and medications, or for those that don't need to monitor anyone. 

## Possible risks to not ignore

- Secure login: making sure to use a decently sophisticated hashing algorithm to store user login data

- Maintaining privacy: webcam will be on frequently, so we have to make sure the connection cannot be compromised and intercepted. 

- Possible computer vision implementation: identifying and making sure medication needed is the correct one.

## Current Functionality

### Caregiver Features
- Sign up with username, email, password.
- Optional initial elder list during signup.
- Log in with username/password.
- View caregiver dashboard.
- Add tasks for a selected elder.
- View task list per elder.
- Delete tasks.
- View notifications feed:
  - Elder check-ins.
  - Task completion events.
- Add elder names from the Elder Options view.

### Elder Features
- Log in with elder name + caregiver username pair.
- View assigned tasks.
- Mark tasks complete.
- Send check-in notification to caregiver.
- "Play Games" button exists but is currently a placeholder.

## Architecture

- Frontend: static HTML/CSS/JS in `source/frontend`
- Backend API: Node/Express in `source/backend/src/server.js`
- Database: Postgres 16 (via Docker)
- Orchestration: `docker-compose.yml`

Ports:
- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:3002`
- Postgres: `localhost:5432`

## Run Locally (Docker)

From repository root:

```powershell
docker compose up -d --build
```

Open:
- `http://localhost:8080/home.html`

Health check:
- `http://localhost:3002/health`

Stop:

```powershell
docker compose down
```

## Typical User Flow

1. Caregiver signs up and adds elder names.
2. Caregiver logs in and assigns tasks.
3. Elder logs in using:
   - elder name (must match caregiver-linked elder name)
   - caregiver username
4. Elder checks in and marks tasks done.
5. Caregiver sees updates in Notifications.

## API Endpoints (Current)

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/elderLogin`

Caregiver data:
- `GET /api/caregivers/:caregiverId/elders`
- `GET /api/caregivers/:caregiverId/notifications`
- `POST /api/addElder`

Tasks:
- `POST /api/tasks`
- `GET /api/tasks/:caregiverId/:elderName`
- `PATCH /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId`

Check-ins:
- `POST /api/checkins`

Utility:
- `GET /health`
- `GET /api/hello`

## Known Limitations

- No session/JWT auth; identity is tracked in browser localStorage.
- Input validation is basic (email format, elder-name duplicates, password policy can be improved).
- "Play Games" is not implemented yet.
- No automated test suite committed yet.
- Check-in cooldown currently uses a short temporary window in frontend logic for testing behavior.

## Docker Reliability Note

Backend builds now ignore local dependency folders using `source/backend/.dockerignore`:
- `node_modules`
- `npm-debug.log`

This prevents native module conflicts (for example, Windows-built `bcrypt` binaries being copied into Linux containers).

## Team

- Leon Wong - Project Manager / Scrum Lead
- An Vo - Technical Lead / Architect
- Josh Hillerman - Product Designer / UX Lead
- Andrew Martin - Product Owner / QA / Documentation Lead

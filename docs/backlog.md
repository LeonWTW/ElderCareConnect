## Problem Statement
Primary users are:
- Elders with declining memory/cognitive function.
- Caregivers/relatives who need remote visibility into daily status.

The product goal is to reduce caregiver uncertainty with simple tasking and check-in workflows.

## Current Build Status

Implemented:
- Caregiver signup/login.
- Elder login linked to caregiver + elder name.
- Caregiver task creation/list/deletion per elder.
- Elder task viewing and completion.
- Check-ins and caregiver notifications feed.
- Elder management (add elder names to caregiver list).
- Dockerized local environment (frontend/backend/db).

Partially implemented:
- Games area appears in elder dashboard but is placeholder-only.

Not implemented yet:
- Robust auth/session model (JWT/cookies).
- Password reset / account recovery.
- Rich validation and stronger abuse/error handling.
- Automated test coverage.

## Active Backlog

### High Priority
- Implement secure session auth and route protection.
- Add backend and frontend automated tests.
- Harden input validation (email format, elder name normalization, duplicate checks).
- Improve error UX (inline status instead of alert-heavy flows).

### Medium Priority
- Implement elder games module (or remove until ready).
- Add caregiver ability to remove elder names cleanly.
- Add timestamps/status indicators in caregiver task manager.

### Lower Priority
- UI polish and accessibility pass for elder-first interactions.
- Add onboarding copy and guided first-run flow.

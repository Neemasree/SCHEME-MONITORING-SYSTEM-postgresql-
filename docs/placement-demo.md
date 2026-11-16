# CivicTrack — Placement Demo Guide

This guide is the repeatable script for demonstrating the project in a placement interview. Use a local Docker environment with disposable data. Do not expose the seeded demo credentials on a public deployment.

## 1. Start the application

From the repository root:

```bash
docker compose up --build -d --wait
docker compose exec backend npm run seed
```

Open the frontend at [http://localhost:8080](http://localhost:8080). Check [http://localhost:5000/health](http://localhost:5000/health) and [http://localhost:8080/health](http://localhost:8080/health).

## 2. Demo identities

The seed script provisions local-only accounts:

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@govt.in` | `password123` |
| District Officer (Salem) | `district@govt.in` | `password123` |
| Field Officer (Salem) | `field@govt.in` | `password123` |

Register a beneficiary through the UI with a unique email and a strong password.

**Never reuse these seeded credentials in a shared or hosted environment.** Rotate secrets and remove demo accounts before a public demo.

## 3. End-to-end workflow

1. Register a beneficiary and sign in.
2. Select an active scheme and submit an application.
3. Sign in as the Field Officer and review the new application. Add a remark and approve/forward it.
4. Sign in as the District Officer and approve/forward the application.
5. Sign in as the Administrator and make the final approval decision.
6. Sign back in as the beneficiary. Confirm the status is Approved and the approval notification is visible.
7. Open application history and explain how each decision is recorded with the actor and status transition.
8. Open the administrator's user-management page. Create a test officer with a district assignment, then deactivate the account to demonstrate access revocation.

## 4. Engineering points to explain

- PostgreSQL is the system of record; Sequelize maps the relational models.
- Versioned SQL migrations are applied in a transaction protected by a PostgreSQL transaction-scoped advisory lock. Concurrent application startups cannot apply the same pending migration simultaneously.
- Application status changes, audit entries, and workflow notifications are grouped in database transactions so a failed write rolls the workflow back.
- The backend, not the browser, enforces role, district and resource ownership.
- The API validates input with Zod, hashes passwords, signs JWTs, applies request rate limits and uses Helmet/CORS configuration.
- CI runs PostgreSQL migration/upgrade/concurrency tests, backup/restore verification, API integration tests, frontend lint/build, dependency audits, Docker smoke tests and a Playwright browser journey.
- The Render Blueprint describes a deployment target. It is not evidence that a hosted deployment is live.

## 5. Interview discussion prompts

Be ready to draw and explain:
- React browser → Nginx → Express API → Sequelize → PostgreSQL.
- The approval state machine: Pending Field Officer → Pending District Officer → Pending Admin → Approved (or Rejected).
- Why district scope is derived from the authenticated account rather than a client-supplied district.
- Why audit and notification writes belong in the same transaction as an approval.
- How the migration advisory lock and backup/restore procedure reduce operational risk.
- What must change before production: managed database configuration, secret rotation, staging restore rehearsal, monitoring, backups, and a live end-to-end deployment test.

## 6. CI screenshots

The GitHub Actions workflow uploads role-specific screenshots as the `civictrack-role-screenshots` artifact when the browser journey runs. Download that artifact from a successful CI run to use the real, test-generated screens in a portfolio walkthrough. Do not substitute mockups for screenshots of the running application.

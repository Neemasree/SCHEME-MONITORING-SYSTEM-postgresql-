<div align="center">

# 🏛️ CivicTrack

### Scheme Monitoring & Beneficiary Application Management

A role-based platform for public-benefit scheme applications, district-scoped review, multi-stage approvals, notifications, and auditable decisions.

[![CI](https://github.com/Neemasree/SCHEME-MONITORING-SYSTEM-postgresql-/actions/workflows/ci.yml/badge.svg)](https://github.com/Neemasree/SCHEME-MONITORING-SYSTEM-postgresql-/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-REST_API-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

> **Project status:** Portfolio project under hardening — **not production-ready yet**. CI validates frontend lint/build, backend syntax/lint, PostgreSQL-backed integration tests, dependency advisories, Docker image builds, and a full-stack container smoke test. A live hosted deployment has not been verified.

## ✨ What CivicTrack does

<table>
<tr>
<td width="50%" valign="top">

### 🧑‍💼 Application management
- Beneficiary registration and sign-in
- Scheme listing and application submission
- Application status tracking and review remarks
- Paginated scheme and application listings

</td>
<td width="50%" valign="top">

### 🪜 Multi-stage review
- Field Officer review
- District Officer review
- Final Admin decision
- Rejection reasons and application history
- Transactional status and audit updates

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 📊 Role-aware dashboards
- PostgreSQL-backed dashboard statistics
- Analytics with date filters
- District-scoped officer views
- District-level performance metrics

</td>
<td width="50%" valign="top">

### 🔐 Security and accountability
- JWT authentication and password hashing
- Server-side role and district authorization
- Audit timeline for application decisions
- Recipient-specific notifications
- Admin account creation, district assignment, and deactivation

</td>
</tr>
</table>

## 🧰 Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, React Router, Axios, Recharts |
| API | Node.js, Express, Helmet, Zod, Swagger UI |
| Database | PostgreSQL, Sequelize ORM, versioned SQL migrations |
| Authentication | JWT, bcryptjs, server-side role checks |
| Quality | ESLint, Prettier, Husky/lint-staged, Jest, Supertest |
| Delivery | GitHub Actions, Docker, Docker Compose, Nginx |

## 🏗️ Architecture

CivicTrack separates the browser UI, REST API, authorization and workflow rules, and PostgreSQL persistence. The API is responsible for validating role permissions and district scope; the frontend is not treated as a security boundary.

**Architecture diagrams:** [System architecture, approval lifecycle, logical data model, and Docker deployment](docs/architecture.md).

The diagrams are maintained with the implementation. When a change affects API boundaries, permissions, workflow transitions, data relationships, or deployment topology, update the diagrams in the same change.

### Key engineering decisions

- **Server-side authorization:** the API determines which roles may perform each approval transition.
- **District isolation:** an officer's scope comes from the authenticated account, not from a user-controlled query parameter.
- **Transactional writes:** approval/rejection status changes and audit records are kept consistent when a transactional write fails; related notification writes are tested for rollback behavior.
- **Auditable decisions:** application history records the actor, action, and previous/new status.
- **Privileged account control:** beneficiaries can register publicly; officer/admin accounts are provisioned through the administrative flow.
- **Safe demo data:** seed accounts and passwords are for local development only.

## 🚀 Run locally

### Prerequisites

- Node.js (use the version supported by the current lockfiles and CI)
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Neemasree/SCHEME-MONITORING-SYSTEM-postgresql-.git
cd SCHEME-MONITORING-SYSTEM-postgresql-
```

### 2. Create a local database

Create a development database in PostgreSQL:

```sql
CREATE DATABASE govt_monitoring;
```

### 3. Configure the backend

Create `backend/.env` with local values:

```env
PORT=5000
DB_NAME=govt_monitoring
DB_USER=postgres
DB_PASSWORD=replace_with_your_local_password
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_ORIGIN=http://localhost:5173
SQL_LOGGING=false
DB_POOL_MAX=10
```

Never commit real credentials, tokens, or production secrets.

### 4. Install and start the backend

```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```

The API listens on `http://localhost:5000` by default. Health check: [http://localhost:5000/health](http://localhost:5000/health).

> **Migration safety:** core tables are created by the checked-in `20261010_baseline.sql` migration; later SQL migrations are applied in filename order and recorded in `SequelizeMeta`. The migration runner does not call `sequelize.sync()`. Each migration batch is serialized with a PostgreSQL transaction-scoped advisory lock, so overlapping deploy/startup processes cannot race to apply the same pending SQL; the schema changes and migration tracking rows commit atomically. CI exercises both ordinary and concurrent migrations against disposable PostgreSQL databases, as well as migrations against a fresh disposable PostgreSQL database and a separate fixture that simulates the earlier core schema, then verifies that existing fixture records survive the upgrade. Before updating an existing hosted database, take a verified backup and rehearse the upgrade against a representative staging copy; the baseline uses `CREATE TABLE IF NOT EXISTS` and does not rewrite existing table data.

### Database backup and recovery

The backend includes PostgreSQL custom-format backup and restore commands (requires the PostgreSQL client tools `pg_dump` and `pg_restore`):

```bash
# Create a timestamped backup under backend/backups/
npm run db:backup

# Or choose an explicit output file
npm run db:backup -- --output ./backups/before-release.dump

# Restore only after confirming the target database and backup
npm run db:restore -- ./backups/before-release.dump --confirm
```

Both commands use the configured `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` environment variables. Backups are not committed to Git. Restore uses `pg_restore --clean --if-exists` and replaces matching database objects; it is destructive. Production restores are blocked unless `ALLOW_PRODUCTION_RESTORE=true` is explicitly set after an approved recovery procedure. Always restore into a staging database first and verify the application before considering production recovery. CI creates a backup from a disposable PostgreSQL database, restores it into a separate disposable database, and verifies that seeded user records survive the round trip.

### 5. Start the frontend

Open a second terminal from the repository root:

```bash
cd Frontend
npm install
npm run dev
```

Vite normally serves the UI at [http://localhost:5173](http://localhost:5173). Set `VITE_API_URL` if the API is hosted elsewhere; its default is `http://localhost:5000/api`.

### Local-only demo accounts

The seed script creates these demo officer accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@govt.in` | `password123` |
| District Officer (Salem) | `district@govt.in` | `password123` |
| Field Officer (Salem) | `field@govt.in` | `password123` |

Register a beneficiary through the UI. New passwords must be at least 12 characters and include uppercase, lowercase, and numeric characters. **These seeded credentials must never be used for a public or shared deployment.**

## 🐳 Run the full stack with Docker

Prerequisite: Docker Desktop (or Docker Engine with the Compose plugin).

```bash
docker compose up --build
```

| Service | Local URL |
|---|---|
| Frontend | [http://localhost:8080](http://localhost:8080) |
| Backend API | [http://localhost:5000](http://localhost:5000) |
| Backend health | [http://localhost:5000/health](http://localhost:5000/health) |

The first startup runs the database migration command automatically. To load local demo users and sample data:

```bash
docker compose exec backend npm run seed
```

Set `DB_PASSWORD` and `JWT_SECRET` in your shell or an untracked `.env` file before sharing the environment. Defaults are for local development only. Stop the stack with `docker compose down`; this retains the local database volume. `docker compose down -v` also deletes local database data.

## 🔌 API overview

All routes below are under `/api`, except `/health`. Protected routes require a valid access token. Interactive API documentation is available at `/api/docs` when the backend is running.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Public | Sign in |
| POST | `/auth/register` | Public | Register a beneficiary |
| GET | `/auth/users` | Admin | List users |
| POST | `/auth/users` | Admin | Create a user |
| PATCH | `/auth/users/:id/deactivate` | Admin | Deactivate a user |
| GET | `/schemes` | Authenticated | List/filter schemes |
| POST | `/schemes` | Admin | Create a scheme |
| GET | `/applications` | Authenticated | List applications within caller scope |
| POST | `/applications` | Beneficiary | Apply to an active scheme |
| PUT | `/applications/:id/approve` | Field/District/Admin | Approve, forward, or reject at the permitted stage |
| GET | `/applications/:id/history` | Authorized application viewer | Read the audit timeline |
| GET | `/dashboard/stats` | Admin/Field/District | Summary counts |
| GET | `/dashboard/analytics` | Admin/Field/District | SQL-backed analytics; optional `startDate`, `endDate`, and admin `district` |
| GET | `/performance` | Authenticated | District-level metrics |
| GET | `/notifications` | Authenticated | List recipient notifications |
| PUT | `/notifications/:id/read` | Authenticated | Mark an accessible notification as read |
| GET | `/health` | Public | Backend health |

## 🧪 Testing and CI

See [GitHub Actions](https://github.com/Neemasree/SCHEME-MONITORING-SYSTEM-postgresql-/actions) for the latest workflow result. CI currently checks:

- Frontend ESLint, production build, and high/critical dependency advisories.
- Backend JavaScript syntax, ESLint, migrations, disposable database seeding, and PostgreSQL-backed Jest/Supertest integration tests.
- Backend high/critical dependency advisories and an uploaded coverage report, with enforced global minimums of 60% lines/statements, 55% functions, and 50% branches.
- Docker Compose configuration and backend/frontend image builds using lockfiles validated by the frontend and backend jobs.
- Full-stack Docker startup, frontend availability, and proxied/direct backend health endpoints, followed by a Chromium/Playwright browser journey that registers a beneficiary, submits an application, completes field-officer and district-officer review plus final admin approval, verifies the beneficiary's refreshed status and approval notification through the Nginx `/api` proxy, and checks phone (390px) and tablet (768px) navigation layouts.
- Lockfile persistence to `main` only after required validation succeeds and only if `main` has not moved since the run began.

The backend integration suite covers authentication and invalid input, district-scoped access, dashboard date filters, multi-stage approval, audit history, notifications, and rollback when simulated persistence writes fail. A separate browser journey exercises beneficiary registration and application submission, all three approval stages, refreshed beneficiary status, and the final approval notification through the Docker/Nginx frontend. It also verifies the bottom navigation and zero page-level horizontal overflow on a 390px phone viewport, plus the compact sidebar rail on a 768px tablet viewport. A green CI run confirms the automated checks for that commit; it does not prove a live hosted deployment or production readiness.

## ☁️ Hosted deployment status

**No live hosted deployment is currently verified.** The Render Blueprint now defines both the Node.js API service and a Vite/React static site. It intentionally does not create a PostgreSQL database; connect an existing managed PostgreSQL instance so database cost, retention, and recovery settings are chosen explicitly.

### Render Blueprint services

- **API — `civictrack-api`:** builds from `backend/` with `npm ci`, runs the versioned migrations before starting the API, and exposes `/health` for the platform health check.
- **Frontend — `civictrack-web`:** builds from `Frontend/` with `npm ci && npm run build`, publishes `dist/`, and rewrites unknown paths to `/index.html` for React Router. Security response headers are configured for the static site.
- Both services use Render's `checksPass` auto-deploy trigger so deployments wait for the repository's GitHub checks.

### Required Render environment configuration

1. Provision or select a managed PostgreSQL database. The production backend enables certificate-verified PostgreSQL TLS; supply the provider's host, database name, username, password, and port.
2. Configure the API service variables: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, and `CLIENT_ORIGIN`. Set `CLIENT_ORIGIN` to the frontend's exact HTTPS origin (scheme and host, no path). The backend supports a comma-separated allowlist if more than one trusted frontend origin is required.
3. Keep `JWT_SECRET` generated by Render. Never copy a local/demo JWT secret or seeded demo password into a hosted environment.
4. Configure the static site's `VITE_API_URL` as the API's absolute HTTPS URL ending in `/api` (for example, `https://<api-host>/api`). Vite embeds this value at build time; changing it requires a new frontend build/deploy. A relative `/api` URL is not sufficient for a separate static-site/API deployment.
5. On the first Blueprint creation, Render prompts for `sync: false` values. When syncing an existing Blueprint, Render does not populate newly added `sync: false` variables automatically; add or update those values manually in the relevant service's dashboard and redeploy.
6. Rehearse the baseline and upgrade migrations against a representative staging copy, verify a restorable backup, and document recovery steps before connecting any production database. The current API start command runs the idempotent migration runner before the server starts; do not use this as a substitute for a staging rehearsal.
7. After both services deploy, verify the API `/health` endpoint, frontend deep-link refresh, login, beneficiary submission, all three approval stages, application history, and notifications. Add public URLs here only after those checks succeed.

Render's Blueprint can be checked with `render blueprints validate render.yaml` (Render CLI 2.7.0 or later). The CI Docker/browser checks validate the local full stack; they do not validate a Render Blueprint sync or prove that a hosted deployment is live.

## 🔒 Production-readiness checklist

- [ ] Rehearse baseline/upgrade migrations against a representative existing schema in staging and document a recovery plan.
- [x] Add automated authorization, district-isolation, and transaction-rollback regression tests.
- [ ] Remove local demo credentials and rotate all secrets before any shared deployment.
- [ ] Configure production database SSL, backups, monitoring, and least-privilege credentials.
- [ ] Validate rate limiting and proxy trust settings in the actual hosting environment.
- [ ] Deploy both Render services and complete a live end-to-end smoke test; document only verified URLs.
- [ ] Add real screenshots for beneficiary, field officer, district officer, and admin workflows.
- [ ] Keep [architecture diagrams](docs/architecture.md) aligned with each relevant code change.

## 📄 License

Released under the MIT License; see [LICENSE](LICENSE).

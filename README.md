<div align="center">

# 🏛️ CivicTrack

### Scheme Monitoring & Beneficiary Application Management

A role-based platform for public-benefit scheme applications, district-scoped review, multi-stage approvals, notifications, and auditable decisions.

[![CI](https://github.com/Neemasree/SCHEME-MONITORING-SYSTEM-postgresql-/actions/workflows/ci.yml/badge.svg)](https://github.com/Neemasree/SCHEME-MONITORING-SYSTEM-postgresql-/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-18-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
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

> **Migration caution:** the current migration runner calls `sequelize.sync()` before applying SQL migrations. It does not use `force` or `alter`, but model-driven schema creation is still a production risk. Replace this with a reviewed baseline migration and versioned migrations before production use. Do not run the bootstrap flow against an important production database without a verified backup and schema review.

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
- Backend high/critical dependency advisories and an uploaded coverage report.
- Docker Compose configuration and backend/frontend image builds using lockfiles validated by the frontend and backend jobs.
- Full-stack container startup, frontend availability, and proxied/direct backend health endpoints.
- Lockfile persistence to `main` only after required validation succeeds and only if `main` has not moved since the run began.

The integration suite covers authentication and invalid input, district-scoped access, dashboard date filters, multi-stage approval, audit history, notifications, and rollback when simulated persistence writes fail. A green CI run confirms the automated checks for that commit; it does not prove a live hosted deployment or production readiness.

## ☁️ Hosted deployment status

**No live deployment is currently verified.** The repository includes a Render blueprint (`render.yaml`) and Vercel SPA routing configuration (`Frontend/vercel.json`), which are templates rather than evidence of a successful hosted application.

Before adding public URLs to this README:

1. Provision a managed PostgreSQL database and configure SSL.
2. Deploy the backend using protected environment variables and a verified migration strategy.
3. Deploy the frontend with `VITE_API_URL` set to the actual backend URL.
4. Run a real end-to-end smoke test through beneficiary submission, officer review, admin decision, audit history, and notifications.
5. Document only the URLs and results that have been verified.

## 🔒 Production-readiness checklist

- [ ] Replace the migration bootstrap with a reviewed baseline and explicit versioned migrations.
- [ ] Verify authorization, district isolation, and transaction rollback with automated tests.
- [ ] Remove local demo credentials and rotate all secrets before any shared deployment.
- [ ] Configure production database SSL, backups, monitoring, and least-privilege credentials.
- [ ] Validate rate limiting and proxy trust settings in the actual hosting environment.
- [ ] Complete a live end-to-end smoke test and document verified deployment URLs.
- [ ] Add real screenshots for beneficiary, field officer, district officer, and admin workflows.
- [ ] Keep [architecture diagrams](docs/architecture.md) aligned with each relevant code change.

## 📄 License

Released under the MIT License; see [LICENSE](LICENSE).

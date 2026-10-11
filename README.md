# CivicTrack — Government Scheme Monitoring System

A full-stack application for managing government schemes, reviewing beneficiary applications, and monitoring district-level performance through role-specific dashboards.

> **Project status:** Student full-stack project in active development. Features listed under *Planned upgrades* are goals, not claims about current production functionality.

## Overview

CivicTrack is designed around a multi-level review workflow for public-sector scheme applications. It provides a web interface for administrators and officers to manage schemes, review applications, see performance summaries, and receive notifications.

## Tech Stack

- **Frontend:** React, Vite, React Router, Axios, Recharts, Lucide React
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **ORM:** Sequelize
- **Authentication foundations:** JSON Web Tokens (JWT), bcryptjs

## Current Capabilities

- Role-specific navigation and dashboards for administrators, district officers, and field officers
- Scheme listing and scheme creation
- Application listing and status-update endpoint
- Dashboard statistics and district/scheme charts
- Notifications with read-status updates
- PostgreSQL models for users, schemes, applications, performance, and notifications
- Development seed data for exploring the UI locally

## Architecture

```text
React + Vite
    |
    | HTTP / JSON
    v
Express REST API
    |
    v
Sequelize ORM
    |
    v
PostgreSQL
```

The frontend lives in `Frontend/`; the API and database code live in `backend/`.

## Run Locally

### Prerequisites

- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Neemasree/SCHEME-MONITORING-SYSTEM-postgresql-.git
cd SCHEME-MONITORING-SYSTEM-postgresql-
```

### 2. Create a PostgreSQL database

For example, in `psql`:

```sql
CREATE DATABASE govt_monitoring;
```

### 3. Configure the backend

Create `backend/.env` and provide your local database configuration:

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

Never commit real credentials or production secrets. Configure environment variables in your deployment platform as well.

### 4. Install backend dependencies and seed development data

```bash
cd backend
npm install
npm run seed
npm run dev
```

**Warning:** The current development seed script uses `sequelize.sync({ force: true })`, which drops and recreates tables. Use it only with a disposable local database. Do not run it against data you need to preserve.

The API is configured to listen on port `5000` by default.

### 5. Start the frontend

Open a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## API Areas

| Area | Base path | Current purpose |
|---|---|---|
| Authentication | `/api/auth` | Login and registration |
| Dashboard | `/api/dashboard` | Summary statistics and analytics |
| Schemes | `/api/schemes` | List and create schemes |
| Applications | `/api/applications` | List applications and update decisions |
| Performance | `/api/performance` | District performance data |
| Notifications | `/api/notifications` | List notifications and mark them read |

Confirm endpoint protection and permissions before exposing this API publicly.

## Planned Upgrades

- Enforce JWT authentication and server-side role-based authorization on protected endpoints.
- Prevent public self-registration with privileged roles.
- Implement a validated, multi-stage application approval workflow.
- Create a dedicated audit-log table for immutable decision history.
- Normalize database relationships with foreign keys, constraints, indexes, and Sequelize migrations.
- Replace seeded chart values with SQL-backed analytics calculated from live records.
- Add request validation, centralized error handling, pagination, and rate limiting.
- Add API tests and frontend build/lint checks in GitHub Actions.
- Containerize the application with Docker and document deployment.

## Security Notes

This repository is a development project and should not be used with real beneficiary or sensitive personal data until security and privacy controls have been reviewed. In particular, ensure JWT signing secrets are mandatory and never fall back to a hardcoded secret; restrict registration roles; protect APIs with authentication and authorization; use HTTPS in deployment; and store only the data necessary for the workflow.

## Contributing

1. Create a feature branch.
2. Make a focused change.
3. Run the applicable checks locally.
4. Open a pull request describing the change and its test coverage.

## License

No license is currently specified. Add a license file if you intend to allow others to reuse the project.

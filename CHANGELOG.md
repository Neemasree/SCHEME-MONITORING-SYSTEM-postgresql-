# Changelog

All notable project changes are documented here.

## Unreleased

### Security and reliability
- Added centralized Zod validation for environment configuration and key write requests.
- Added Helmet security headers, compression, proxy-aware settings, request IDs, and structured request logging.
- Added shared authentication and write-rate limits.
- Added database-aware health checks, production PostgreSQL SSL verification, graceful shutdown, and normalized API errors.
- Added JWT expiry handling in the frontend and role-aware route guards.

### UI polish
- Added a React error boundary, a real 404 page, dashboard retry/empty states, and route-specific page titles.
- Added keyboard focus styles, reduced-motion support, modal focus trapping, and Escape-to-close.
- Replaced alert-based report messaging with inline feedback and added notification/report/district error states.
- Added CivicTrack favicon and document metadata.

### Developer experience
- Added Dockerfiles, Docker Compose, Nginx SPA/API routing, and local setup documentation.
- Added Swagger UI at `/api/docs` and an OpenAPI contract.
- Added backend ESLint/Prettier, Husky/lint-staged, Dependabot, dependency audit checks, and Jest coverage artifacts.
- Expanded integration tests for malformed input, role denial, expired tokens, and approval workflow transitions.
- Removed unused dummy data and the stray frontend dependency folder.

### Verification notes
- Frontend lint/build and backend lint have passed in observed CI runs.
- Dependency audit currently reports unresolved advisories; the pipeline intentionally fails the audit gate until dependency updates address them.
- Verify the latest PostgreSQL integration-test result in GitHub Actions before treating the project as release-ready.
- Hosting, production secrets, role screenshots, and the workflow GIF remain unverified.

# CivicTrack Architecture

> **Source of truth for the architecture diagrams.** Update this file whenever an implementation change affects the application layers, database relationships, authorization, approval lifecycle, API integration, or deployment topology. Keep the README linked to this document.

## 1. System architecture

```mermaid
flowchart TB
  subgraph CLIENT["Client layer"]
    BENEFICIARY["Beneficiary"]
    FIELD["Field Officer"]
    DISTRICT["District Officer"]
    ADMIN["Administrator"]
    WEB["React + Vite SPA<br/>React Router · Axios · Recharts"]
    BENEFICIARY --> WEB
    FIELD --> WEB
    DISTRICT --> WEB
    ADMIN --> WEB
  end

  subgraph API["Application layer · Node.js + Express"]
    HTTP["REST API"]
    SEC["Security middleware<br/>Helmet · CORS · input validation"]
    AUTH["JWT authentication<br/>bcryptjs · server-side role checks"]
    SCOPE["Authorization<br/>role + district + resource ownership"]
    ROUTES["Route handlers<br/>auth · schemes · applications · dashboard"]
    NOTIFY["Notifications"]
    HISTORY["Audit timeline"]
    HTTP --> SEC --> AUTH --> SCOPE --> ROUTES
    ROUTES --> NOTIFY
    ROUTES --> HISTORY
  end

  subgraph DOMAIN["Workflow and business rules"]
    STAGES["Multi-stage review<br/>Field Officer → District Officer → Admin"]
    TX["Database transaction<br/>status + audit + notification writes"]
    STAGES --> TX
  end

  subgraph DATA["Persistence layer"]
    ORM["Sequelize ORM"]
    PG[("PostgreSQL<br/>users · schemes · applications<br/>notifications · audit logs")]
    ORM <--> PG
  end

  subgraph DELIVERY["Local delivery / deployment"]
    NGINX["Nginx / Docker Compose"]
    CI["GitHub Actions<br/>lint · build · tests · audit · image build"]
  end

  WEB -->|"JSON + JWT"| NGINX
  NGINX --> HTTP
  ROUTES --> STAGES
  TX --> ORM
  CI -. "validates" .-> WEB
  CI -. "validates" .-> API
  CI -. "validates" .-> PG

  classDef client fill:#dbeafe,stroke:#2563eb,color:#1e3a8a,stroke-width:2px
  classDef app fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-width:2px
  classDef domain fill:#fef3c7,stroke:#d97706,color:#78350f,stroke-width:2px
  classDef data fill:#e0e7ff,stroke:#4f46e5,color:#312e81,stroke-width:2px
  classDef ops fill:#f3e8ff,stroke:#9333ea,color:#581c87,stroke-width:2px
  class BENEFICIARY,FIELD,DISTRICT,ADMIN,WEB client
  class HTTP,SEC,AUTH,SCOPE,ROUTES,NOTIFY,HISTORY app
  class STAGES,TX domain
  class ORM,PG data
  class NGINX,CI ops
```

### Request and authorization flow

1. A user interacts with the React application.
2. The frontend sends requests to the Express API.
3. The API validates the access token and checks the user's role and resource scope.
4. For officer roles, district scope is derived from the authenticated account; a request parameter must not grant access to another district.
5. The route applies the permitted business transition and writes related state changes in a database transaction where required.
6. Authorized clients can read notifications and application history through their respective API routes.

## 2. Application approval lifecycle

```mermaid
stateDiagram-v2
  direction LR
  [*] --> PendingFieldOfficer: Beneficiary submits
  PendingFieldOfficer --> PendingDistrictOfficer: Field Officer approves
  PendingFieldOfficer --> Rejected: Field Officer rejects
  PendingDistrictOfficer --> PendingAdmin: District Officer approves
  PendingDistrictOfficer --> Rejected: District Officer rejects
  PendingAdmin --> Approved: Admin approves
  PendingAdmin --> Rejected: Admin rejects
  Approved --> [*]
  Rejected --> [*]
```

The API enforces which role may approve or reject at each stage. Rejection requires a reason. Status changes, audit records, and related notifications must remain consistent if a transactional write fails.

## 3. Logical data relationships

```mermaid
erDiagram
  USERS ||--o{ APPLICATIONS : submits
  USERS ||--o{ NOTIFICATIONS : receives
  USERS ||--o{ AUDIT_LOGS : performs
  APPLICATIONS ||--o{ AUDIT_LOGS : records
  USERS {
    int id PK
    string email
    string role
    string district
    boolean isActive
  }
  APPLICATIONS {
    int id PK
    int beneficiaryUserId FK
    string scheme
    string district
    string status
    date dateApplied
  }
  NOTIFICATIONS {
    int id PK
    int userId FK
    string role
    string title
    boolean isRead
  }
  AUDIT_LOGS {
    bigint id PK
    int entityId
    int actorId
    string action
    string previousStatus
    string newStatus
  }
```

This is a **logical overview**, not a replacement for the Sequelize models and SQL migrations. If model names, keys, or relationships change, verify the implementation and update this diagram before describing the schema as current.

## 4. Deployment topology

```mermaid
flowchart LR
  BROWSER["Browser"] -->|"localhost:8080"| NGINX["Frontend container<br/>Nginx + built React SPA"]
  NGINX -->|"API requests"| API["Backend container<br/>Express · port 5000"]
  API -->|"DB connection"| DB[("PostgreSQL container<br/>persistent volume")]
  API --> HEALTH["/health"]
  DB --> READY["Readiness / health check"]
```

Docker Compose is intended for a local demonstration. GitHub Actions checks frontend lint/build, backend syntax/lint, PostgreSQL-backed integration tests, dependency advisories, Compose configuration, image builds, and a full-stack smoke test. A passing CI run does **not** establish that a hosted deployment is live or production-ready.

## 5. Architecture update checklist

When changing CivicTrack, update this document and the README if the change affects:

- Frontend routes, API endpoints, authentication, or role-specific screens.
- Approval transitions, district scoping, audit history, or notification behavior.
- Sequelize models, SQL migrations, keys, constraints, or transactions.
- Docker services, ports, health checks, reverse proxy, or deployment configuration.
- CI jobs, test coverage claims, setup commands, or verified deployment status.

Keep diagrams grounded in code and tests. Do not add speculative services or claim that a hosted deployment has been verified without evidence.

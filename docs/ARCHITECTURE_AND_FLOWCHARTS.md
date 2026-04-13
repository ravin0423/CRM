# Architecture &amp; Flowcharts — Internal Support CRM

> **Status:** scaffolding complete · implementation in progress
> **Last updated:** 2026-04-11
> **Branch:** `claude/execute-prompt-docs-rBNtz`

This document is the companion to the build prompt in the project brief.
It captures the architecture, component boundaries, flowcharts, and the
implementation roadmap so a non-technical operator — and any future
developer — has a single reference.

All diagrams are written in [Mermaid](https://mermaid.js.org/) so they render
natively on GitHub.

---

## Table of Contents

1. [Guiding Principles](#guiding-principles)
2. [High-Level System Architecture](#high-level-system-architecture)
3. [Runtime Configuration Flow](#runtime-configuration-flow)
4. [Database Abstraction Layer](#database-abstraction-layer)
5. [Request Lifecycle](#request-lifecycle)
6. [Freshdesk Import Wizard Flow](#freshdesk-import-wizard-flow)
7. [Storage Abstraction (MinIO ↔ S3)](#storage-abstraction-minio--s3)
8. [Deployment Topologies](#deployment-topologies)
9. [Ticket State Machine](#ticket-state-machine)
10. [AI Chatbot RAG Flow](#ai-chatbot-rag-flow)
11. [Backup &amp; Recovery Flow](#backup--recovery-flow)
12. [Data Model](#data-model)
13. [Admin Panel Tab Map](#admin-panel-tab-map)
14. [Security Model](#security-model)
15. [Implementation Roadmap](#implementation-roadmap)

---

## Guiding Principles

1. **Zero hardcoded configuration.** Every value a human might want to change —
   database URL, SMTP host, storage endpoint, API base URL — lives in
   `admin_settings.json` and is editable from the Admin Panel.
2. **Database agnostic.** SQL Server Express and MongoDB are first-class peers.
   A single `DatabaseInterface` abstraction means the rest of the codebase
   never cares which one is active.
3. **Storage agnostic.** MinIO and S3 implement the same `ObjectStorage`
   protocol. Swap one line of config to migrate.
4. **Local-first, cloud-ready.** `docker-compose up` must produce a fully
   functional CRM. AWS deployment is a button in the Admin Panel.
5. **Non-technical operator.** If a feature cannot be configured from the UI,
   it is broken.
6. **Auditable.** Every admin action and data mutation writes an `audit_log`
   row.
7. **Reversible.** Backups run on a schedule; restore is a one-click action.

---

## High-Level System Architecture

```mermaid
flowchart TB
    subgraph Browser["Operator / Agent Browser"]
        FE["React 18 + Vite<br/>Tailwind + shadcn/ui<br/>TanStack Query + Zustand"]
    end

    subgraph Backend["Backend (FastAPI, Python 3.11)"]
        API["REST API /api/v1"]
        CFG["ConfigManager"]
        DBIF["DatabaseInterface"]
        STIF["ObjectStorage"]
        WRK["Celery Workers"]
    end

    subgraph Infra["Infrastructure"]
        SQL[("SQL Server Express")]
        MONGO[("MongoDB")]
        REDIS[("Redis")]
        RMQ[("RabbitMQ")]
        MINIO[("MinIO")]
        S3[("AWS S3")]
    end

    subgraph External["External Systems"]
        FD["Freshdesk API"]
        SMTP["SMTP Server"]
        SLACK["Slack"]
        CAL["Google / Outlook Calendar"]
    end

    FE -->|JWT| API
    API --> CFG
    API --> DBIF
    API --> STIF
    API -->|enqueue| RMQ
    WRK --> RMQ
    WRK --> DBIF
    WRK --> STIF
    WRK --> FD
    WRK --> SMTP
    WRK --> SLACK
    WRK --> CAL

    DBIF -.->|if sqlserver| SQL
    DBIF -.->|if mongodb| MONGO
    STIF -.->|if minio| MINIO
    STIF -.->|if s3| S3
    API --> REDIS
```

**Notes**

- The frontend **never** embeds a backend URL. It fetches `/config.json` at
  boot, which is maintained by the backend from `admin_settings.json`.
- The same binary runs locally and on AWS. Only the `deployment` section of
  the settings changes.

---

## Runtime Configuration Flow

```mermaid
sequenceDiagram
    autonumber
    participant OP as Operator
    participant UI as Admin Panel (React)
    participant API as Backend API
    participant CFG as ConfigManager
    participant FS as admin_settings.json
    participant SVC as Running Services

    OP->>UI: Opens Settings → Database tab
    UI->>API: GET /admin/settings
    API->>CFG: current()
    CFG->>FS: read file
    CFG-->>API: redacted config
    API-->>UI: JSON (secrets as ***)
    OP->>UI: Edits fields, clicks Test Connection
    UI->>API: POST /admin/settings/database/test
    API->>SVC: DatabaseFactory.build(payload).ping()
    SVC-->>API: ok / error
    API-->>UI: result
    OP->>UI: Clicks Save
    UI->>API: PUT /admin/settings
    API->>CFG: save(payload) (encrypts secrets)
    CFG->>FS: atomic write
    CFG->>SVC: hot-reload connections
    API-->>UI: updated redacted config
```

Key rules:

- Secrets leaving the backend are always redacted to `"***"`.
- Saving is **atomic**: write to temp file, fsync, rename.
- After save, long-lived connections are rebuilt so no restart is needed.

---

## Database Abstraction Layer

```mermaid
classDiagram
    class DatabaseInterface {
        +users: UserRepo
        +tickets: TicketRepo
        +contacts: ContactRepo
        +connect()
        +disconnect()
        +ensure_schema()
        +ping() bool
    }

    class SQLServerDatabase {
        -engine: AsyncEngine
        +connect()
        +ensure_schema()
    }

    class MongoDatabase {
        -client: AsyncIOMotorClient
        +connect()
        +ensure_schema()
    }

    class DatabaseFactory {
        +build(cfg) DatabaseInterface
    }

    DatabaseInterface <|.. SQLServerDatabase
    DatabaseInterface <|.. MongoDatabase
    DatabaseFactory --> DatabaseInterface : creates
```

**Why this matters:** every feature module imports `DatabaseInterface`, never
`sqlalchemy` or `motor` directly. Swapping backends is a config change.

---

## Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Client (React)
    participant CDN as Reverse Proxy (nginx / ALB)
    participant API as FastAPI
    participant AUTH as JWT Middleware
    participant RL as Rate Limiter
    participant DB as DatabaseInterface
    participant CACHE as Redis

    C->>CDN: HTTPS request
    CDN->>API: forward
    API->>AUTH: verify bearer
    AUTH-->>API: user context
    API->>RL: check bucket
    RL-->>API: allow
    API->>CACHE: GET cache key
    alt hit
        CACHE-->>API: payload
    else miss
        API->>DB: query
        DB-->>API: rows
        API->>CACHE: SETEX
    end
    API-->>C: JSON
```

---

## Freshdesk Import Wizard Flow

```mermaid
flowchart LR
    S1["1. Connect<br/>domain + API key"]
    S2["2. Inventory<br/>counts per object"]
    S3["3. Map fields<br/>status / priority / custom"]
    S4["4. Preview<br/>sample rows"]
    S5["5. Confirm<br/>create backup?"]
    S6["6. Running<br/>progress bar"]
    S7["7. Done<br/>summary + verify"]

    S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7
    S5 -. cancel .-> CANCEL[Abort]
    S6 -. fail .-> ROLLBACK[Rollback from backup]
```

**Background job** (Celery, `freshdesk_import_job`):

```mermaid
sequenceDiagram
    participant UI as Wizard UI
    participant API as /integrations/freshdesk/*
    participant Q as RabbitMQ
    participant W as Celery Worker
    participant FD as Freshdesk API
    participant DB as DatabaseInterface

    UI->>API: POST /start (mapping, options)
    API->>Q: enqueue freshdesk_import_job
    API-->>UI: job_id
    loop Poll
        UI->>API: GET /status/{job_id}
        API-->>UI: {progress, stage}
    end
    W->>FD: paginate tickets
    W->>DB: upsert contacts → tickets → comments
    W->>DB: update audit_log
    W-->>API: completion
```

---

## Storage Abstraction (MinIO ↔ S3)

```mermaid
classDiagram
    class ObjectStorage {
        <<interface>>
        +put(key, data, content_type) string
        +get(key) bytes
        +delete(key)
        +presign(key, ttl) string
    }

    class MinIOStorage {
        -client: Minio
    }

    class S3Storage {
        -client: boto3.S3
    }

    ObjectStorage <|.. MinIOStorage
    ObjectStorage <|.. S3Storage
```

Upload flow from the ticket UI:

```mermaid
sequenceDiagram
    participant UI
    participant API
    participant ST as ObjectStorage
    participant DB

    UI->>API: POST /tickets/{id}/attachments (multipart)
    API->>ST: put(key, bytes, content_type)
    ST-->>API: public key
    API->>DB: insert attachment row
    API-->>UI: {id, url (presigned)}
```

---

## Deployment Topologies

### Local (Docker Compose)

```mermaid
flowchart LR
    U[User] -->|http://localhost:3000| FE[frontend]
    FE -->|http://localhost:8000| BE[backend]
    BE --> PG[(postgres)]
    BE --> SS[(sqlserver)]
    BE --> MG[(mongo)]
    BE --> RD[(redis)]
    BE --> RM[(rabbitmq)]
    BE --> MN[(minio)]
    BE --> WK[celery worker]
    WK --> RM
```

### AWS

```mermaid
flowchart LR
    U[User] -->|HTTPS| R53[Route 53]
    R53 --> ALB[Application Load Balancer]
    ALB --> EC2a[EC2 - backend]
    ALB --> EC2b[EC2 - frontend]
    EC2a --> RDS[(RDS SQL Server)]
    EC2a --> ATLAS[(MongoDB Atlas)]
    EC2a --> EC[(ElastiCache Redis)]
    EC2a --> MQ[(Amazon MQ)]
    EC2a --> S3B[(S3 bucket)]
```

Switching from Local to AWS only changes:
- `deployment.environment` → `aws`
- `database.*` → RDS / Atlas connection strings
- `storage.type` → `s3`
- `email.smtp_host` → SES or external SMTP

No code changes.

---

## Ticket State Machine

```mermaid
stateDiagram-v2
    [*] --> open : created
    open --> pending : waiting on customer
    open --> resolved : agent resolves
    pending --> open : customer replies
    pending --> resolved : agent resolves
    resolved --> closed : auto after 72h
    resolved --> open : reopened
    closed --> [*]
```

---

## AI Chatbot RAG Flow

```mermaid
sequenceDiagram
    participant U as User
    participant BOT as Chatbot UI
    participant API as /chatbot
    participant EMB as Embedding Model
    participant VS as Vector Store
    participant LLM as LLM
    participant TIC as Ticket Service

    U->>BOT: message
    BOT->>API: POST /message
    API->>EMB: embed(question)
    EMB-->>API: vector
    API->>VS: top-k knowledge articles
    VS-->>API: snippets
    API->>LLM: prompt(question + snippets)
    LLM-->>API: reply + confidence
    alt low confidence or abusive
        API->>TIC: auto-create ticket
        API-->>BOT: reply + "escalated"
    else
        API-->>BOT: reply
    end
```

---

## Backup &amp; Recovery Flow

```mermaid
sequenceDiagram
    participant SCH as Scheduler (Celery beat)
    participant W as Worker
    participant DB as DatabaseInterface
    participant ST as ObjectStorage
    participant BK as Backup Location

    SCH->>W: backup_now()
    W->>DB: dump schema + data → backup.zip
    W->>ST: bundle attachments
    W->>BK: upload backup-YYYY-MM-DD-HH-MM.zip
    W->>DB: record in admin_settings.backups
```

Restore reverses the steps: pick a backup → worker restores DB → swaps active
storage bucket → audit log records event.

---

## Data Model

See [`backend/app/models/schema.sql`](../backend/app/models/schema.sql) for
the SQL Server DDL. MongoDB uses analogous collections with identical field
names so the `DatabaseInterface` layer can translate seamlessly.

Core entities:

| Entity              | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `users`             | Agents and admins                           |
| `tickets`           | Support tickets                             |
| `ticket_comments`   | Replies &amp; internal notes                |
| `contacts`          | CRM contacts                                |
| `deals`             | Sales pipeline                              |
| `knowledge_articles`| Knowledge base                              |
| `workflows`         | Automation rules (JSON conditions/actions)  |
| `chat_conversations`| Chatbot history                             |
| `admin_settings`    | Persisted Admin Panel state (encrypted)     |
| `audit_log`         | Every admin / data mutation                 |

---

## Admin Panel Tab Map

| Tab              | Backend endpoints                                 | Notes                           |
| ---------------- | ------------------------------------------------- | ------------------------------- |
| Database         | `GET/PUT /admin/settings`, `POST …/database/test` | Dual-DB switch + test           |
| Email            | `POST …/email/test`                               | SMTP credentials                |
| File Storage     | `POST …/storage/test`                             | MinIO ↔ S3 toggle               |
| API              | `GET/PUT /admin/settings`                         | Writes runtime `/config.json`   |
| Integrations     | `/integrations/freshdesk/*`, slack, calendar      | Import wizard launches here     |
| Users            | `/users/*`                                        | RBAC                            |
| Backup &amp; Recovery | `/admin/backup/*`                             | Schedule, backup now, restore   |
| Deployment       | `/admin/deploy/*`                                 | Local ↔ AWS                     |
| System Health    | `/health`, component pings                        | Live status                     |
| About / Help     | static                                            | Docs, version, support          |

---

## Security Model

- **AuthN:** JWT (HS256 by default, RS256 optional) with refresh tokens.
- **AuthZ:** RBAC with Admin, Agent, Viewer roles; Admin required for
  `/admin/*` endpoints.
- **Password storage:** bcrypt, cost factor 12.
- **Secret storage:** Fernet symmetric encryption; master key from OS keyring
  (local) or AWS KMS (cloud).
- **Transport:** HTTPS only in production. Dev uses plain HTTP.
- **Headers:** CSP, HSTS, X-Frame-Options, Referrer-Policy set globally.
- **CSRF:** Double-submit cookie on mutating routes.
- **Rate limiting:** 100 req/min per user via Redis token buckets.
- **Audit:** Append-only `audit_log` table records (user, action, entity,
  entity_id, timestamp, ip).

---

## Implementation Roadmap

### Phase 0 — Scaffold (this commit)
- [x] Repo layout, Docker Compose, configuration skeleton
- [x] FastAPI app + router wiring
- [x] DatabaseInterface, DatabaseFactory, empty adapters
- [x] ConfigManager, crypto stub, bootstrap first-run
- [x] React + Vite + TS frontend skeleton
- [x] Admin Panel with 10 tab shells
- [x] This architecture document

### Phase 1 — Core System (must-have)
- [ ] SQL Server adapter: real SQLAlchemy async engine, Alembic migrations
- [ ] MongoDB adapter: Motor, index creation, cursor helpers
- [ ] Auth: JWT issue / verify / refresh; bcrypt
- [ ] Ticket CRUD, state machine, replies, internal notes
- [ ] Contact + Deal CRUD
- [ ] SMTP integration, verified via Test Email button
- [ ] MinIO upload / download / presigned URLs
- [ ] Admin Panel real forms + Save / Test buttons

### Phase 2 — Advanced Features (should-have)
- [ ] Knowledge base with WYSIWYG + public portal
- [ ] Workflow engine (trigger → conditions → actions, JSON)
- [ ] Analytics dashboards, CSAT surveys
- [ ] AI chatbot (RAG over knowledge base)
- [ ] Freshdesk import wizard (full six-step flow + rollback)

### Phase 3 — Enterprise (nice-to-have)
- [ ] AWS one-click deployment (Terraform in `deploy/aws`)
- [ ] S3 storage adapter
- [ ] Slack + Google / Outlook calendar integrations
- [ ] Custom plugin loader
- [ ] HA / multi-node deployment

### Acceptance Gates
Each phase must pass:

1. `docker-compose up` with zero manual steps
2. `pytest -q` green in `backend/`
3. `npm run build` green in `frontend/`
4. Setup wizard completable by a non-technical user in under 15 minutes
5. Zero hardcoded credentials or URLs (grep gate in CI)

# Internal Support CRM

Production-ready, self-hosted Support CRM that consolidates Freshdesk, Salesforce,
and Zoho CRM features into a single application. Designed for non-technical operators:
**all configuration happens inside the Admin Panel, nothing is hardcoded.**

## Highlights

- **Dual database support** — switch between SQL Server Express and MongoDB from
  the Admin Panel without touching code.
- **Pluggable storage** — MinIO for local, AWS S3 for cloud. One dropdown.
- **Local-first** — runs on any laptop via `docker-compose up`.
- **AWS-ready** — one-click deployment to EC2 + RDS + S3.
- **Freshdesk import wizard** — guided migration of tickets, contacts, and templates.
- **Zero hardcoded config** — database URLs, SMTP, storage keys, API base URLs are
  all stored in `admin_settings` and editable from the UI.

## Repository Layout

```
CRM/
├── backend/              FastAPI service (Python 3.11+)
│   ├── app/
│   │   ├── api/v1/       REST endpoints
│   │   ├── core/         Settings loader, security, config manager
│   │   ├── db/           Database abstraction (SQL Server + MongoDB)
│   │   ├── models/       ORM + ODM models
│   │   ├── schemas/      Pydantic request/response schemas
│   │   ├── services/     Business logic
│   │   ├── workers/      Celery tasks
│   │   └── integrations/ Freshdesk, Slack, Email, MinIO/S3 adapters
│   ├── config/           Config templates (no secrets)
│   └── tests/
├── frontend/             React 18 + Vite + TypeScript + Tailwind + shadcn/ui
│   ├── src/
│   │   ├── components/admin/   Admin Panel tabs
│   │   ├── pages/              Tickets, CRM, KB, Chatbot, Analytics
│   │   ├── lib/                API client, query helpers
│   │   ├── store/              Zustand stores
│   │   └── types/
├── config/               Runtime config (generated, git-ignored)
├── deploy/
│   ├── local/            docker-compose and local helpers
│   └── aws/              Terraform / CloudFormation for AWS
├── docs/                 Architecture, flowcharts, runbooks
├── scripts/              Setup, backup, migration helpers
└── docker-compose.yml    One-command local startup
```

## Quick Start (Local)

```bash
# 1. Clone and enter the repo
git clone <repo-url> && cd CRM

# 2. Start everything
docker-compose up

# 3. Open the app
open http://localhost:3000

# 4. Log in with the default admin
#    email:    admin@company.com
#    password: password123
#    (change this immediately from Settings → Users)
```

## Configuration

Everything is configured from the **Admin Panel** (Settings icon, top-right).
See [`docs/ARCHITECTURE_AND_FLOWCHARTS.md`](docs/ARCHITECTURE_AND_FLOWCHARTS.md)
for a tab-by-tab walkthrough and system diagrams.

## Status

This repository is currently at the **scaffolding** phase. See
[`docs/ARCHITECTURE_AND_FLOWCHARTS.md`](docs/ARCHITECTURE_AND_FLOWCHARTS.md)
for the full specification and implementation roadmap.

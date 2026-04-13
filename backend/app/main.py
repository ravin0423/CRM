"""
FastAPI entrypoint.

Responsibilities on startup:
 1. Load admin_settings.json (created by the Admin Panel) if present.
 2. Fall back to bootstrap environment variables for the very first boot.
 3. Initialise the selected database (SQL Server OR MongoDB).
 4. Auto-create schema / collections on first run.
 5. Seed the initial admin user if no users exist.
 6. Register routers and middleware.

No database URLs, SMTP settings, storage keys, or API hosts are read from
source code. Every value comes from :mod:`app.core.config_manager`, which in
turn reads the admin panel's settings file.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import api_router
from app.core.bootstrap import bootstrap_first_run
from app.core.config_manager import ConfigManager
from app.db.database_factory import DatabaseFactory
from app.services.ticket_service import InvalidTicketTransition


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ---
    config = ConfigManager.load()
    app.state.config = config

    db = DatabaseFactory.build(config.database)
    await db.connect()
    await db.ensure_schema()
    app.state.db = db

    await bootstrap_first_run(db, config)

    yield

    # --- SHUTDOWN ---
    await db.disconnect()


app = FastAPI(
    title="Internal Support CRM",
    version="1.0.0-dev",
    lifespan=lifespan,
)

# CORS: permissive in dev; tighten via Admin Panel → API tab in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.exception_handler(InvalidTicketTransition)
async def _invalid_transition_handler(_request: Request, exc: InvalidTicketTransition):
    # The state machine is a business-rule violation, not a client payload
    # error — Phase 1.5 will promote this to a 409 with a structured error
    # code once we have an error-envelope contract agreed with the frontend.
    return JSONResponse(status_code=500, content={"detail": str(exc)})


@app.get("/health")
async def health():
    db = getattr(app.state, "db", None)
    db_ok = False
    if db is not None:
        try:
            db_ok = await db.ping()
        except Exception:
            db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "version": app.version,
        "components": {"database": "up" if db_ok else "down"},
    }

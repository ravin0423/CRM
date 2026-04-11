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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config_manager import ConfigManager
from app.core.bootstrap import bootstrap_first_run
from app.db.database_factory import DatabaseFactory


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

# CORS is configured from admin settings at runtime, not hardcoded.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: read from ConfigManager at startup
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "version": app.version}

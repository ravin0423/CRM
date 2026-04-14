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

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1 import api_router
from app.core.bootstrap import bootstrap_first_run
from app.core.config_manager import ConfigManager
from app.core.logging import get_logger, setup_logging
from app.db.database_factory import DatabaseFactory
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.rate_limit import limiter
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.services.ticket_service import InvalidTicketTransition

# Initialise structured logging early
_env = os.getenv("CRM_ENV", "production")
setup_logging(
    log_level=os.getenv("CRM_LOG_LEVEL", "INFO"),
    json_output=(_env != "development"),
)
logger = get_logger("crm.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ---
    logger.info("startup", env=_env)
    config = ConfigManager.load()
    app.state.config = config

    db = DatabaseFactory.build(config.database)
    await db.connect()
    await db.ensure_schema()
    app.state.db = db

    await bootstrap_first_run(db, config)
    logger.info("startup_complete")

    yield

    # --- SHUTDOWN ---
    logger.info("shutdown")
    await db.disconnect()


app = FastAPI(
    title="Internal Support CRM",
    version="1.0.0",
    lifespan=lifespan,
)

# --- Middleware (order matters: outermost first) ---

# 1. Global error handler — catches unhandled exceptions
app.add_middleware(ErrorHandlerMiddleware)

# 2. Security headers on every response
app.add_middleware(SecurityHeadersMiddleware)

# 3. CORS — read allowed origins from config, default permissive in dev
_cors_origins = os.getenv("CRM_CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(api_router, prefix="/api/v1")


@app.exception_handler(InvalidTicketTransition)
async def _invalid_transition_handler(_request: Request, exc: InvalidTicketTransition):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


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

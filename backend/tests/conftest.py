"""
Shared pytest fixtures.

We stand up the full FastAPI app against the SQLite fallback inside
``SQLServerDatabase`` so there's no SQL Server dependency for CI or local
test runs. The admin_settings.json used during tests lives in a temp dir
so real operator settings are never touched.
"""

from __future__ import annotations

import os
import tempfile
from collections.abc import AsyncIterator
from pathlib import Path

import pytest
import pytest_asyncio

# Configure env vars BEFORE importing the app — ConfigManager reads them.
_tmp = Path(tempfile.mkdtemp(prefix="crm-tests-"))
os.environ["CRM_CONFIG_PATH"] = str(_tmp / "admin_settings.json")
os.environ["CRM_MASTER_KEY_B64"] = "yDI3ENBgC3blcjhmqN2YEqP0l7dCGwyO3EDFqRBBxQQ="  # fixed test key
# Force SQLite fallback by leaving SQL Server creds empty.


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    return "asyncio"


@pytest_asyncio.fixture
async def app_client() -> AsyncIterator:
    from httpx import ASGITransport, AsyncClient

    from app.main import app

    # Manually run the lifespan.
    async with app.router.lifespan_context(app):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as client:
            yield client


@pytest_asyncio.fixture
async def admin_token(app_client) -> str:
    r = await app_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@company.com", "password": "password123"},
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture
def auth_headers(admin_token) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}

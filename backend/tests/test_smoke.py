import pytest


@pytest.mark.asyncio
async def test_health(app_client):
    r = await app_client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] in {"ok", "degraded"}
    assert "components" in body


@pytest.mark.asyncio
async def test_bootstrap_admin_can_login(app_client):
    r = await app_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@company.com", "password": "password123"},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["access_token"]
    assert data["must_change_password"] is True


@pytest.mark.asyncio
async def test_login_rejects_bad_password(app_client):
    r = await app_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@company.com", "password": "wrong"},
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_auth(app_client):
    r = await app_client.get("/api/v1/auth/me")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_me_with_token(app_client, auth_headers):
    r = await app_client.get("/api/v1/auth/me", headers=auth_headers)
    assert r.status_code == 200
    me = r.json()
    assert me["email"] == "admin@company.com"
    assert me["role"] == "admin"

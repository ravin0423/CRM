import pytest


@pytest.mark.asyncio
async def test_list_users_admin_only(app_client, auth_headers):
    r = await app_client.get("/api/v1/users", headers=auth_headers)
    assert r.status_code == 200
    users = r.json()
    assert len(users) >= 1
    # bootstrap admin is present
    assert any(u["email"] == "admin@company.com" for u in users)
    # password_hash should never leak
    for u in users:
        assert "password_hash" not in u


@pytest.mark.asyncio
async def test_list_users_requires_admin(app_client):
    r = await app_client.get("/api/v1/users")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_create_user(app_client, auth_headers):
    r = await app_client.post(
        "/api/v1/users",
        json={
            "email": "agent1@company.com",
            "name": "Agent One",
            "password": "secure123",
            "role": "agent",
        },
        headers=auth_headers,
    )
    assert r.status_code == 201, r.text
    user = r.json()
    assert user["email"] == "agent1@company.com"
    assert user["role"] == "agent"
    assert user["status"] == "active"
    assert "password_hash" not in user


@pytest.mark.asyncio
async def test_create_duplicate_email(app_client, auth_headers):
    await app_client.post(
        "/api/v1/users",
        json={
            "email": "dup@company.com",
            "name": "Dup",
            "password": "secure123",
        },
        headers=auth_headers,
    )
    r = await app_client.post(
        "/api/v1/users",
        json={
            "email": "dup@company.com",
            "name": "Dup Again",
            "password": "secure123",
        },
        headers=auth_headers,
    )
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_update_user_role(app_client, auth_headers):
    r = await app_client.post(
        "/api/v1/users",
        json={
            "email": "tobeviewer@company.com",
            "name": "Future Viewer",
            "password": "secure123",
            "role": "agent",
        },
        headers=auth_headers,
    )
    uid = r.json()["id"]

    r = await app_client.patch(
        f"/api/v1/users/{uid}",
        json={"role": "viewer"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["role"] == "viewer"


@pytest.mark.asyncio
async def test_deactivate_user(app_client, auth_headers):
    r = await app_client.post(
        "/api/v1/users",
        json={
            "email": "deactivate-me@company.com",
            "name": "Bye",
            "password": "secure123",
        },
        headers=auth_headers,
    )
    uid = r.json()["id"]

    r = await app_client.patch(
        f"/api/v1/users/{uid}",
        json={"status": "inactive"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "inactive"


@pytest.mark.asyncio
async def test_cannot_change_own_role(app_client, auth_headers):
    # Get the current admin's ID
    me = await app_client.get("/api/v1/auth/me", headers=auth_headers)
    admin_id = me.json()["id"]

    r = await app_client.patch(
        f"/api/v1/users/{admin_id}",
        json={"role": "viewer"},
        headers=auth_headers,
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_reset_password(app_client, auth_headers):
    r = await app_client.post(
        "/api/v1/users",
        json={
            "email": "resetme@company.com",
            "name": "Reset Me",
            "password": "oldpass123",
        },
        headers=auth_headers,
    )
    uid = r.json()["id"]

    r = await app_client.post(
        f"/api/v1/users/{uid}/reset-password",
        json={"new_password": "newpass456"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True

    # Verify the new password works
    r = await app_client.post(
        "/api/v1/auth/login",
        json={"email": "resetme@company.com", "password": "newpass456"},
    )
    assert r.status_code == 200

import pytest


@pytest.mark.asyncio
async def test_dashboard(app_client, auth_headers):
    r = await app_client.get("/api/v1/analytics/dashboard", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "tickets" in data
    assert "contacts_total" in data
    assert "users_total" in data
    assert "articles_total" in data
    assert "priority_breakdown" in data
    # tickets is a dict with status counts
    assert "open" in data["tickets"]
    assert "total" in data["tickets"]


@pytest.mark.asyncio
async def test_tickets_by_status(app_client, auth_headers):
    r = await app_client.get("/api/v1/analytics/tickets/by-status", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), dict)


@pytest.mark.asyncio
async def test_tickets_by_priority(app_client, auth_headers):
    r = await app_client.get("/api/v1/analytics/tickets/by-priority", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), dict)


@pytest.mark.asyncio
async def test_recent_activity(app_client, auth_headers):
    r = await app_client.get("/api/v1/analytics/recent-activity", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_analytics_requires_auth(app_client):
    r = await app_client.get("/api/v1/analytics/dashboard")
    assert r.status_code == 401

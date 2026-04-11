import pytest


@pytest.mark.asyncio
async def test_ticket_crud_full_flow(app_client, auth_headers):
    # create
    r = await app_client.post(
        "/api/v1/tickets",
        json={"subject": "Printer offline", "description": "Floor 3", "priority": "high"},
        headers=auth_headers,
    )
    assert r.status_code == 201, r.text
    ticket = r.json()
    assert ticket["subject"] == "Printer offline"
    assert ticket["status"] == "open"
    assert ticket["priority"] == "high"
    ticket_id = ticket["id"]

    # list
    r = await app_client.get("/api/v1/tickets", headers=auth_headers)
    assert r.status_code == 200
    assert any(t["id"] == ticket_id for t in r.json())

    # get
    r = await app_client.get(f"/api/v1/tickets/{ticket_id}", headers=auth_headers)
    assert r.status_code == 200

    # transition: open → pending
    r = await app_client.patch(
        f"/api/v1/tickets/{ticket_id}",
        json={"status": "pending"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "pending"

    # illegal transition: pending → closed
    r = await app_client.patch(
        f"/api/v1/tickets/{ticket_id}",
        json={"status": "closed"},
        headers=auth_headers,
    )
    assert r.status_code == 500  # InvalidTicketTransition bubbles as 500 for now

    # pending → resolved
    r = await app_client.patch(
        f"/api/v1/tickets/{ticket_id}",
        json={"status": "resolved"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "resolved"
    assert r.json()["resolved_at"] is not None


@pytest.mark.asyncio
async def test_ticket_requires_auth(app_client):
    r = await app_client.get("/api/v1/tickets")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_add_comment(app_client, auth_headers):
    r = await app_client.post(
        "/api/v1/tickets",
        json={"subject": "Need login help"},
        headers=auth_headers,
    )
    tid = r.json()["id"]

    r = await app_client.post(
        f"/api/v1/tickets/{tid}/comments",
        json={"content": "Reset link sent.", "is_internal": False},
        headers=auth_headers,
    )
    assert r.status_code == 201
    assert r.json()["content"] == "Reset link sent."

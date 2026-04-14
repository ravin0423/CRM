import pytest


@pytest.mark.asyncio
async def test_workflow_crud(app_client, auth_headers):
    # create
    r = await app_client.post(
        "/api/v1/workflows",
        json={
            "name": "Auto-assign urgent tickets",
            "trigger_type": "ticket.created",
            "conditions": {"priority": "urgent"},
            "actions": {"assign_to": "admin"},
            "enabled": True,
        },
        headers=auth_headers,
    )
    assert r.status_code == 201, r.text
    wf = r.json()
    assert wf["name"] == "Auto-assign urgent tickets"
    assert wf["enabled"] is True
    wid = wf["id"]

    # list
    r = await app_client.get("/api/v1/workflows", headers=auth_headers)
    assert r.status_code == 200
    assert any(w["id"] == wid for w in r.json())

    # get
    r = await app_client.get(f"/api/v1/workflows/{wid}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["trigger_type"] == "ticket.created"

    # update — disable it
    r = await app_client.patch(
        f"/api/v1/workflows/{wid}",
        json={"enabled": False},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["enabled"] is False

    # delete
    r = await app_client.delete(f"/api/v1/workflows/{wid}", headers=auth_headers)
    assert r.status_code == 204


@pytest.mark.asyncio
async def test_workflows_require_admin(app_client):
    r = await app_client.get("/api/v1/workflows")
    assert r.status_code == 401

import pytest


@pytest.mark.asyncio
async def test_deal_crud_flow(app_client, auth_headers):
    # First create a contact to associate with
    r = await app_client.post(
        "/api/v1/contacts",
        json={"email": "deal-test@example.com", "name": "Deal Test"},
        headers=auth_headers,
    )
    assert r.status_code == 201
    contact_id = r.json()["id"]

    # Create a deal
    r = await app_client.post(
        "/api/v1/deals",
        json={
            "contact_id": contact_id,
            "name": "Enterprise License",
            "amount": 50000.00,
            "stage": "prospecting",
            "probability": 20,
        },
        headers=auth_headers,
    )
    assert r.status_code == 201, r.text
    deal = r.json()
    assert deal["name"] == "Enterprise License"
    assert deal["stage"] == "prospecting"
    deal_id = deal["id"]

    # List deals
    r = await app_client.get("/api/v1/deals", headers=auth_headers)
    assert r.status_code == 200
    assert any(d["id"] == deal_id for d in r.json())

    # List deals filtered by stage
    r = await app_client.get("/api/v1/deals?stage=prospecting", headers=auth_headers)
    assert r.status_code == 200
    assert any(d["id"] == deal_id for d in r.json())

    # Get single deal
    r = await app_client.get(f"/api/v1/deals/{deal_id}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["name"] == "Enterprise License"

    # Update deal
    r = await app_client.patch(
        f"/api/v1/deals/{deal_id}",
        json={"stage": "negotiation", "probability": 60},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["stage"] == "negotiation"
    assert r.json()["probability"] == 60

    # Delete deal
    r = await app_client.delete(f"/api/v1/deals/{deal_id}", headers=auth_headers)
    assert r.status_code == 204

    # Confirm deleted
    r = await app_client.get(f"/api/v1/deals/{deal_id}", headers=auth_headers)
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_deal_not_found(app_client, auth_headers):
    r = await app_client.get("/api/v1/deals/99999", headers=auth_headers)
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_deals_require_auth(app_client):
    r = await app_client.get("/api/v1/deals")
    assert r.status_code == 401

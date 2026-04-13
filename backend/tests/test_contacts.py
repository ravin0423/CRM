import pytest


@pytest.mark.asyncio
async def test_contact_crud_flow(app_client, auth_headers):
    # create
    r = await app_client.post(
        "/api/v1/contacts",
        json={
            "email": "jane@acme.io",
            "name": "Jane Doe",
            "company": "Acme",
            "phone": "+1-555-0100",
        },
        headers=auth_headers,
    )
    assert r.status_code == 201, r.text
    contact = r.json()
    assert contact["email"] == "jane@acme.io"
    cid = contact["id"]

    # list
    r = await app_client.get("/api/v1/contacts", headers=auth_headers)
    assert r.status_code == 200
    assert any(c["id"] == cid for c in r.json())

    # patch
    r = await app_client.patch(
        f"/api/v1/contacts/{cid}",
        json={"company": "Acme Corp"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["company"] == "Acme Corp"

    # delete
    r = await app_client.delete(f"/api/v1/contacts/{cid}", headers=auth_headers)
    assert r.status_code in (200, 204)


@pytest.mark.asyncio
async def test_contacts_require_auth(app_client):
    r = await app_client.get("/api/v1/contacts")
    assert r.status_code == 401

import uuid

import pytest


def _slug() -> str:
    return f"test-{uuid.uuid4().hex[:8]}"


@pytest.mark.asyncio
async def test_knowledge_crud(app_client, auth_headers):
    slug = _slug()

    # create (admin-only)
    r = await app_client.post(
        "/api/v1/knowledge",
        json={
            "title": "How to reset password",
            "slug": slug,
            "content": "Go to Settings > Security > Change Password.",
            "status": "draft",
        },
        headers=auth_headers,
    )
    assert r.status_code == 201, r.text
    article = r.json()
    assert article["title"] == "How to reset password"
    assert article["status"] == "draft"
    aid = article["id"]

    # list
    r = await app_client.get("/api/v1/knowledge", headers=auth_headers)
    assert r.status_code == 200
    assert any(a["id"] == aid for a in r.json())

    # update — publish it
    r = await app_client.patch(
        f"/api/v1/knowledge/{aid}",
        json={"status": "published"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "published"

    # get (increments views)
    r = await app_client.get(f"/api/v1/knowledge/{aid}", headers=auth_headers)
    assert r.status_code == 200

    # search
    r = await app_client.get(
        "/api/v1/knowledge/search?q=reset+password",
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert any(a["id"] == aid for a in r.json())

    # delete
    r = await app_client.delete(f"/api/v1/knowledge/{aid}", headers=auth_headers)
    assert r.status_code == 204


@pytest.mark.asyncio
async def test_knowledge_duplicate_slug(app_client, auth_headers):
    slug = _slug()
    await app_client.post(
        "/api/v1/knowledge",
        json={"title": "A", "slug": slug, "content": "body"},
        headers=auth_headers,
    )
    r = await app_client.post(
        "/api/v1/knowledge",
        json={"title": "B", "slug": slug, "content": "body2"},
        headers=auth_headers,
    )
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_knowledge_requires_auth(app_client):
    r = await app_client.get("/api/v1/knowledge")
    assert r.status_code == 401

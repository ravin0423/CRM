import uuid

import pytest


@pytest.mark.asyncio
async def test_chatbot_creates_conversation(app_client, auth_headers):
    r = await app_client.post(
        "/api/v1/chatbot/message",
        json={"message": "How do I reset my password?"},
        headers=auth_headers,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert "reply" in data
    assert "conversation_id" in data
    assert data["escalated"] is False


@pytest.mark.asyncio
async def test_chatbot_continues_conversation(app_client, auth_headers):
    # First message
    r = await app_client.post(
        "/api/v1/chatbot/message",
        json={"message": "Hello"},
        headers=auth_headers,
    )
    cid = r.json()["conversation_id"]

    # Follow-up in same conversation
    r = await app_client.post(
        "/api/v1/chatbot/message",
        json={"message": "I need more help", "conversation_id": cid},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["conversation_id"] == cid


@pytest.mark.asyncio
async def test_chatbot_with_kb_article(app_client, auth_headers):
    slug = f"chatbot-test-{uuid.uuid4().hex[:8]}"
    # Create and publish an article
    await app_client.post(
        "/api/v1/knowledge",
        json={
            "title": "Password Reset Guide",
            "slug": slug,
            "content": "To reset your password, go to Settings and click Change Password.",
            "status": "published",
        },
        headers=auth_headers,
    )

    # Ask a question that matches
    r = await app_client.post(
        "/api/v1/chatbot/message",
        json={"message": "password reset"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    data = r.json()
    # Should find the article
    assert len(data.get("sources", [])) > 0


@pytest.mark.asyncio
async def test_chatbot_escalate(app_client, auth_headers):
    r = await app_client.post(
        "/api/v1/chatbot/message",
        json={"message": "I need urgent help"},
        headers=auth_headers,
    )
    cid = r.json()["conversation_id"]

    r = await app_client.post(
        "/api/v1/chatbot/escalate",
        json={"conversation_id": cid},
        headers=auth_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["conversation_resolved"] is True
    assert "ticket" in data
    assert data["ticket"]["subject"].startswith("Chatbot escalation")


@pytest.mark.asyncio
async def test_chatbot_list_conversations(app_client, auth_headers):
    # Create a conversation first
    await app_client.post(
        "/api/v1/chatbot/message",
        json={"message": "test"},
        headers=auth_headers,
    )
    r = await app_client.get("/api/v1/chatbot/conversations", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) >= 1


@pytest.mark.asyncio
async def test_chatbot_requires_auth(app_client):
    r = await app_client.post(
        "/api/v1/chatbot/message",
        json={"message": "hello"},
    )
    assert r.status_code == 401

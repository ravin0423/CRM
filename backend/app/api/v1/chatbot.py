"""
AI chatbot endpoints — knowledge-base search with auto-escalation.

The chatbot searches published KB articles for answers. If no relevant
article is found, it offers to escalate by creating a ticket. Full LLM
RAG integration (embedding + vector store + Claude) ships in Phase 3 —
Phase 2 uses keyword search as the retrieval backbone.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, get_db
from app.db.database_interface import DatabaseInterface
from app.schemas.chatbot import ChatMessage

router = APIRouter()


def _serialize(obj):
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj
    result = {}
    for column in getattr(obj, "__table__", type("t", (), {"columns": []})).columns:
        result[column.name] = getattr(obj, column.name, None)
    return result


def _uid(user) -> int:
    return int((user.get("id") if isinstance(user, dict) else getattr(user, "id", 0)) or 0)


@router.post("/message")
async def chat(
    payload: ChatMessage,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    user_id = _uid(user)
    now = datetime.now(tz=timezone.utc).isoformat()

    # Get or create conversation.
    if payload.conversation_id:
        convo = await db.chat.get(payload.conversation_id)
        if convo is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    else:
        convo = await db.chat.create(user_id=user_id)

    convo_id = _get_id(convo)

    # Store user message.
    user_msg: dict[str, Any] = {
        "role": "user",
        "content": payload.message,
        "timestamp": now,
    }
    await db.chat.append_message(convo_id, user_msg)

    # Search knowledge base for relevant articles.
    articles = await db.knowledge.search(payload.message)

    if articles:
        # Build a response from the top article.
        top = articles[0]
        title = top.get("title") if isinstance(top, dict) else getattr(top, "title", "")
        content = top.get("content") if isinstance(top, dict) else getattr(top, "content", "")
        article_id = top.get("id") if isinstance(top, dict) else getattr(top, "id", None)
        snippet = content[:500] + ("..." if len(content) > 500 else "")
        reply = f"I found a relevant article: **{title}**\n\n{snippet}"

        # Track the view.
        if article_id:
            await db.knowledge.increment_views(article_id)

        bot_msg: dict[str, Any] = {
            "role": "assistant",
            "content": reply,
            "sources": [{"id": article_id, "title": title}],
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        }
        await db.chat.append_message(convo_id, bot_msg)

        return {
            "conversation_id": convo_id,
            "reply": reply,
            "sources": bot_msg["sources"],
            "escalated": False,
        }
    else:
        reply = (
            "I couldn't find a matching article in the knowledge base. "
            "Would you like me to create a support ticket so a human agent can help?"
        )
        bot_msg = {
            "role": "assistant",
            "content": reply,
            "sources": [],
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        }
        await db.chat.append_message(convo_id, bot_msg)

        return {
            "conversation_id": convo_id,
            "reply": reply,
            "sources": [],
            "escalated": False,
        }


@router.post("/escalate")
async def escalate(
    payload: dict,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    """Create a ticket from the current conversation."""
    convo_id = payload.get("conversation_id")
    if not convo_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "conversation_id required")

    convo = await db.chat.get(convo_id)
    if convo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")

    messages = convo.get("messages") if isinstance(convo, dict) else getattr(convo, "messages", [])
    user_messages = [m["content"] for m in (messages or []) if m.get("role") == "user"]
    summary = "\n".join(user_messages[:5]) if user_messages else "Escalated from chatbot"

    ticket = await db.tickets.create(
        subject=f"Chatbot escalation: {user_messages[0][:80] if user_messages else 'Help needed'}",
        description=summary,
        status="open",
        priority="medium",
        customer_id=_uid(user),
    )
    await db.chat.resolve(convo_id)

    return {
        "ticket": _serialize(ticket),
        "conversation_resolved": True,
    }


@router.get("/conversations")
async def list_conversations(
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    convos = await db.chat.list(user_id=_uid(user))
    return [_serialize(c) for c in convos]


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: int,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    convo = await db.chat.get(conversation_id)
    if convo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    return _serialize(convo)


def _get_id(obj) -> int:
    if isinstance(obj, dict):
        return obj.get("id", 0)
    return getattr(obj, "id", 0)

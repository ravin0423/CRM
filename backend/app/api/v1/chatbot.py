"""AI chatbot endpoints — RAG over knowledge base, auto-escalation to humans."""

from fastapi import APIRouter

router = APIRouter()


@router.post("/message")
async def chat(payload: dict):
    return {"reply": "stub response", "escalated": False}

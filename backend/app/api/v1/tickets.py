"""Ticket endpoints — CRUD, replies, assignment, SLA."""

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_tickets():
    return []


@router.post("")
async def create_ticket(payload: dict):
    return {"id": "stub", **payload}


@router.get("/{ticket_id}")
async def get_ticket(ticket_id: str):
    return {"id": ticket_id}


@router.patch("/{ticket_id}")
async def update_ticket(ticket_id: str, payload: dict):
    return {"id": ticket_id, **payload}


@router.post("/{ticket_id}/reply")
async def reply_to_ticket(ticket_id: str, payload: dict):
    return {"ticket_id": ticket_id, "reply": payload}

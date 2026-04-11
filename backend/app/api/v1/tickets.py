"""Ticket endpoints — real CRUD with state machine, comments, replies."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, get_db
from app.db.database_interface import DatabaseInterface
from app.schemas.tickets import (
    TicketCommentCreate,
    TicketCreate,
    TicketUpdate,
)
from app.services.ticket_service import TicketService

router = APIRouter()


def _uid(user) -> int:
    return int((user.get("id") if isinstance(user, dict) else getattr(user, "id", 0)) or 0)


def _service(db: DatabaseInterface) -> TicketService:
    return TicketService(db)


@router.get("")
async def list_tickets(
    status_filter: str | None = None,
    agent_id: int | None = None,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    filters = {"status": status_filter, "agent_id": agent_id}
    tickets = await db.tickets.list(**filters)
    return [_serialize(t) for t in tickets]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_ticket(
    payload: TicketCreate,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    svc = _service(db)
    ticket = await svc.create(payload, actor_id=_uid(user))
    return _serialize(ticket)


@router.get("/{ticket_id}")
async def get_ticket(
    ticket_id: int,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    ticket = await db.tickets.get(ticket_id)
    if ticket is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")
    return _serialize(ticket)


@router.patch("/{ticket_id}")
async def update_ticket(
    ticket_id: int,
    payload: TicketUpdate,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    svc = _service(db)
    ticket = await svc.update(ticket_id, payload, actor_id=_uid(user))
    if ticket is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")
    return _serialize(ticket)


@router.post("/{ticket_id}/comments", status_code=status.HTTP_201_CREATED)
async def add_comment(
    ticket_id: int,
    payload: TicketCommentCreate,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    comment = await db.tickets.add_comment(
        ticket_id=ticket_id,
        user_id=_uid(user),
        content=payload.content,
        is_internal=payload.is_internal,
    )
    await db.audit.write(
        user_id=_uid(user),
        action="add_comment",
        entity_type="ticket",
        entity_id=str(ticket_id),
    )
    return _serialize(comment)


def _serialize(obj):
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj
    # SQLAlchemy ORM object → dict of mapped columns
    result = {}
    for column in getattr(obj, "__table__", type("t", (), {"columns": []})).columns:
        result[column.name] = getattr(obj, column.name, None)
    return result

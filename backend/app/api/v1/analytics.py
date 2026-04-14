"""Analytics & reporting endpoints — dashboard stats, ticket metrics."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.deps import get_current_user, get_db
from app.db.database_interface import DatabaseInterface

router = APIRouter()


def _status(obj, field: str):
    return obj.get(field) if isinstance(obj, dict) else getattr(obj, field, None)


@router.get("/dashboard")
async def dashboard(
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    tickets = await db.tickets.list()
    contacts = await db.contacts.list()
    users = await db.users.list()
    articles = await db.knowledge.list()

    open_count = sum(1 for t in tickets if _status(t, "status") == "open")
    pending_count = sum(1 for t in tickets if _status(t, "status") == "pending")
    resolved_count = sum(1 for t in tickets if _status(t, "status") == "resolved")
    closed_count = sum(1 for t in tickets if _status(t, "status") == "closed")

    # Priority breakdown.
    priority_counts = {}
    for t in tickets:
        p = _status(t, "priority") or "medium"
        priority_counts[p] = priority_counts.get(p, 0) + 1

    # Agent workload: tickets assigned to each agent.
    agent_workload: dict[int, int] = {}
    for t in tickets:
        aid = _status(t, "agent_id")
        if aid:
            agent_workload[aid] = agent_workload.get(aid, 0) + 1

    return {
        "tickets": {
            "total": len(tickets),
            "open": open_count,
            "pending": pending_count,
            "resolved": resolved_count,
            "closed": closed_count,
        },
        "priority_breakdown": priority_counts,
        "contacts_total": len(contacts),
        "users_total": len(users),
        "articles_total": len(articles),
        "agent_workload": agent_workload,
    }


@router.get("/tickets/by-status")
async def tickets_by_status(
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    tickets = await db.tickets.list()
    counts: dict[str, int] = {}
    for t in tickets:
        s = _status(t, "status") or "unknown"
        counts[s] = counts.get(s, 0) + 1
    return counts


@router.get("/tickets/by-priority")
async def tickets_by_priority(
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    tickets = await db.tickets.list()
    counts: dict[str, int] = {}
    for t in tickets:
        p = _status(t, "priority") or "medium"
        counts[p] = counts.get(p, 0) + 1
    return counts


@router.get("/recent-activity")
async def recent_activity(
    limit: int = 20,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    logs = await db.audit.tail(limit=limit)
    return [_serialize_audit(log) for log in logs]


def _serialize_audit(obj):
    if isinstance(obj, dict):
        return obj
    result = {}
    for column in getattr(obj, "__table__", type("t", (), {"columns": []})).columns:
        result[column.name] = getattr(obj, column.name, None)
    return result

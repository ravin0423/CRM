"""
Ticket service — business logic and state machine.

Enforces the transitions documented in ARCHITECTURE_AND_FLOWCHARTS.md:

    open ↔ pending
    open/pending → resolved → closed
    resolved → open (reopen)
"""

from __future__ import annotations

from app.db.database_interface import DatabaseInterface
from app.schemas.tickets import TicketCreate, TicketUpdate


ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "open": {"pending", "resolved"},
    "pending": {"open", "resolved"},
    "resolved": {"closed", "open"},
    "closed": set(),
}


class InvalidTicketTransition(ValueError):
    pass


class TicketService:
    def __init__(self, db: DatabaseInterface) -> None:
        self.db = db

    async def create(self, payload: TicketCreate, *, actor_id: int):
        ticket = await self.db.tickets.create(
            subject=payload.subject,
            description=payload.description,
            priority=payload.priority,
            customer_id=payload.customer_id,
            agent_id=payload.agent_id,
            status="open",
        )
        tid = getattr(ticket, "id", None) or (ticket.get("id") if isinstance(ticket, dict) else None)
        await self.db.audit.write(
            user_id=actor_id,
            action="create_ticket",
            entity_type="ticket",
            entity_id=str(tid),
        )
        return ticket

    async def update(self, ticket_id: int, payload: TicketUpdate, *, actor_id: int):
        current = await self.db.tickets.get(ticket_id)
        if current is None:
            return None

        updates = payload.model_dump(exclude_unset=True)
        new_status = updates.get("status")
        if new_status is not None:
            current_status = (
                current.get("status") if isinstance(current, dict) else getattr(current, "status", None)
            )
            if current_status and new_status != current_status:
                if new_status not in ALLOWED_TRANSITIONS.get(current_status, set()):
                    raise InvalidTicketTransition(
                        f"Cannot transition ticket from '{current_status}' to '{new_status}'"
                    )

        ticket = await self.db.tickets.update(ticket_id, **updates)
        await self.db.audit.write(
            user_id=actor_id,
            action="update_ticket",
            entity_type="ticket",
            entity_id=str(ticket_id),
        )
        return ticket

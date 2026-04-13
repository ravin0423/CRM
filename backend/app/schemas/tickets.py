from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


TicketStatus = Literal["open", "pending", "resolved", "closed"]
TicketPriority = Literal["low", "medium", "high", "urgent"]


class TicketCreate(BaseModel):
    subject: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    priority: TicketPriority = "medium"
    customer_id: int | None = None
    agent_id: int | None = None


class TicketUpdate(BaseModel):
    subject: str | None = None
    description: str | None = None
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    agent_id: int | None = None


class TicketCommentCreate(BaseModel):
    content: str = Field(..., min_length=1)
    is_internal: bool = False


class TicketOut(BaseModel):
    id: int
    ticket_number: str
    subject: str
    description: str | None
    status: str
    priority: str
    customer_id: int | None
    agent_id: int | None
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None

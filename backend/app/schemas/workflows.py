from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class WorkflowCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    trigger_type: Literal[
        "ticket.created",
        "ticket.updated",
        "ticket.resolved",
        "contact.created",
    ]
    conditions: dict[str, Any] = Field(default_factory=dict)
    actions: dict[str, Any] = Field(default_factory=dict)
    enabled: bool = True


class WorkflowUpdate(BaseModel):
    name: str | None = None
    trigger_type: str | None = None
    conditions: dict[str, Any] | None = None
    actions: dict[str, Any] | None = None
    enabled: bool | None = None

from __future__ import annotations

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    message: str = Field(min_length=1)
    conversation_id: int | None = None

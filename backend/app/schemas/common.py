"""Pydantic request/response schemas shared across endpoints."""

from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int


class Timestamped(BaseModel):
    created_at: datetime
    updated_at: datetime | None = None

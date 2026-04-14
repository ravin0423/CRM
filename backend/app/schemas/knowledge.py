from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ArticleCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    slug: str = Field(min_length=1, max_length=500)
    content: str = Field(min_length=1)
    status: Literal["draft", "published"] = "draft"


class ArticleUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    content: str | None = None
    status: Literal["draft", "published"] | None = None

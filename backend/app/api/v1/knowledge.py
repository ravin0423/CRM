"""Knowledge base article endpoints — CRUD, search, view tracking."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, get_db, require_admin
from app.db.database_interface import DatabaseInterface
from app.schemas.knowledge import ArticleCreate, ArticleUpdate

router = APIRouter()


def _serialize(obj):
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj
    result = {}
    for column in getattr(obj, "__table__", type("t", (), {"columns": []})).columns:
        result[column.name] = getattr(obj, column.name, None)
    return result


@router.get("")
async def list_articles(
    status_filter: str | None = None,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    filters = {}
    if status_filter:
        filters["status"] = status_filter
    articles = await db.knowledge.list(**filters)
    return [_serialize(a) for a in articles]


@router.get("/search")
async def search_articles(
    q: str,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    results = await db.knowledge.search(q)
    return [_serialize(a) for a in results]


@router.get("/{article_id}")
async def get_article(
    article_id: int,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    article = await db.knowledge.get(article_id)
    if article is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Article not found")
    await db.knowledge.increment_views(article_id)
    return _serialize(article)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_article(
    payload: ArticleCreate,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(require_admin),
):
    existing = await db.knowledge.by_slug(payload.slug)
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Slug already exists")
    article = await db.knowledge.create(**payload.model_dump())
    return _serialize(article)


@router.patch("/{article_id}")
async def update_article(
    article_id: int,
    payload: ArticleUpdate,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(require_admin),
):
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        article = await db.knowledge.get(article_id)
        if article is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Article not found")
        return _serialize(article)
    updated = await db.knowledge.update(article_id, **updates)
    if updated is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Article not found")
    return _serialize(updated)


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: int,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(require_admin),
):
    await db.knowledge.delete(article_id)

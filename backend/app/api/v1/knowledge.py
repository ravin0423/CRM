"""Knowledge base article endpoints."""

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_articles():
    return []


@router.post("")
async def create_article(payload: dict):
    return {"id": "stub", **payload}

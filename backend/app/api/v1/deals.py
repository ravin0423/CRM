"""Deals endpoints."""

from fastapi import APIRouter, Depends, status

from app.core.deps import get_current_user, get_db
from app.db.database_interface import DatabaseInterface
from app.schemas.contacts import DealCreate

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
async def list_deals(
    stage: str | None = None,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    return [_serialize(d) for d in await db.deals.list(stage=stage)]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_deal(
    payload: DealCreate,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    deal = await db.deals.create(**payload.model_dump())
    return _serialize(deal)

"""Deals endpoints — full CRUD."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, get_db
from app.db.database_interface import DatabaseInterface
from app.schemas.contacts import DealCreate, DealUpdate

router = APIRouter()


def _serialize(obj):
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj
    result = {}
    for column in getattr(obj, "__table__", type("t", (), {"columns": []})).columns:
        val = getattr(obj, column.name, None)
        result[column.name] = val
    return result


@router.get("")
async def list_deals(
    stage: str | None = None,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    return [_serialize(d) for d in await db.deals.list(stage=stage)]


@router.get("/{deal_id}")
async def get_deal(
    deal_id: int,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    deal = await db.deals.get(deal_id)
    if deal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Deal not found")
    return _serialize(deal)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_deal(
    payload: DealCreate,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    deal = await db.deals.create(**payload.model_dump())
    return _serialize(deal)


@router.patch("/{deal_id}")
async def update_deal(
    deal_id: int,
    payload: DealUpdate,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No fields to update")
    deal = await db.deals.update(deal_id, **updates)
    if deal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Deal not found")
    return _serialize(deal)


@router.delete("/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deal(
    deal_id: int,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    deal = await db.deals.get(deal_id)
    if deal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Deal not found")
    await db.deals.delete(deal_id)

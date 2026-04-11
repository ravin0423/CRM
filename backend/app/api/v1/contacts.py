"""Contact endpoints — CRM side of the app."""

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_contacts():
    return []


@router.post("")
async def create_contact(payload: dict):
    return {"id": "stub", **payload}

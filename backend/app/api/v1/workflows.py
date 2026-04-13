"""Workflow/automation endpoints — if-this-then-that rules."""

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_workflows():
    return []


@router.post("")
async def create_workflow(payload: dict):
    return {"id": "stub", **payload}

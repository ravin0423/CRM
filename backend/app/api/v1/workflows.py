"""Workflow/automation endpoints — if-this-then-that rules."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_db, require_admin
from app.db.database_interface import DatabaseInterface
from app.schemas.workflows import WorkflowCreate, WorkflowUpdate

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
async def list_workflows(
    db: DatabaseInterface = Depends(get_db),
    user=Depends(require_admin),
):
    workflows = await db.workflows.list()
    return [_serialize(w) for w in workflows]


@router.get("/{workflow_id}")
async def get_workflow(
    workflow_id: int,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(require_admin),
):
    w = await db.workflows.get(workflow_id)
    if w is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workflow not found")
    return _serialize(w)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_workflow(
    payload: WorkflowCreate,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(require_admin),
):
    w = await db.workflows.create(**payload.model_dump())
    return _serialize(w)


@router.patch("/{workflow_id}")
async def update_workflow(
    workflow_id: int,
    payload: WorkflowUpdate,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(require_admin),
):
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        w = await db.workflows.get(workflow_id)
        if w is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Workflow not found")
        return _serialize(w)
    updated = await db.workflows.update(workflow_id, **updates)
    if updated is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workflow not found")
    return _serialize(updated)


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: int,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(require_admin),
):
    await db.workflows.delete(workflow_id)

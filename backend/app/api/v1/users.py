"""User management endpoints — admin-only CRUD for the Users tab."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, get_db, require_admin
from app.db.database_interface import DatabaseInterface
from app.schemas.auth import ResetPasswordRequest, UserCreate, UserUpdate

router = APIRouter()


def _uid(user) -> int:
    return int((user.get("id") if isinstance(user, dict) else getattr(user, "id", 0)) or 0)


def _serialize(obj):
    if obj is None:
        return None
    if isinstance(obj, dict):
        d = dict(obj)
        d.pop("password_hash", None)
        return d
    result = {}
    for column in getattr(obj, "__table__", type("t", (), {"columns": []})).columns:
        if column.name == "password_hash":
            continue
        result[column.name] = getattr(obj, column.name, None)
    return result


@router.get("")
async def list_users(
    db: DatabaseInterface = Depends(get_db),
    user=Depends(require_admin),
):
    users = await db.users.list()
    return [_serialize(u) for u in users]


@router.get("/{user_id}")
async def get_user(
    user_id: int,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(require_admin),
):
    target = await db.users.by_id(user_id)
    if target is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return _serialize(target)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(require_admin),
):
    existing = await db.users.by_email(payload.email)
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    new_user = await db.users.create(
        email=payload.email,
        name=payload.name,
        password=payload.password,
        role=payload.role,
    )
    await db.audit.write(
        user_id=_uid(user),
        action="create_user",
        entity_type="user",
        entity_id=str(_uid(new_user) if not isinstance(new_user, dict) else new_user.get("id")),
    )
    return _serialize(new_user)


@router.patch("/{user_id}")
async def update_user(
    user_id: int,
    payload: UserUpdate,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(require_admin),
):
    # Prevent admin from changing their own role.
    if _uid(user) == user_id and payload.role is not None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Cannot change your own role"
        )
    # Prevent admin from deactivating themselves.
    if _uid(user) == user_id and payload.status == "inactive":
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Cannot deactivate your own account"
        )

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        target = await db.users.by_id(user_id)
        if target is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
        return _serialize(target)

    updated = await db.users.update(user_id, **updates)
    if updated is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    await db.audit.write(
        user_id=_uid(user),
        action="update_user",
        entity_type="user",
        entity_id=str(user_id),
    )
    return _serialize(updated)


@router.post("/{user_id}/reset-password")
async def reset_password(
    user_id: int,
    payload: ResetPasswordRequest,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(require_admin),
):
    target = await db.users.by_id(user_id)
    if target is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    await db.users.set_password(user_id, payload.new_password)
    await db.audit.write(
        user_id=_uid(user),
        action="reset_password",
        entity_type="user",
        entity_id=str(user_id),
    )
    return {"ok": True}

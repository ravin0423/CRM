"""Authentication endpoints — JWT login, change password, /me."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.deps import get_current_user, get_db
from app.core.security import create_access_token, verify_password
from app.db.database_interface import DatabaseInterface
from app.middleware.rate_limit import limiter
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    TokenResponse,
    UserOut,
)

router = APIRouter()


def _user_field(user, name, default=None):
    if isinstance(user, dict):
        return user.get(name, default)
    return getattr(user, name, default)


def _to_user_out(user) -> UserOut:
    return UserOut(
        id=int(_user_field(user, "id") or 0),
        email=_user_field(user, "email") or "",
        name=_user_field(user, "name") or "",
        role=_user_field(user, "role") or "agent",
        status=_user_field(user, "status") or "active",
        must_change_password=bool(_user_field(user, "must_change_password") or False),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, payload: LoginRequest, db: DatabaseInterface = Depends(get_db)):
    user = await db.users.by_email(payload.email)
    if user is None or not verify_password(payload.password, _user_field(user, "password_hash") or ""):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    token = create_access_token(
        subject=payload.email,
        extra={"role": _user_field(user, "role") or "agent"},
    )
    return TokenResponse(
        access_token=token,
        must_change_password=bool(_user_field(user, "must_change_password") or False),
    )


@router.get("/me", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return _to_user_out(user)


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    user=Depends(get_current_user),
    db: DatabaseInterface = Depends(get_db),
):
    if not verify_password(payload.current_password, _user_field(user, "password_hash") or ""):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "New password must be at least 8 characters")
    await db.users.set_password(int(_user_field(user, "id") or 0), payload.new_password)
    await db.audit.write(
        user_id=int(_user_field(user, "id") or 0),
        action="change_password",
        entity_type="user",
        entity_id=str(_user_field(user, "id") or ""),
    )
    return {"status": "ok"}

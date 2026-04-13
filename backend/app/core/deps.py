"""FastAPI dependencies: current app DB, current user, admin guard."""

from __future__ import annotations

from typing import Any

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_access_token
from app.db.database_interface import DatabaseInterface

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_db(request: Request) -> DatabaseInterface:
    return request.app.state.db  # type: ignore[no-any-return]


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: DatabaseInterface = Depends(get_db),
) -> Any:
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(exc)) from exc
    email = payload.get("sub")
    if not email:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token payload")
    user = await db.users.by_email(email)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


async def require_admin(user: Any = Depends(get_current_user)) -> Any:
    role = getattr(user, "role", None) or (user.get("role") if isinstance(user, dict) else None)
    if role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Administrator role required")
    return user

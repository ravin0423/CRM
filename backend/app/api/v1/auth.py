"""Authentication endpoints — JWT login, logout, password change."""

from fastapi import APIRouter

router = APIRouter()


@router.post("/login")
async def login(payload: dict):
    # TODO: validate credentials, issue JWT.
    return {"access_token": "stub", "token_type": "bearer"}


@router.post("/logout")
async def logout():
    return {"status": "ok"}


@router.post("/change-password")
async def change_password(payload: dict):
    return {"status": "ok"}

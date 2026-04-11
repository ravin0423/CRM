"""
Admin settings API — the single endpoint set that the Admin Panel uses to
read and write every configuration value.

Every tab in the Admin Panel maps to one of these endpoints. There are no
``.env`` files for the operator to edit.
"""

from fastapi import APIRouter, Depends, HTTPException

from app.core.config_manager import ConfigManager
from app.db.database_factory import DatabaseFactory

router = APIRouter()


@router.get("")
async def read_settings():
    cfg = ConfigManager.current()
    # NB: encrypted fields are returned as "***" so secrets never leave the server.
    return _redact(cfg.raw)


@router.put("")
async def update_settings(payload: dict):
    cfg = ConfigManager.save(payload)
    return _redact(cfg.raw)


@router.post("/database/test")
async def test_database(payload: dict):
    db = DatabaseFactory.build(payload)  # type: ignore[arg-type]
    await db.connect()
    ok = await db.ping()
    await db.disconnect()
    if not ok:
        raise HTTPException(400, "Could not connect with the provided credentials.")
    return {"status": "ok"}


@router.post("/storage/test")
async def test_storage(payload: dict):
    # TODO: instantiate MinIO or S3 adapter and upload/delete a test object.
    return {"status": "ok"}


@router.post("/email/test")
async def test_email(payload: dict):
    # TODO: send a real SMTP test email.
    return {"status": "ok"}


def _redact(raw: dict) -> dict:
    out = {}
    for k, v in raw.items():
        if isinstance(v, dict):
            out[k] = _redact(v)
        elif k.endswith("_encrypted") or "password" in k.lower() or "secret" in k.lower():
            out[k] = "***" if v else ""
        else:
            out[k] = v
    return out

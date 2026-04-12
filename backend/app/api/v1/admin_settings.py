"""
Admin settings API — the single endpoint set the Admin Panel uses to
read and write every configuration value.

Every tab in the Admin Panel maps to one of these endpoints. There are no
``.env`` files for the operator to edit.
"""

from __future__ import annotations

import json
import shutil
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config_manager import ConfigManager
from app.core.crypto import encrypt
from app.core.deps import require_admin
from app.db.database_factory import DatabaseFactory
from app.db.database_interface import DatabaseInterface
from app.integrations.email_smtp import test_email as smtp_test_email
from app.integrations.storage import build_storage_from_dict

router = APIRouter()

REDACTED = "***"


@router.get("")
async def read_settings(user=Depends(require_admin)):
    cfg = ConfigManager.current()
    return _redact(cfg.raw)


@router.put("")
async def update_settings(payload: dict, user=Depends(require_admin)):
    if not isinstance(payload, dict):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Body must be an object")
    current = ConfigManager.current().raw
    merged = _merge_and_encrypt(current, payload)
    ConfigManager.save(merged)
    return _redact(ConfigManager.current().raw)


@router.post("/database/test")
async def test_database(payload: dict, user=Depends(require_admin)):
    """Accepts a DatabaseConfig-like dict (type + credentials) and tries to connect."""
    from app.core.config_manager import DatabaseConfig

    if not isinstance(payload, dict) or "type" not in payload:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Missing database type")

    try:
        cfg = DatabaseConfig(
            type=payload.get("type", "sqlserver"),
            sqlserver=payload.get("sqlserver", {}),
            mongodb=payload.get("mongodb", {}),
        )
        db: DatabaseInterface = DatabaseFactory.build(cfg)
        await db.connect()
        ok = await db.ping()
        await db.disconnect()
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Connection failed: {exc}") from exc

    if not ok:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Could not connect with the provided credentials.")
    return {"status": "ok"}


@router.post("/storage/test")
async def test_storage(payload: dict, user=Depends(require_admin)):
    if not isinstance(payload, dict) or "type" not in payload:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Missing storage type")

    try:
        storage = build_storage_from_dict(payload["type"], payload.get(payload["type"], {}))
        ok = await storage.ping()
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Storage check failed: {exc}") from exc

    if not ok:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Could not reach storage backend.")
    return {"status": "ok"}


@router.post("/email/test")
async def test_email(payload: dict, user=Depends(require_admin)):
    recipient = payload.get("recipient") or payload.get("to") or ""
    if not recipient:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Missing recipient")
    try:
        await smtp_test_email(payload, recipient)
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"SMTP test failed: {exc}") from exc
    return {"status": "ok"}


@router.post("/backup/now")
async def backup_now(user=Depends(require_admin)):
    """Create a snapshot of admin_settings.json in the backups/ directory."""
    from app.core.config_manager import DEFAULT_CONFIG_PATH

    cfg_path = DEFAULT_CONFIG_PATH
    if not cfg_path.exists():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No settings file to back up")
    backup_dir = cfg_path.parent / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(tz=timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    dest = backup_dir / f"admin_settings_{ts}.json"
    shutil.copy2(cfg_path, dest)
    return {"file": str(dest), "timestamp": ts}


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
_SECRET_FIELDS = {"password", "secret_key", "api_key", "bot_token", "connection_string"}


def _redact(raw: dict) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for k, v in raw.items():
        if isinstance(v, dict):
            out[k] = _redact(v)
        elif k.endswith("_encrypted"):
            out[k] = REDACTED if v else ""
        else:
            out[k] = v
    return out


def _merge_and_encrypt(current: dict, incoming: dict) -> dict:
    """
    Deep-merge ``incoming`` onto ``current``.

    - Any plain-text field whose name matches a known secret (password,
      secret_key, …) is encrypted into ``<field>_encrypted`` and the
      plaintext is discarded.
    - ``REDACTED`` values are preserved (i.e. treated as "unchanged").
    """
    merged = deepcopy(current)

    def _walk(dst: dict, src: dict):
        for k, v in src.items():
            if isinstance(v, dict):
                dst[k] = dst.get(k, {}) if isinstance(dst.get(k), dict) else {}
                _walk(dst[k], v)
                continue
            # If the operator sent back "***", they did not change the secret.
            if v == REDACTED:
                continue
            if k in _SECRET_FIELDS and isinstance(v, str):
                dst[f"{k}_encrypted"] = encrypt(v)
                dst.pop(k, None)
                continue
            dst[k] = v

    _walk(merged, incoming)
    return merged

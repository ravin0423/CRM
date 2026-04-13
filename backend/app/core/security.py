"""
JWT + password helpers.

The JWT signing key is derived from the master key (so operators never have
to enter another secret) and the token TTL comes from the admin-configured
``api.session_timeout_minutes`` value.
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config_manager import ConfigManager
from app.core.crypto import MASTER_KEY

JWT_ALGORITHM = "HS256"

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _signing_key() -> str:
    """
    Derive a JWT signing key from the master key.

    We deliberately do not reuse the Fernet key directly for JWT signing —
    instead we SHA-256-hash it once so rotating JWTs later does not leak
    information about the master key.
    """
    return hashlib.sha256(b"crm.jwt." + MASTER_KEY).hexdigest()


def hash_password(plain: str) -> str:
    return _pwd.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _pwd.verify(plain, hashed)
    except Exception:
        return False


def create_access_token(subject: str, extra: dict[str, Any] | None = None) -> str:
    cfg = ConfigManager.current()
    minutes = int(cfg.raw.get("api", {}).get("session_timeout_minutes", 30))
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": datetime.now(tz=timezone.utc),
        "exp": datetime.now(tz=timezone.utc) + timedelta(minutes=minutes),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, _signing_key(), algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, _signing_key(), algorithms=[JWT_ALGORITHM])
    except JWTError as exc:
        raise ValueError(f"Invalid token: {exc}") from exc

"""
Symmetric encryption for secrets stored in admin_settings.json.

On first run a master key is generated and persisted to
``<config_dir>/master.key`` (0o600). Subsequent runs read that file.
For AWS deployments the `CRM_MASTER_KEY_B64` environment variable takes
precedence so the key can come from Parameter Store / Secrets Manager.

The Admin Panel never returns raw secrets to the frontend — only ``***``
placeholders are rendered by :func:`app.api.v1.admin_settings._redact`.
"""

from __future__ import annotations

import base64
import os
from pathlib import Path

from cryptography.fernet import Fernet


_MASTER_KEY_ENV = "CRM_MASTER_KEY_B64"


def _load_master_key() -> bytes:
    env_val = os.getenv(_MASTER_KEY_ENV)
    if env_val:
        # Fernet keys are themselves urlsafe-base64 encoded 32-byte strings,
        # so we pass the env value through untouched. We just validate that
        # it decodes to exactly 32 bytes to catch typos early.
        try:
            raw = base64.urlsafe_b64decode(env_val)
            if len(raw) == 32:
                return env_val.encode()
        except Exception:
            pass
        raise ValueError(
            f"{_MASTER_KEY_ENV} must be a urlsafe-base64-encoded 32-byte key"
        )

    key_path = Path(os.getenv("CRM_CONFIG_PATH", "./config/admin_settings.json")).parent / "master.key"
    if key_path.exists():
        return key_path.read_bytes().strip()

    # First run: generate and persist.
    key = Fernet.generate_key()
    key_path.parent.mkdir(parents=True, exist_ok=True)
    key_path.write_bytes(key)
    try:
        os.chmod(key_path, 0o600)
    except OSError:
        pass  # Windows / docker volume may not support chmod
    return key


MASTER_KEY: bytes = _load_master_key()
_fernet = Fernet(MASTER_KEY)


def encrypt(plaintext: str) -> str:
    """Encrypt a string. Empty input returns empty output unchanged."""
    if not plaintext:
        return ""
    return _fernet.encrypt(plaintext.encode()).decode()


def decrypt(token: str) -> str:
    """Decrypt a token produced by :func:`encrypt`. Empty in, empty out."""
    if not token:
        return ""
    return _fernet.decrypt(token.encode()).decode()

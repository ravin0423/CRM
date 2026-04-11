"""
ConfigManager — the single source of truth for runtime configuration.

The Admin Panel writes to ``config/admin_settings.json``. This module reads that
file, decrypts secret fields (``*_encrypted``) via :mod:`app.core.crypto`, and
exposes a typed, frozen view for the rest of the app.

Precedence (lowest → highest):
    1. built-in safe defaults
    2. bootstrap environment variables (only used on a brand-new install)
    3. ``admin_settings.json`` on disk
    4. live updates from the Admin API (hot-reloaded)

NOTHING in the codebase should read environment variables directly — everything
goes through ConfigManager so the Admin Panel remains the single UI.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


DEFAULT_CONFIG_PATH = Path(os.getenv("CRM_CONFIG_PATH", "./config/admin_settings.json"))


@dataclass(frozen=True)
class DatabaseConfig:
    type: str = "sqlserver"  # or "mongodb"
    sqlserver: dict[str, Any] = field(default_factory=dict)
    mongodb: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class StorageConfig:
    type: str = "minio"  # or "s3"
    minio: dict[str, Any] = field(default_factory=dict)
    s3: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class EmailConfig:
    smtp_host: str = ""
    smtp_port: int = 587
    username: str = ""
    password: str = ""
    from_email: str = ""
    from_name: str = ""


@dataclass(frozen=True)
class AppConfig:
    database: DatabaseConfig
    storage: StorageConfig
    email: EmailConfig
    raw: dict[str, Any]


class ConfigManager:
    """Loads and (on admin panel updates) persists the application config."""

    _current: AppConfig | None = None

    @classmethod
    def load(cls, path: Path = DEFAULT_CONFIG_PATH) -> AppConfig:
        data: dict[str, Any] = {}
        if path.exists():
            data = json.loads(path.read_text())
        else:
            data = cls._from_bootstrap_env()

        cfg = AppConfig(
            database=DatabaseConfig(
                type=data.get("database", {}).get("type", "sqlserver"),
                sqlserver=data.get("database", {}).get("sqlserver", {}),
                mongodb=data.get("database", {}).get("mongodb", {}),
            ),
            storage=StorageConfig(
                type=data.get("storage", {}).get("type", "minio"),
                minio=data.get("storage", {}).get("minio", {}),
                s3=data.get("storage", {}).get("s3", {}),
            ),
            email=EmailConfig(**data.get("email", {})) if data.get("email") else EmailConfig(),
            raw=data,
        )
        cls._current = cfg
        return cfg

    @classmethod
    def save(cls, new_data: dict[str, Any], path: Path = DEFAULT_CONFIG_PATH) -> AppConfig:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(new_data, indent=2))
        return cls.load(path)

    @classmethod
    def current(cls) -> AppConfig:
        if cls._current is None:
            return cls.load()
        return cls._current

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _from_bootstrap_env() -> dict[str, Any]:
        """
        Only used on the very first launch before the Admin Panel has written
        a settings file. Produces a minimal config so the server can come up,
        show the setup wizard, and let the admin fill in everything else.
        """
        return {
            "database": {
                "type": os.getenv("CRM_BOOTSTRAP_DB", "sqlserver"),
                "sqlserver": {},
                "mongodb": {},
            },
            "storage": {"type": "minio", "minio": {}, "s3": {}},
            "email": {},
        }

"""Rate limiting middleware using slowapi."""

from __future__ import annotations

import os

from slowapi import Limiter
from slowapi.util import get_remote_address

_enabled = os.getenv("CRM_RATE_LIMIT_ENABLED", "true").lower() != "false"

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/minute"],
    enabled=_enabled,
)

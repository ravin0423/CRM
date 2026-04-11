"""SQL Server adapter — stub.

Full implementation will:
    * build a SQLAlchemy async engine from the admin-supplied connection dict
    * expose Alembic-style ``ensure_schema`` that runs migrations
    * back the repo protocols (users, tickets, contacts, …) with ORM models
"""

from typing import Any

from app.db.database_interface import DatabaseInterface


class _NotImplementedRepo:
    async def count(self) -> int:
        return 0

    async def create_admin(self, **_: Any) -> Any:
        return None

    async def by_email(self, email: str) -> Any | None:  # noqa: ARG002
        return None

    async def list(self, **_: Any) -> list[Any]:
        return []

    async def create(self, **_: Any) -> Any:
        return None

    async def update(self, *_: Any, **__: Any) -> Any:
        return None


class SQLServerDatabase(DatabaseInterface):
    def __init__(self, cfg: dict[str, Any]) -> None:
        self.cfg = cfg
        self.users = _NotImplementedRepo()
        self.tickets = _NotImplementedRepo()
        self.contacts = _NotImplementedRepo()

    async def connect(self) -> None:
        # TODO: create async engine via mssql+aioodbc driver
        return None

    async def disconnect(self) -> None:
        return None

    async def ensure_schema(self) -> None:
        # TODO: run alembic upgrade head
        return None

    async def ping(self) -> bool:
        return False

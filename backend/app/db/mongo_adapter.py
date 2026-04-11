"""MongoDB adapter — stub.

Full implementation will:
    * create an AsyncIOMotorClient from admin-supplied URI
    * create indexes on first run (``ensure_schema``)
    * back the repo protocols with Motor collections
"""

from typing import Any

from app.db.database_interface import DatabaseInterface
from app.db.sqlserver_adapter import _NotImplementedRepo


class MongoDatabase(DatabaseInterface):
    def __init__(self, cfg: dict[str, Any]) -> None:
        self.cfg = cfg
        self.users = _NotImplementedRepo()
        self.tickets = _NotImplementedRepo()
        self.contacts = _NotImplementedRepo()

    async def connect(self) -> None:
        return None

    async def disconnect(self) -> None:
        return None

    async def ensure_schema(self) -> None:
        # TODO: create indexes on users.email, tickets.ticket_number, …
        return None

    async def ping(self) -> bool:
        return False

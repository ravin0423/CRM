"""
Abstract database interface.

Both the SQL Server (SQLAlchemy) and MongoDB (Motor) adapters implement this
same surface so that services/API layers never import engine-specific code.
Switching databases in the Admin Panel swaps the implementation at runtime.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Protocol


class UserRepo(Protocol):
    async def count(self) -> int: ...
    async def create_admin(
        self, *, email: str, name: str, password: str, must_change_password: bool
    ) -> Any: ...
    async def by_email(self, email: str) -> Any | None: ...


class TicketRepo(Protocol):
    async def list(self, **filters) -> list[Any]: ...
    async def create(self, **data) -> Any: ...
    async def update(self, ticket_id: str, **data) -> Any: ...


class ContactRepo(Protocol):
    async def list(self, **filters) -> list[Any]: ...
    async def create(self, **data) -> Any: ...


class DatabaseInterface(ABC):
    users: UserRepo
    tickets: TicketRepo
    contacts: ContactRepo

    @abstractmethod
    async def connect(self) -> None: ...

    @abstractmethod
    async def disconnect(self) -> None: ...

    @abstractmethod
    async def ensure_schema(self) -> None:
        """
        Create tables/collections on first run. Idempotent — safe to call on
        every startup.
        """

    @abstractmethod
    async def ping(self) -> bool:
        """Used by the Admin Panel ``Test Connection`` button."""

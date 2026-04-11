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
    async def create(
        self,
        *,
        email: str,
        name: str,
        password: str,
        role: str = "agent",
    ) -> Any: ...
    async def by_email(self, email: str) -> Any | None: ...
    async def by_id(self, user_id: int) -> Any | None: ...
    async def list(self) -> list[Any]: ...
    async def set_password(self, user_id: int, new_password: str) -> None: ...


class TicketRepo(Protocol):
    async def list(self, **filters: Any) -> list[Any]: ...
    async def get(self, ticket_id: int) -> Any | None: ...
    async def create(self, **data: Any) -> Any: ...
    async def update(self, ticket_id: int, **data: Any) -> Any: ...
    async def add_comment(
        self, ticket_id: int, user_id: int, content: str, is_internal: bool
    ) -> Any: ...
    async def next_ticket_number(self) -> str: ...


class ContactRepo(Protocol):
    async def list(self, **filters: Any) -> list[Any]: ...
    async def get(self, contact_id: int) -> Any | None: ...
    async def create(self, **data: Any) -> Any: ...
    async def update(self, contact_id: int, **data: Any) -> Any: ...
    async def delete(self, contact_id: int) -> None: ...


class DealRepo(Protocol):
    async def list(self, **filters: Any) -> list[Any]: ...
    async def create(self, **data: Any) -> Any: ...
    async def update(self, deal_id: int, **data: Any) -> Any: ...


class AuditRepo(Protocol):
    async def write(
        self,
        *,
        user_id: int | None,
        action: str,
        entity_type: str,
        entity_id: str | None,
    ) -> None: ...
    async def tail(self, limit: int = 100) -> list[Any]: ...


class DatabaseInterface(ABC):
    users: UserRepo
    tickets: TicketRepo
    contacts: ContactRepo
    deals: DealRepo
    audit: AuditRepo

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

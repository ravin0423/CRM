"""
SQL Server adapter (SQLAlchemy 2.0, async).

Works against real SQL Server Express / RDS SQL Server using the
``mssql+aioodbc`` driver. For tests and zero-install local dev, if no
connection parameters have been configured yet, the adapter falls back to
an in-process SQLite database (``aiosqlite``). This keeps the Admin Panel
reachable so the operator can fill in real credentials.
"""

from __future__ import annotations

import urllib.parse
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.crypto import decrypt
from app.core.security import hash_password
from app.db.database_interface import DatabaseInterface
from app.db.models import (
    AuditLog,
    Base,
    ChatConversation,
    Contact,
    Deal,
    KnowledgeArticle,
    Ticket,
    TicketComment,
    User,
    Workflow,
)


# --------------------------------------------------------------------------- #
# URL construction
# --------------------------------------------------------------------------- #
def _build_sqlserver_url(cfg: dict[str, Any]) -> str | None:
    server = cfg.get("server") or ""
    database = cfg.get("database") or ""
    username = cfg.get("username") or ""
    password_enc = cfg.get("password_encrypted") or cfg.get("password") or ""
    port = cfg.get("port") or 1433
    if not server or not database or not username:
        return None

    password = decrypt(password_enc) if password_enc and "_encrypted" in cfg else password_enc

    odbc_str = (
        f"DRIVER={{ODBC Driver 18 for SQL Server}};"
        f"SERVER={server},{port};"
        f"DATABASE={database};"
        f"UID={username};PWD={password};"
        f"TrustServerCertificate=yes;"
        f"Encrypt=yes;"
    )
    return f"mssql+aioodbc:///?odbc_connect={urllib.parse.quote_plus(odbc_str)}"


# --------------------------------------------------------------------------- #
# Repositories
# --------------------------------------------------------------------------- #
class _SQLUserRepo:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._sf = session_factory

    async def count(self) -> int:
        async with self._sf() as s:
            return int((await s.execute(select(func.count(User.id)))).scalar() or 0)

    async def create_admin(
        self, *, email: str, name: str, password: str, must_change_password: bool
    ) -> User:
        return await self.create(
            email=email,
            name=name,
            password=password,
            role="admin",
            must_change_password=must_change_password,
        )

    async def create(
        self,
        *,
        email: str,
        name: str,
        password: str,
        role: str = "agent",
        must_change_password: bool = False,
    ) -> User:
        async with self._sf() as s:
            user = User(
                email=email,
                name=name,
                password_hash=hash_password(password),
                role=role,
                must_change_password=must_change_password,
            )
            s.add(user)
            await s.commit()
            await s.refresh(user)
            return user

    async def by_email(self, email: str) -> User | None:
        async with self._sf() as s:
            return (await s.execute(select(User).where(User.email == email))).scalar_one_or_none()

    async def by_id(self, user_id: int) -> User | None:
        async with self._sf() as s:
            return await s.get(User, user_id)

    async def list(self) -> list[User]:
        async with self._sf() as s:
            return list((await s.execute(select(User).order_by(User.id))).scalars())

    async def update(self, user_id: int, **data: Any) -> User | None:
        async with self._sf() as s:
            user = await s.get(User, user_id)
            if user is None:
                return None
            for k, v in data.items():
                if hasattr(user, k):
                    setattr(user, k, v)
            await s.commit()
            await s.refresh(user)
            return user

    async def set_password(self, user_id: int, new_password: str) -> None:
        async with self._sf() as s:
            user = await s.get(User, user_id)
            if user is None:
                return
            user.password_hash = hash_password(new_password)
            user.must_change_password = False
            await s.commit()


class _SQLTicketRepo:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._sf = session_factory

    async def next_ticket_number(self) -> str:
        async with self._sf() as s:
            max_id = (await s.execute(select(func.max(Ticket.id)))).scalar() or 0
            return f"T-{max_id + 1:06d}"

    async def list(self, **filters: Any) -> list[Ticket]:
        async with self._sf() as s:
            stmt = select(Ticket).order_by(Ticket.created_at.desc())
            if (status := filters.get("status")) is not None:
                stmt = stmt.where(Ticket.status == status)
            if (agent_id := filters.get("agent_id")) is not None:
                stmt = stmt.where(Ticket.agent_id == agent_id)
            return list((await s.execute(stmt)).scalars())

    async def get(self, ticket_id: int) -> Ticket | None:
        async with self._sf() as s:
            return await s.get(Ticket, ticket_id)

    async def create(self, **data: Any) -> Ticket:
        async with self._sf() as s:
            data.setdefault("ticket_number", await self.next_ticket_number())
            ticket = Ticket(**data)
            s.add(ticket)
            await s.commit()
            await s.refresh(ticket)
            return ticket

    async def update(self, ticket_id: int, **data: Any) -> Ticket | None:
        async with self._sf() as s:
            ticket = await s.get(Ticket, ticket_id)
            if ticket is None:
                return None
            for k, v in data.items():
                if hasattr(ticket, k):
                    setattr(ticket, k, v)
            ticket.updated_at = datetime.now(tz=timezone.utc)
            if data.get("status") == "resolved" and ticket.resolved_at is None:
                ticket.resolved_at = datetime.now(tz=timezone.utc)
            await s.commit()
            await s.refresh(ticket)
            return ticket

    async def add_comment(
        self, ticket_id: int, user_id: int, content: str, is_internal: bool
    ) -> TicketComment:
        async with self._sf() as s:
            comment = TicketComment(
                ticket_id=ticket_id,
                user_id=user_id,
                content=content,
                is_internal=is_internal,
            )
            s.add(comment)
            await s.commit()
            await s.refresh(comment)
            return comment


class _SQLContactRepo:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._sf = session_factory

    async def list(self, **filters: Any) -> list[Contact]:
        async with self._sf() as s:
            stmt = select(Contact).order_by(Contact.created_at.desc())
            if (email := filters.get("email")):
                stmt = stmt.where(Contact.email == email)
            return list((await s.execute(stmt)).scalars())

    async def get(self, contact_id: int) -> Contact | None:
        async with self._sf() as s:
            return await s.get(Contact, contact_id)

    async def create(self, **data: Any) -> Contact:
        async with self._sf() as s:
            contact = Contact(**data)
            s.add(contact)
            await s.commit()
            await s.refresh(contact)
            return contact

    async def update(self, contact_id: int, **data: Any) -> Contact | None:
        async with self._sf() as s:
            c = await s.get(Contact, contact_id)
            if c is None:
                return None
            for k, v in data.items():
                if hasattr(c, k):
                    setattr(c, k, v)
            await s.commit()
            await s.refresh(c)
            return c

    async def delete(self, contact_id: int) -> None:
        async with self._sf() as s:
            c = await s.get(Contact, contact_id)
            if c is not None:
                await s.delete(c)
                await s.commit()


class _SQLDealRepo:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._sf = session_factory

    async def list(self, **filters: Any) -> list[Deal]:
        async with self._sf() as s:
            stmt = select(Deal).order_by(Deal.created_at.desc())
            if (stage := filters.get("stage")):
                stmt = stmt.where(Deal.stage == stage)
            return list((await s.execute(stmt)).scalars())

    async def create(self, **data: Any) -> Deal:
        async with self._sf() as s:
            d = Deal(**data)
            s.add(d)
            await s.commit()
            await s.refresh(d)
            return d

    async def update(self, deal_id: int, **data: Any) -> Deal | None:
        async with self._sf() as s:
            d = await s.get(Deal, deal_id)
            if d is None:
                return None
            for k, v in data.items():
                if hasattr(d, k):
                    setattr(d, k, v)
            await s.commit()
            await s.refresh(d)
            return d


class _SQLAuditRepo:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._sf = session_factory

    async def write(
        self,
        *,
        user_id: int | None,
        action: str,
        entity_type: str,
        entity_id: str | None,
    ) -> None:
        async with self._sf() as s:
            s.add(
                AuditLog(
                    user_id=user_id,
                    action=action,
                    entity_type=entity_type,
                    entity_id=entity_id,
                )
            )
            await s.commit()

    async def tail(self, limit: int = 100) -> list[AuditLog]:
        async with self._sf() as s:
            stmt = select(AuditLog).order_by(AuditLog.id.desc()).limit(limit)
            return list((await s.execute(stmt)).scalars())


class _SQLKnowledgeRepo:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._sf = session_factory

    async def list(self, **filters: Any) -> list[KnowledgeArticle]:
        async with self._sf() as s:
            stmt = select(KnowledgeArticle).order_by(KnowledgeArticle.created_at.desc())
            if (status := filters.get("status")):
                stmt = stmt.where(KnowledgeArticle.status == status)
            return list((await s.execute(stmt)).scalars())

    async def get(self, article_id: int) -> KnowledgeArticle | None:
        async with self._sf() as s:
            return await s.get(KnowledgeArticle, article_id)

    async def by_slug(self, slug: str) -> KnowledgeArticle | None:
        async with self._sf() as s:
            return (
                await s.execute(
                    select(KnowledgeArticle).where(KnowledgeArticle.slug == slug)
                )
            ).scalar_one_or_none()

    async def create(self, **data: Any) -> KnowledgeArticle:
        async with self._sf() as s:
            article = KnowledgeArticle(**data)
            s.add(article)
            await s.commit()
            await s.refresh(article)
            return article

    async def update(self, article_id: int, **data: Any) -> KnowledgeArticle | None:
        async with self._sf() as s:
            a = await s.get(KnowledgeArticle, article_id)
            if a is None:
                return None
            for k, v in data.items():
                if hasattr(a, k):
                    setattr(a, k, v)
            await s.commit()
            await s.refresh(a)
            return a

    async def delete(self, article_id: int) -> None:
        async with self._sf() as s:
            a = await s.get(KnowledgeArticle, article_id)
            if a is not None:
                await s.delete(a)
                await s.commit()

    async def search(self, query: str) -> list[KnowledgeArticle]:
        async with self._sf() as s:
            pattern = f"%{query}%"
            stmt = (
                select(KnowledgeArticle)
                .where(
                    (KnowledgeArticle.title.ilike(pattern))
                    | (KnowledgeArticle.content.ilike(pattern))
                )
                .where(KnowledgeArticle.status == "published")
                .order_by(KnowledgeArticle.views_count.desc())
                .limit(20)
            )
            return list((await s.execute(stmt)).scalars())

    async def increment_views(self, article_id: int) -> None:
        async with self._sf() as s:
            a = await s.get(KnowledgeArticle, article_id)
            if a is not None:
                a.views_count = (a.views_count or 0) + 1
                await s.commit()


class _SQLWorkflowRepo:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._sf = session_factory

    async def list(self) -> list[Workflow]:
        async with self._sf() as s:
            return list((await s.execute(select(Workflow).order_by(Workflow.id))).scalars())

    async def get(self, workflow_id: int) -> Workflow | None:
        async with self._sf() as s:
            return await s.get(Workflow, workflow_id)

    async def create(self, **data: Any) -> Workflow:
        async with self._sf() as s:
            w = Workflow(**data)
            s.add(w)
            await s.commit()
            await s.refresh(w)
            return w

    async def update(self, workflow_id: int, **data: Any) -> Workflow | None:
        async with self._sf() as s:
            w = await s.get(Workflow, workflow_id)
            if w is None:
                return None
            for k, v in data.items():
                if hasattr(w, k):
                    setattr(w, k, v)
            await s.commit()
            await s.refresh(w)
            return w

    async def delete(self, workflow_id: int) -> None:
        async with self._sf() as s:
            w = await s.get(Workflow, workflow_id)
            if w is not None:
                await s.delete(w)
                await s.commit()

    async def list_enabled(self) -> list[Workflow]:
        async with self._sf() as s:
            stmt = select(Workflow).where(Workflow.enabled == True).order_by(Workflow.id)  # noqa: E712
            return list((await s.execute(stmt)).scalars())


class _SQLChatRepo:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._sf = session_factory

    async def create(self, **data: Any) -> ChatConversation:
        async with self._sf() as s:
            data.setdefault("messages", [])
            c = ChatConversation(**data)
            s.add(c)
            await s.commit()
            await s.refresh(c)
            return c

    async def get(self, conversation_id: int) -> ChatConversation | None:
        async with self._sf() as s:
            return await s.get(ChatConversation, conversation_id)

    async def list(self, **filters: Any) -> list[ChatConversation]:
        async with self._sf() as s:
            stmt = select(ChatConversation).order_by(ChatConversation.created_at.desc())
            if (user_id := filters.get("user_id")) is not None:
                stmt = stmt.where(ChatConversation.user_id == user_id)
            if filters.get("resolved") is not None:
                stmt = stmt.where(ChatConversation.resolved == filters["resolved"])
            return list((await s.execute(stmt)).scalars())

    async def append_message(self, conversation_id: int, message: dict[str, Any]) -> ChatConversation | None:
        async with self._sf() as s:
            c = await s.get(ChatConversation, conversation_id)
            if c is None:
                return None
            msgs = list(c.messages) if c.messages else []
            msgs.append(message)
            c.messages = msgs
            await s.commit()
            await s.refresh(c)
            return c

    async def resolve(self, conversation_id: int) -> None:
        async with self._sf() as s:
            c = await s.get(ChatConversation, conversation_id)
            if c is not None:
                c.resolved = True
                await s.commit()


# --------------------------------------------------------------------------- #
# Adapter
# --------------------------------------------------------------------------- #
class SQLServerDatabase(DatabaseInterface):
    """
    Implements :class:`DatabaseInterface` for SQL Server.

    If ``cfg`` does not contain enough info to connect, falls back to an
    in-process SQLite database so the backend can still boot and serve the
    Admin Panel where the real credentials can be entered.
    """

    def __init__(self, cfg: dict[str, Any]) -> None:
        self.cfg = cfg
        self._engine: AsyncEngine | None = None
        self._session_factory: async_sessionmaker[AsyncSession] | None = None
        # Repos constructed in connect() once session factory exists
        self.users = None  # type: ignore[assignment]
        self.tickets = None  # type: ignore[assignment]
        self.contacts = None  # type: ignore[assignment]
        self.deals = None  # type: ignore[assignment]
        self.audit = None  # type: ignore[assignment]
        self.knowledge = None  # type: ignore[assignment]
        self.workflows = None  # type: ignore[assignment]
        self.chat = None  # type: ignore[assignment]

    # -- lifecycle -------------------------------------------------------- #
    async def connect(self) -> None:
        url = _build_sqlserver_url(self.cfg) or "sqlite+aiosqlite:///./config/crm-dev.sqlite"
        self._engine = create_async_engine(url, pool_pre_ping=True, future=True)
        self._session_factory = async_sessionmaker(
            self._engine, expire_on_commit=False, class_=AsyncSession
        )
        sf = self._session_factory
        self.users = _SQLUserRepo(sf)  # type: ignore[assignment]
        self.tickets = _SQLTicketRepo(sf)  # type: ignore[assignment]
        self.contacts = _SQLContactRepo(sf)  # type: ignore[assignment]
        self.deals = _SQLDealRepo(sf)  # type: ignore[assignment]
        self.audit = _SQLAuditRepo(sf)  # type: ignore[assignment]
        self.knowledge = _SQLKnowledgeRepo(sf)  # type: ignore[assignment]
        self.workflows = _SQLWorkflowRepo(sf)  # type: ignore[assignment]
        self.chat = _SQLChatRepo(sf)  # type: ignore[assignment]

    async def disconnect(self) -> None:
        if self._engine is not None:
            await self._engine.dispose()
            self._engine = None
            self._session_factory = None

    async def ensure_schema(self) -> None:
        assert self._engine is not None
        async with self._engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def ping(self) -> bool:
        if self._engine is None:
            return False
        try:
            async with self._engine.connect() as conn:
                await conn.exec_driver_sql("SELECT 1")
            return True
        except Exception:
            return False

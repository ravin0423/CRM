"""
MongoDB adapter (Motor / async).

Implements :class:`DatabaseInterface` with the same field names as the
SQL models so services can work against either backend unchanged.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING

from app.core.crypto import decrypt
from app.core.security import hash_password
from app.db.database_interface import DatabaseInterface


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


def _to_dict(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


# --------------------------------------------------------------------------- #
# Repositories
# --------------------------------------------------------------------------- #
class _MongoUserRepo:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["users"]

    async def count(self) -> int:
        return await self._col.count_documents({})

    async def create_admin(
        self, *, email: str, name: str, password: str, must_change_password: bool
    ) -> dict[str, Any]:
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
    ) -> dict[str, Any]:
        doc = {
            "email": email,
            "name": name,
            "password_hash": hash_password(password),
            "role": role,
            "status": "active",
            "must_change_password": must_change_password,
            "created_at": _utcnow(),
        }
        res = await self._col.insert_one(doc)
        doc["_id"] = res.inserted_id
        return _to_dict(doc)  # type: ignore[return-value]

    async def by_email(self, email: str) -> dict[str, Any] | None:
        return _to_dict(await self._col.find_one({"email": email}))

    async def by_id(self, user_id: int) -> dict[str, Any] | None:
        from bson import ObjectId

        try:
            oid = ObjectId(str(user_id))
        except Exception:
            return None
        return _to_dict(await self._col.find_one({"_id": oid}))

    async def list(self) -> list[dict[str, Any]]:
        return [_to_dict(d) async for d in self._col.find().sort("_id", ASCENDING)]  # type: ignore[misc]

    async def update(self, user_id: int, **data: Any) -> dict[str, Any] | None:
        from bson import ObjectId

        oid = ObjectId(str(user_id))
        if not data:
            return _to_dict(await self._col.find_one({"_id": oid}))
        await self._col.update_one({"_id": oid}, {"$set": data})
        return _to_dict(await self._col.find_one({"_id": oid}))

    async def set_password(self, user_id: int, new_password: str) -> None:
        from bson import ObjectId

        await self._col.update_one(
            {"_id": ObjectId(str(user_id))},
            {"$set": {"password_hash": hash_password(new_password), "must_change_password": False}},
        )


class _MongoTicketRepo:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["tickets"]
        self._comments = db["ticket_comments"]

    async def next_ticket_number(self) -> str:
        count = await self._col.count_documents({})
        return f"T-{count + 1:06d}"

    async def list(self, **filters: Any) -> list[dict[str, Any]]:
        query = {k: v for k, v in filters.items() if v is not None}
        cursor = self._col.find(query).sort("created_at", DESCENDING)
        return [_to_dict(d) async for d in cursor]  # type: ignore[misc]

    async def get(self, ticket_id: int) -> dict[str, Any] | None:
        from bson import ObjectId

        return _to_dict(await self._col.find_one({"_id": ObjectId(str(ticket_id))}))

    async def create(self, **data: Any) -> dict[str, Any]:
        data.setdefault("ticket_number", await self.next_ticket_number())
        data.setdefault("status", "open")
        data.setdefault("priority", "medium")
        data["created_at"] = _utcnow()
        data["updated_at"] = _utcnow()
        res = await self._col.insert_one(data)
        data["_id"] = res.inserted_id
        return _to_dict(data)  # type: ignore[return-value]

    async def update(self, ticket_id: int, **data: Any) -> dict[str, Any] | None:
        from bson import ObjectId

        data["updated_at"] = _utcnow()
        if data.get("status") == "resolved":
            data.setdefault("resolved_at", _utcnow())
        await self._col.update_one({"_id": ObjectId(str(ticket_id))}, {"$set": data})
        return await self.get(ticket_id)

    async def add_comment(
        self, ticket_id: int, user_id: int, content: str, is_internal: bool
    ) -> dict[str, Any]:
        doc = {
            "ticket_id": str(ticket_id),
            "user_id": user_id,
            "content": content,
            "is_internal": is_internal,
            "created_at": _utcnow(),
        }
        res = await self._comments.insert_one(doc)
        doc["_id"] = res.inserted_id
        return _to_dict(doc)  # type: ignore[return-value]


class _MongoContactRepo:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["contacts"]

    async def list(self, **filters: Any) -> list[dict[str, Any]]:
        query = {k: v for k, v in filters.items() if v is not None}
        return [_to_dict(d) async for d in self._col.find(query).sort("created_at", DESCENDING)]  # type: ignore[misc]

    async def get(self, contact_id: int) -> dict[str, Any] | None:
        from bson import ObjectId

        return _to_dict(await self._col.find_one({"_id": ObjectId(str(contact_id))}))

    async def create(self, **data: Any) -> dict[str, Any]:
        data["created_at"] = _utcnow()
        res = await self._col.insert_one(data)
        data["_id"] = res.inserted_id
        return _to_dict(data)  # type: ignore[return-value]

    async def update(self, contact_id: int, **data: Any) -> dict[str, Any] | None:
        from bson import ObjectId

        await self._col.update_one({"_id": ObjectId(str(contact_id))}, {"$set": data})
        return await self.get(contact_id)

    async def delete(self, contact_id: int) -> None:
        from bson import ObjectId

        await self._col.delete_one({"_id": ObjectId(str(contact_id))})


class _MongoDealRepo:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["deals"]

    async def list(self, **filters: Any) -> list[dict[str, Any]]:
        query = {k: v for k, v in filters.items() if v is not None}
        return [_to_dict(d) async for d in self._col.find(query).sort("created_at", DESCENDING)]  # type: ignore[misc]

    async def create(self, **data: Any) -> dict[str, Any]:
        data["created_at"] = _utcnow()
        res = await self._col.insert_one(data)
        data["_id"] = res.inserted_id
        return _to_dict(data)  # type: ignore[return-value]

    async def get(self, deal_id: int) -> dict[str, Any] | None:
        from bson import ObjectId

        return _to_dict(await self._col.find_one({"_id": ObjectId(str(deal_id))}))

    async def update(self, deal_id: int, **data: Any) -> dict[str, Any] | None:
        from bson import ObjectId

        await self._col.update_one({"_id": ObjectId(str(deal_id))}, {"$set": data})
        return _to_dict(await self._col.find_one({"_id": ObjectId(str(deal_id))}))

    async def delete(self, deal_id: int) -> None:
        from bson import ObjectId

        await self._col.delete_one({"_id": ObjectId(str(deal_id))})


class _MongoAuditRepo:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["audit_log"]

    async def write(self, *, user_id, action, entity_type, entity_id) -> None:
        await self._col.insert_one(
            {
                "user_id": user_id,
                "action": action,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "timestamp": _utcnow(),
            }
        )

    async def tail(self, limit: int = 100) -> list[dict[str, Any]]:
        return [_to_dict(d) async for d in self._col.find().sort("_id", DESCENDING).limit(limit)]  # type: ignore[misc]


class _MongoKnowledgeRepo:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["knowledge_articles"]

    async def list(self, **filters: Any) -> list[dict[str, Any]]:
        query = {k: v for k, v in filters.items() if v is not None}
        return [_to_dict(d) async for d in self._col.find(query).sort("created_at", DESCENDING)]  # type: ignore[misc]

    async def get(self, article_id: int) -> dict[str, Any] | None:
        from bson import ObjectId
        return _to_dict(await self._col.find_one({"_id": ObjectId(str(article_id))}))

    async def by_slug(self, slug: str) -> dict[str, Any] | None:
        return _to_dict(await self._col.find_one({"slug": slug}))

    async def create(self, **data: Any) -> dict[str, Any]:
        data.setdefault("status", "draft")
        data.setdefault("views_count", 0)
        data["created_at"] = _utcnow()
        res = await self._col.insert_one(data)
        data["_id"] = res.inserted_id
        return _to_dict(data)  # type: ignore[return-value]

    async def update(self, article_id: int, **data: Any) -> dict[str, Any] | None:
        from bson import ObjectId
        await self._col.update_one({"_id": ObjectId(str(article_id))}, {"$set": data})
        return await self.get(article_id)

    async def delete(self, article_id: int) -> None:
        from bson import ObjectId
        await self._col.delete_one({"_id": ObjectId(str(article_id))})

    async def search(self, query: str) -> list[dict[str, Any]]:
        import re
        pattern = re.compile(re.escape(query), re.IGNORECASE)
        cursor = self._col.find(
            {"status": "published", "$or": [{"title": pattern}, {"content": pattern}]}
        ).sort("views_count", DESCENDING).limit(20)
        return [_to_dict(d) async for d in cursor]  # type: ignore[misc]

    async def increment_views(self, article_id: int) -> None:
        from bson import ObjectId
        await self._col.update_one(
            {"_id": ObjectId(str(article_id))},
            {"$inc": {"views_count": 1}},
        )


class _MongoWorkflowRepo:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["workflows"]

    async def list(self) -> list[dict[str, Any]]:
        return [_to_dict(d) async for d in self._col.find().sort("_id", ASCENDING)]  # type: ignore[misc]

    async def get(self, workflow_id: int) -> dict[str, Any] | None:
        from bson import ObjectId
        return _to_dict(await self._col.find_one({"_id": ObjectId(str(workflow_id))}))

    async def create(self, **data: Any) -> dict[str, Any]:
        data.setdefault("enabled", True)
        data["created_at"] = _utcnow()
        res = await self._col.insert_one(data)
        data["_id"] = res.inserted_id
        return _to_dict(data)  # type: ignore[return-value]

    async def update(self, workflow_id: int, **data: Any) -> dict[str, Any] | None:
        from bson import ObjectId
        await self._col.update_one({"_id": ObjectId(str(workflow_id))}, {"$set": data})
        return await self.get(workflow_id)

    async def delete(self, workflow_id: int) -> None:
        from bson import ObjectId
        await self._col.delete_one({"_id": ObjectId(str(workflow_id))})

    async def list_enabled(self) -> list[dict[str, Any]]:
        return [_to_dict(d) async for d in self._col.find({"enabled": True}).sort("_id", ASCENDING)]  # type: ignore[misc]


class _MongoChatRepo:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["chat_conversations"]

    async def create(self, **data: Any) -> dict[str, Any]:
        data.setdefault("messages", [])
        data.setdefault("resolved", False)
        data["created_at"] = _utcnow()
        res = await self._col.insert_one(data)
        data["_id"] = res.inserted_id
        return _to_dict(data)  # type: ignore[return-value]

    async def get(self, conversation_id: int) -> dict[str, Any] | None:
        from bson import ObjectId
        return _to_dict(await self._col.find_one({"_id": ObjectId(str(conversation_id))}))

    async def list(self, **filters: Any) -> list[dict[str, Any]]:
        query = {k: v for k, v in filters.items() if v is not None}
        return [_to_dict(d) async for d in self._col.find(query).sort("created_at", DESCENDING)]  # type: ignore[misc]

    async def append_message(self, conversation_id: int, message: dict[str, Any]) -> dict[str, Any] | None:
        from bson import ObjectId
        await self._col.update_one(
            {"_id": ObjectId(str(conversation_id))},
            {"$push": {"messages": message}},
        )
        return await self.get(conversation_id)

    async def resolve(self, conversation_id: int) -> None:
        from bson import ObjectId
        await self._col.update_one(
            {"_id": ObjectId(str(conversation_id))},
            {"$set": {"resolved": True}},
        )


# --------------------------------------------------------------------------- #
# Adapter
# --------------------------------------------------------------------------- #
class MongoDatabase(DatabaseInterface):
    def __init__(self, cfg: dict[str, Any]) -> None:
        self.cfg = cfg
        self._client: AsyncIOMotorClient | None = None
        self._db: AsyncIOMotorDatabase | None = None
        self.users = None  # type: ignore[assignment]
        self.tickets = None  # type: ignore[assignment]
        self.contacts = None  # type: ignore[assignment]
        self.deals = None  # type: ignore[assignment]
        self.audit = None  # type: ignore[assignment]
        self.knowledge = None  # type: ignore[assignment]
        self.workflows = None  # type: ignore[assignment]
        self.chat = None  # type: ignore[assignment]

    async def connect(self) -> None:
        conn_enc = self.cfg.get("connection_string_encrypted") or ""
        conn = decrypt(conn_enc) if conn_enc else self.cfg.get("connection_string", "")
        dbname = self.cfg.get("database") or "crm"
        if not conn:
            # Bootstrap: allow an unauthenticated local connection to come up
            # so the Admin Panel can be used to fill in real credentials.
            conn = "mongodb://localhost:27017"
        self._client = AsyncIOMotorClient(conn, serverSelectionTimeoutMS=2000)
        self._db = self._client[dbname]
        db = self._db
        self.users = _MongoUserRepo(db)  # type: ignore[assignment]
        self.tickets = _MongoTicketRepo(db)  # type: ignore[assignment]
        self.contacts = _MongoContactRepo(db)  # type: ignore[assignment]
        self.deals = _MongoDealRepo(db)  # type: ignore[assignment]
        self.audit = _MongoAuditRepo(db)  # type: ignore[assignment]
        self.knowledge = _MongoKnowledgeRepo(db)  # type: ignore[assignment]
        self.workflows = _MongoWorkflowRepo(db)  # type: ignore[assignment]
        self.chat = _MongoChatRepo(db)  # type: ignore[assignment]

    async def disconnect(self) -> None:
        if self._client is not None:
            self._client.close()
            self._client = None
            self._db = None

    async def ensure_schema(self) -> None:
        """Create indexes — idempotent."""
        assert self._db is not None
        await self._db["users"].create_index("email", unique=True)
        await self._db["tickets"].create_index("ticket_number", unique=True)
        await self._db["tickets"].create_index([("status", ASCENDING), ("created_at", DESCENDING)])
        await self._db["contacts"].create_index("email", unique=True)
        await self._db["knowledge_articles"].create_index("slug", unique=True)
        await self._db["audit_log"].create_index([("timestamp", DESCENDING)])

    async def ping(self) -> bool:
        if self._client is None:
            return False
        try:
            await self._client.admin.command("ping")
            return True
        except Exception:
            return False

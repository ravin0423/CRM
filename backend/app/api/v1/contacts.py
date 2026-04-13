"""Contact endpoints — CRM side of the app."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, get_db
from app.db.database_interface import DatabaseInterface
from app.schemas.contacts import ContactCreate, ContactUpdate

router = APIRouter()


def _uid(user) -> int:
    return int((user.get("id") if isinstance(user, dict) else getattr(user, "id", 0)) or 0)


def _serialize(obj):
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj
    result = {}
    for column in getattr(obj, "__table__", type("t", (), {"columns": []})).columns:
        result[column.name] = getattr(obj, column.name, None)
    return result


@router.get("")
async def list_contacts(
    email: str | None = None,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    return [_serialize(c) for c in await db.contacts.list(email=email)]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_contact(
    payload: ContactCreate,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    contact = await db.contacts.create(**payload.model_dump())
    cid = getattr(contact, "id", None) or (contact.get("id") if isinstance(contact, dict) else None)
    await db.audit.write(
        user_id=_uid(user),
        action="create_contact",
        entity_type="contact",
        entity_id=str(cid),
    )
    return _serialize(contact)


@router.get("/{contact_id}")
async def get_contact(
    contact_id: int,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    contact = await db.contacts.get(contact_id)
    if contact is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contact not found")
    return _serialize(contact)


@router.patch("/{contact_id}")
async def update_contact(
    contact_id: int,
    payload: ContactUpdate,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    contact = await db.contacts.update(contact_id, **payload.model_dump(exclude_unset=True))
    if contact is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contact not found")
    await db.audit.write(
        user_id=_uid(user),
        action="update_contact",
        entity_type="contact",
        entity_id=str(contact_id),
    )
    return _serialize(contact)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: int,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(get_current_user),
):
    await db.contacts.delete(contact_id)
    await db.audit.write(
        user_id=_uid(user),
        action="delete_contact",
        entity_type="contact",
        entity_id=str(contact_id),
    )

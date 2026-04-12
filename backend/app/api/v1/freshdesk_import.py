"""
Freshdesk import wizard — six-step API mirrored by the Admin Panel UI.

    1. POST /connect         — validate domain + API key
    2. POST /inventory       — preview counts per object type
    3. POST /mapping         — persist field/status/priority maps
    4. POST /preview         — sample the first N objects per type
    5. POST /start           — kick off background import job
    6. GET  /status/{job_id} — live progress for the progress bar
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_db, require_admin
from app.db.database_interface import DatabaseInterface
from app.integrations.freshdesk import FreshdeskClient

router = APIRouter()

# In-memory job store — Phase 2 replaces this with Celery + Redis state.
_jobs: dict[str, dict[str, Any]] = {}
_saved_mappings: dict[str, Any] = {}


def _client_from_payload(payload: dict) -> FreshdeskClient:
    domain = payload.get("domain", "")
    api_key = payload.get("api_key", "")
    if not domain or not api_key:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "domain and api_key required")
    return FreshdeskClient(domain, api_key)


@router.post("/connect")
async def connect(payload: dict, user=Depends(require_admin)):
    """Step 1: Validate Freshdesk credentials."""
    client = _client_from_payload(payload)
    try:
        ok = await client.ping()
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Connection failed: {exc}") from exc
    if not ok:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid credentials or domain")
    return {"ok": True, "domain": payload["domain"]}


@router.post("/inventory")
async def inventory(payload: dict, user=Depends(require_admin)):
    """Step 2: Preview counts for each object type."""
    client = _client_from_payload(payload)
    try:
        tickets = await client.count_tickets()
        contacts = await client.count_contacts()
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Inventory failed: {exc}") from exc
    return {"tickets": tickets, "contacts": contacts}


@router.post("/mapping")
async def mapping(payload: dict, user=Depends(require_admin)):
    """Step 3: Save field/status/priority mapping for the upcoming import."""
    _saved_mappings.update(payload.get("mappings", {}))
    return {"saved": True, "mappings": _saved_mappings}


@router.post("/preview")
async def preview(payload: dict, user=Depends(require_admin)):
    """Step 4: Sample a few records so the operator can verify mapping."""
    client = _client_from_payload(payload)
    n = min(int(payload.get("sample_size", 5)), 10)
    try:
        sample_tickets = await client.sample_tickets(n)
        sample_contacts = await client.sample_contacts(n)
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Preview failed: {exc}") from exc
    return {
        "tickets": sample_tickets,
        "contacts": sample_contacts,
    }


@router.post("/start")
async def start(
    payload: dict,
    db: DatabaseInterface = Depends(get_db),
    user=Depends(require_admin),
):
    """Step 5: Start the background import job."""
    client = _client_from_payload(payload)

    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "job_id": job_id,
        "stage": "starting",
        "progress": 0,
        "imported_tickets": 0,
        "imported_contacts": 0,
        "errors": [],
        "started_at": datetime.now(tz=timezone.utc).isoformat(),
        "finished_at": None,
    }

    # Run import in the background (in-process for Phase 1.5; Celery in Phase 2).
    asyncio.create_task(_run_import(job_id, client, db))
    return {"job_id": job_id}


@router.get("/status/{job_id}")
async def get_status(job_id: str, user=Depends(require_admin)):
    """Step 6: Poll import progress."""
    job = _jobs.get(job_id)
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    return job


async def _run_import(
    job_id: str,
    client: FreshdeskClient,
    db: DatabaseInterface,
) -> None:
    """Background import task — streams contacts then tickets from Freshdesk."""
    job = _jobs[job_id]
    try:
        # Phase A: Import contacts
        job["stage"] = "importing_contacts"
        async for fd_contact in client.iter_contacts():
            email = fd_contact.get("email", "")
            if not email:
                continue
            existing = await db.contacts.list(email=email)
            if not existing:
                await db.contacts.create(
                    email=email,
                    name=fd_contact.get("name", ""),
                    company=fd_contact.get("company_name", ""),
                    phone=fd_contact.get("phone", ""),
                )
            job["imported_contacts"] += 1
            job["progress"] = 25  # rough progress — contacts phase

        # Phase B: Import tickets
        job["stage"] = "importing_tickets"
        job["progress"] = 30
        async for fd_ticket in client.iter_tickets():
            subject = fd_ticket.get("subject", "(no subject)")
            description = fd_ticket.get("description_text", "") or fd_ticket.get("description", "")
            # Map Freshdesk priority (1=Low,2=Med,3=High,4=Urgent) to ours.
            prio_map = {1: "low", 2: "medium", 3: "high", 4: "urgent"}
            priority = prio_map.get(fd_ticket.get("priority", 2), "medium")
            # Map Freshdesk status (2=Open,3=Pending,4=Resolved,5=Closed) to ours.
            status_map = {2: "open", 3: "pending", 4: "resolved", 5: "closed"}
            fd_status = status_map.get(fd_ticket.get("status", 2), "open")

            await db.tickets.create(
                subject=subject,
                description=description,
                priority=priority,
                status=fd_status,
            )
            job["imported_tickets"] += 1
            total = job["imported_tickets"] + job["imported_contacts"]
            job["progress"] = min(30 + int(70 * job["imported_tickets"] / max(total, 1)), 99)

        job["stage"] = "done"
        job["progress"] = 100
        job["finished_at"] = datetime.now(tz=timezone.utc).isoformat()

    except Exception as exc:
        job["stage"] = "error"
        job["errors"].append(str(exc))
        job["finished_at"] = datetime.now(tz=timezone.utc).isoformat()

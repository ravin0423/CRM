"""
Freshdesk import wizard — six-step API mirrored by the Admin Panel UI.

    1. POST /connect         — validate domain + API key
    2. POST /inventory       — preview counts per object type
    3. POST /mapping         — persist field/status/priority maps
    4. POST /preview         — sample the first N objects per type
    5. POST /start           — kick off background import job
    6. GET  /status/{job_id} — live progress for the progress bar
"""

from fastapi import APIRouter

router = APIRouter()


@router.post("/connect")
async def connect(payload: dict):
    return {"ok": True, "domain": payload.get("domain")}


@router.post("/inventory")
async def inventory(payload: dict):
    return {"tickets": 0, "contacts": 0, "templates": 0, "custom_fields": 0}


@router.post("/mapping")
async def mapping(payload: dict):
    return {"saved": True}


@router.post("/preview")
async def preview(payload: dict):
    return {"samples": []}


@router.post("/start")
async def start(payload: dict):
    return {"job_id": "stub-job"}


@router.get("/status/{job_id}")
async def status(job_id: str):
    return {"job_id": job_id, "progress": 0, "stage": "pending"}

"""Analytics & reporting endpoints — dashboards, CSAT, agent metrics."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/dashboard")
async def dashboard():
    return {
        "tickets_open": 0,
        "tickets_resolved_today": 0,
        "avg_first_response_minutes": 0,
        "csat": 0.0,
    }

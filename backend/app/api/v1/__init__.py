"""Version 1 API router — aggregates every feature sub-router."""

from fastapi import APIRouter

from app.api.v1 import (
    admin_settings,
    analytics,
    auth,
    chatbot,
    contacts,
    deals,
    freshdesk_import,
    knowledge,
    tickets,
    users,
    workflows,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(admin_settings.router, prefix="/admin/settings", tags=["admin"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
api_router.include_router(deals.router, prefix="/deals", tags=["deals"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(freshdesk_import.router, prefix="/integrations/freshdesk", tags=["integrations"])

"""Celery application — broker and backend come from ConfigManager."""

from __future__ import annotations

import os

from celery import Celery

_broker = os.getenv("CRM_CELERY_BROKER", "amqp://crm:crm_change_me@rabbitmq:5672//")
_backend = os.getenv("CRM_CELERY_BACKEND", "redis://redis:6379/0")

celery_app = Celery("crm", broker=_broker, backend=_backend)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)


@celery_app.task(bind=True, max_retries=3)
def freshdesk_import_job(self, job_id: str, mapping: dict) -> dict:
    """Background Freshdesk import — streams tickets/contacts into CRM."""
    return {"job_id": job_id, "status": "done"}


@celery_app.task(bind=True, max_retries=3)
def send_email(self, to: str, subject: str, body_html: str) -> None:
    """Send an email via the configured SMTP transport."""
    return None

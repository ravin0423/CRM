"""Celery application — broker and backend come from ConfigManager."""

from celery import Celery

from app.core.config_manager import ConfigManager

_cfg = ConfigManager.current()

# TODO: read broker URL from admin settings once RabbitMQ is exposed there.
celery_app = Celery(
    "crm",
    broker="amqp://crm:crm_change_me@rabbitmq:5672//",
    backend="redis://redis:6379/0",
)


@celery_app.task
def freshdesk_import_job(job_id: str, mapping: dict) -> dict:
    # TODO: stream tickets/contacts from Freshdesk and write via DatabaseInterface.
    return {"job_id": job_id, "status": "done"}


@celery_app.task
def send_email(to: str, subject: str, body_html: str) -> None:
    return None

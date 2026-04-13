"""
SMTP email adapter (aiosmtplib).

Reads configuration from :func:`app.core.config_manager.ConfigManager.current`
so a change in the Admin Panel Email tab takes effect on the next send.
"""

from __future__ import annotations

from email.message import EmailMessage

import aiosmtplib

from app.core.config_manager import ConfigManager
from app.core.crypto import decrypt


def _email_cfg() -> dict:
    raw = ConfigManager.current().raw.get("email", {})
    return {
        "host": raw.get("smtp_host", ""),
        "port": int(raw.get("smtp_port", 587) or 587),
        "username": raw.get("username", ""),
        "password": decrypt(raw.get("password_encrypted", "") or ""),
        "from_email": raw.get("from_email", ""),
        "from_name": raw.get("from_name", "Support CRM"),
    }


async def send_email(
    to: str,
    subject: str,
    body_html: str,
    body_text: str | None = None,
    cfg_override: dict | None = None,
) -> None:
    cfg = cfg_override or _email_cfg()
    if not cfg.get("host"):
        raise RuntimeError("SMTP host not configured. Set it in Admin Panel → Email.")

    msg = EmailMessage()
    msg["From"] = f"{cfg['from_name']} <{cfg['from_email']}>"
    msg["To"] = to
    msg["Subject"] = subject
    if body_text:
        msg.set_content(body_text)
        msg.add_alternative(body_html, subtype="html")
    else:
        msg.set_content(body_html, subtype="html")

    await aiosmtplib.send(
        msg,
        hostname=cfg["host"],
        port=cfg["port"],
        username=cfg["username"] or None,
        password=cfg["password"] or None,
        start_tls=cfg["port"] == 587,
        use_tls=cfg["port"] == 465,
    )


async def test_email(cfg: dict, recipient: str) -> None:
    await send_email(
        to=recipient,
        subject="CRM test email",
        body_html="<p>This is a test from the Internal Support CRM admin panel.</p>",
        body_text="This is a test from the Internal Support CRM admin panel.",
        cfg_override={
            "host": cfg.get("smtp_host", ""),
            "port": int(cfg.get("smtp_port", 587) or 587),
            "username": cfg.get("username", ""),
            "password": cfg.get("password", ""),
            "from_email": cfg.get("from_email", ""),
            "from_name": cfg.get("from_name", "Support CRM"),
        },
    )

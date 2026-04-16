"""First-run bootstrap: seed the admin user and ensure the system is usable."""

from app.core.config_manager import AppConfig
from app.db.database_interface import DatabaseInterface


async def bootstrap_first_run(db: DatabaseInterface, config: AppConfig) -> None:
    """
    If no users exist, create the default administrator so the operator can
    log in and finish configuration through the Admin Panel.

    The default credentials (admin@company.com / password123) are a well-known
    bootstrap pair. The login UI forces a password change on first login.
    """
    user_count = await db.users.count()
    if user_count == 0:
        try:
            await db.users.create_admin(
                email="admin@company.com",
                name="Administrator",
                password="password123",
                must_change_password=True,
            )
        except Exception:
            # Another worker may have already seeded the admin user
            pass

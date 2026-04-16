"""Factory that returns the correct DatabaseInterface based on admin settings."""

from app.core.config_manager import DatabaseConfig
from app.db.database_interface import DatabaseInterface
from app.db.sqlserver_adapter import SQLServerDatabase
from app.db.mongo_adapter import MongoDatabase


class DatabaseFactory:
    @staticmethod
    def build(cfg: DatabaseConfig) -> DatabaseInterface:
        if cfg.type == "mongodb":
            return MongoDatabase(cfg.mongodb)
        # "sqlserver" is also the fallback for sqlite/postgres/unknown types,
        # because SQLServerDatabase gracefully falls back to an in-process
        # SQLite database when no SQL Server connection details are configured.
        return SQLServerDatabase(cfg.sqlserver)

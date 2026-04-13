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
        if cfg.type == "sqlserver":
            return SQLServerDatabase(cfg.sqlserver)
        raise ValueError(f"Unknown database type: {cfg.type}")

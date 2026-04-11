"""
Storage abstraction — identical API for MinIO (local) and S3 (AWS).

The Admin Panel writes ``storage.type`` to settings; this module picks the
right client transparently. The rest of the codebase calls
``storage.put(key, data)`` without caring where the bytes end up.
"""

from __future__ import annotations

from typing import BinaryIO, Protocol


class ObjectStorage(Protocol):
    async def put(self, key: str, data: BinaryIO, content_type: str) -> str: ...
    async def get(self, key: str) -> bytes: ...
    async def delete(self, key: str) -> None: ...
    async def presign(self, key: str, ttl_seconds: int = 900) -> str: ...


class MinIOStorage:
    def __init__(self, cfg: dict) -> None:
        self.cfg = cfg
        # TODO: from minio import Minio; self.client = Minio(...)

    async def put(self, key, data, content_type):  # type: ignore[override]
        raise NotImplementedError

    async def get(self, key):  # type: ignore[override]
        raise NotImplementedError

    async def delete(self, key):  # type: ignore[override]
        raise NotImplementedError

    async def presign(self, key, ttl_seconds=900):  # type: ignore[override]
        raise NotImplementedError


class S3Storage:
    def __init__(self, cfg: dict) -> None:
        self.cfg = cfg
        # TODO: import boto3; self.client = boto3.client("s3", ...)

    async def put(self, key, data, content_type):  # type: ignore[override]
        raise NotImplementedError

    async def get(self, key):  # type: ignore[override]
        raise NotImplementedError

    async def delete(self, key):  # type: ignore[override]
        raise NotImplementedError

    async def presign(self, key, ttl_seconds=900):  # type: ignore[override]
        raise NotImplementedError


def build_storage(cfg) -> ObjectStorage:
    if cfg.type == "s3":
        return S3Storage(cfg.s3)  # type: ignore[return-value]
    return MinIOStorage(cfg.minio)  # type: ignore[return-value]

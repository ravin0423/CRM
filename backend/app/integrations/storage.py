"""
Storage abstraction — identical API for MinIO (local) and S3 (AWS).

The Admin Panel writes ``storage.type`` to settings; this module picks the
right client transparently. The rest of the codebase calls
``storage.put(key, data, content_type)`` without caring where the bytes
end up.
"""

from __future__ import annotations

import asyncio
import io
from datetime import timedelta
from typing import Protocol
from urllib.parse import urlparse

from app.core.config_manager import StorageConfig
from app.core.crypto import decrypt


class ObjectStorage(Protocol):
    async def put(self, key: str, data: bytes, content_type: str) -> str: ...
    async def get(self, key: str) -> bytes: ...
    async def delete(self, key: str) -> None: ...
    async def presign(self, key: str, ttl_seconds: int = 900) -> str: ...
    async def ensure_bucket(self) -> None: ...
    async def ping(self) -> bool: ...


class MinIOStorage:
    def __init__(self, cfg: dict) -> None:
        from minio import Minio  # type: ignore[import-not-found]

        endpoint = cfg.get("endpoint", "http://localhost:9000")
        parsed = urlparse(endpoint)
        host = parsed.netloc or parsed.path
        secure = parsed.scheme == "https"
        access = cfg.get("access_key", "")
        secret = decrypt(cfg.get("secret_key_encrypted", "") or "") or cfg.get("secret_key", "")
        self._bucket = cfg.get("bucket") or "crm-files"
        self._client = Minio(host, access_key=access, secret_key=secret, secure=secure)

    async def ensure_bucket(self) -> None:
        loop = asyncio.get_running_loop()

        def _sync():
            if not self._client.bucket_exists(self._bucket):
                self._client.make_bucket(self._bucket)

        await loop.run_in_executor(None, _sync)

    async def put(self, key: str, data: bytes, content_type: str) -> str:
        loop = asyncio.get_running_loop()

        def _sync():
            self._client.put_object(
                self._bucket,
                key,
                io.BytesIO(data),
                length=len(data),
                content_type=content_type,
            )

        await loop.run_in_executor(None, _sync)
        return key

    async def get(self, key: str) -> bytes:
        loop = asyncio.get_running_loop()

        def _sync():
            resp = self._client.get_object(self._bucket, key)
            try:
                return resp.read()
            finally:
                resp.close()
                resp.release_conn()

        return await loop.run_in_executor(None, _sync)

    async def delete(self, key: str) -> None:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, lambda: self._client.remove_object(self._bucket, key))

    async def presign(self, key: str, ttl_seconds: int = 900) -> str:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None,
            lambda: self._client.presigned_get_object(
                self._bucket, key, expires=timedelta(seconds=ttl_seconds)
            ),
        )

    async def ping(self) -> bool:
        try:
            await self.ensure_bucket()
            return True
        except Exception:
            return False


class S3Storage:
    def __init__(self, cfg: dict) -> None:
        import boto3  # type: ignore[import-not-found]

        access = cfg.get("access_key", "")
        secret = decrypt(cfg.get("secret_key_encrypted", "") or "") or cfg.get("secret_key", "")
        region = cfg.get("region", "us-east-1")
        self._bucket = cfg.get("bucket") or "crm-files"
        self._client = boto3.client(
            "s3",
            aws_access_key_id=access or None,
            aws_secret_access_key=secret or None,
            region_name=region,
        )

    async def ensure_bucket(self) -> None:
        loop = asyncio.get_running_loop()

        def _sync():
            try:
                self._client.head_bucket(Bucket=self._bucket)
            except Exception:
                self._client.create_bucket(Bucket=self._bucket)

        await loop.run_in_executor(None, _sync)

    async def put(self, key: str, data: bytes, content_type: str) -> str:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None,
            lambda: self._client.put_object(
                Bucket=self._bucket, Key=key, Body=data, ContentType=content_type
            ),
        )
        return key

    async def get(self, key: str) -> bytes:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None,
            lambda: self._client.get_object(Bucket=self._bucket, Key=key)["Body"].read(),
        )

    async def delete(self, key: str) -> None:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None, lambda: self._client.delete_object(Bucket=self._bucket, Key=key)
        )

    async def presign(self, key: str, ttl_seconds: int = 900) -> str:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None,
            lambda: self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": key},
                ExpiresIn=ttl_seconds,
            ),
        )

    async def ping(self) -> bool:
        try:
            await self.ensure_bucket()
            return True
        except Exception:
            return False


def build_storage(cfg: StorageConfig) -> ObjectStorage:
    if cfg.type == "s3":
        return S3Storage(cfg.s3)  # type: ignore[return-value]
    return MinIOStorage(cfg.minio)  # type: ignore[return-value]


def build_storage_from_dict(cfg_type: str, params: dict) -> ObjectStorage:
    """For the Admin Panel Test Connection button."""
    if cfg_type == "s3":
        return S3Storage(params)  # type: ignore[return-value]
    return MinIOStorage(params)  # type: ignore[return-value]

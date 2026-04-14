"""Global exception handler middleware."""

from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.core.logging import get_logger

logger = get_logger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        try:
            return await call_next(request)
        except Exception:
            logger.exception(
                "unhandled_error",
                method=request.method,
                path=request.url.path,
            )
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"},
            )

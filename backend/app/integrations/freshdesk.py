"""Freshdesk API client used by the import wizard."""

from __future__ import annotations

from typing import Any, AsyncIterator

import httpx


class FreshdeskClient:
    """Thin async wrapper around the Freshdesk REST API v2."""

    def __init__(self, domain: str, api_key: str) -> None:
        self.base = f"https://{domain}/api/v2"
        self.auth = (api_key, "X")

    async def ping(self) -> bool:
        async with httpx.AsyncClient(auth=self.auth, timeout=10) as client:
            r = await client.get(f"{self.base}/tickets", params={"per_page": 1})
            return r.status_code == 200

    async def count_tickets(self) -> int:
        """Return the total number of tickets (approximation via first page)."""
        async with httpx.AsyncClient(auth=self.auth, timeout=10) as client:
            r = await client.get(f"{self.base}/tickets", params={"per_page": 1})
            r.raise_for_status()
            total = r.headers.get("X-Total-Count") or r.headers.get("x-total-count")
            if total:
                return int(total)
            return len(r.json())

    async def count_contacts(self) -> int:
        async with httpx.AsyncClient(auth=self.auth, timeout=10) as client:
            r = await client.get(f"{self.base}/contacts", params={"per_page": 1})
            r.raise_for_status()
            total = r.headers.get("X-Total-Count") or r.headers.get("x-total-count")
            if total:
                return int(total)
            return len(r.json())

    async def iter_tickets(self, per_page: int = 100) -> AsyncIterator[dict[str, Any]]:
        """Paginate through all tickets."""
        page = 1
        async with httpx.AsyncClient(auth=self.auth, timeout=30) as client:
            while True:
                r = await client.get(
                    f"{self.base}/tickets",
                    params={"per_page": per_page, "page": page, "include": "requester,stats"},
                )
                r.raise_for_status()
                batch = r.json()
                if not batch:
                    break
                for ticket in batch:
                    yield ticket
                if len(batch) < per_page:
                    break
                page += 1

    async def iter_contacts(self, per_page: int = 100) -> AsyncIterator[dict[str, Any]]:
        """Paginate through all contacts."""
        page = 1
        async with httpx.AsyncClient(auth=self.auth, timeout=30) as client:
            while True:
                r = await client.get(
                    f"{self.base}/contacts",
                    params={"per_page": per_page, "page": page},
                )
                r.raise_for_status()
                batch = r.json()
                if not batch:
                    break
                for contact in batch:
                    yield contact
                if len(batch) < per_page:
                    break
                page += 1

    async def sample_tickets(self, n: int = 5) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(auth=self.auth, timeout=10) as client:
            r = await client.get(f"{self.base}/tickets", params={"per_page": n})
            r.raise_for_status()
            return r.json()[:n]

    async def sample_contacts(self, n: int = 5) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(auth=self.auth, timeout=10) as client:
            r = await client.get(f"{self.base}/contacts", params={"per_page": n})
            r.raise_for_status()
            return r.json()[:n]

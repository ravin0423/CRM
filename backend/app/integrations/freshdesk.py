"""Freshdesk API client used by the import wizard."""

from __future__ import annotations

import httpx


class FreshdeskClient:
    def __init__(self, domain: str, api_key: str) -> None:
        self.base = f"https://{domain}/api/v2"
        self.auth = (api_key, "X")

    async def ping(self) -> bool:
        async with httpx.AsyncClient(auth=self.auth) as client:
            r = await client.get(f"{self.base}/tickets", params={"per_page": 1})
            return r.status_code == 200

    async def iter_tickets(self):
        # TODO: paginate all tickets with includes=requester,company,stats
        yield  # type: ignore[misc]

    async def iter_contacts(self):
        yield  # type: ignore[misc]

"""Interface shared by the live and mock Falcon backends."""

from datetime import datetime
from typing import Any, Protocol


class FalconAPIError(Exception):
    """A Falcon API call returned a non-success status."""

    def __init__(self, operation: str, status_code: int | None, errors: Any = None):
        self.operation = operation
        self.status_code = status_code
        self.errors = errors
        super().__init__(f"Falcon {operation} failed (HTTP {status_code}): {errors}")


class FalconConfigError(Exception):
    """Falcon is not configured correctly (e.g. missing credentials)."""


class FalconBackend(Protocol):
    mode: str  # "live" | "mock"

    def check_auth(self) -> dict[str, Any]:
        """Verify credentials. Returns {"ok": bool, "mode": str, ...}."""
        ...

    def fetch_alerts(self, since: datetime, limit: int) -> list[dict[str, Any]]:
        """Return raw Alerts API v2 entities created at/after `since`, oldest first."""
        ...

    def fetch_incidents(self, since: datetime, limit: int) -> list[dict[str, Any]]:
        """Return raw incident entities modified at/after `since`, oldest first."""
        ...

    def get_hosts(self, device_ids: list[str]) -> list[dict[str, Any]]:
        """Return raw host (device) details."""
        ...


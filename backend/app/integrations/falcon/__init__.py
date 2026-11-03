"""CrowdStrike Falcon integration (live via FalconPy, or mock)."""

from functools import lru_cache

from app.config import get_settings
from app.integrations.falcon.base import FalconAPIError, FalconBackend, FalconConfigError


@lru_cache
def get_falcon() -> FalconBackend:
    """Return the process-wide Falcon backend (mock or live, based on settings)."""
    settings = get_settings()
    if settings.falcon_mock:
        from app.integrations.falcon.mock import MockFalconClient

        return MockFalconClient()

    if not settings.falcon_configured:
        raise FalconConfigError(
            "FALCON_MOCK=false but FALCON_CLIENT_ID / FALCON_CLIENT_SECRET are not set in .env"
        )
    from app.integrations.falcon.client import FalconClient

    return FalconClient(settings)


__all__ = ["FalconAPIError", "FalconBackend", "FalconConfigError", "get_falcon"]


from typing import Any

from fastapi import APIRouter

from app.integrations.falcon import get_falcon

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/falcon")
def falcon_health() -> dict[str, Any]:
    """Verify CrowdStrike credentials by requesting an OAuth2 token."""
    try:
        return get_falcon().check_auth()
    except Exception as exc:
        return {"ok": False, "mode": "unknown", "errors": str(exc)}


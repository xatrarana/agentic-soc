"""Settings and Falcon connection diagnostic API."""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, SecretStr
from sqlalchemy.orm import Session

from app import audit
from app.config import get_settings
from app.db.session import get_db
from app.integrations.falcon import get_falcon
from app.integrations.falcon.client import FalconClient

router = APIRouter(prefix="/api/settings", tags=["settings"])


class FalconConfigIn(BaseModel):
    client_id: str
    client_secret: str
    base_url: str = "https://api.us-2.crowdstrike.com"
    falcon_mock: bool = False


class ScopeCheckResult(BaseModel):
    name: str
    scope_required: str
    status: str  # "ok" | "failed" | "unsupported"
    message: str


class DiagnosticResponse(BaseModel):
    connected: bool
    mode: str
    base_url: str
    client_id_masked: str
    scopes: list[ScopeCheckResult]


def _mask_id(client_id: str) -> str:
    if not client_id or len(client_id) < 8:
        return "Not configured"
    return f"{client_id[:4]}...{client_id[-4:]}"


@router.get("/falcon")
def get_falcon_settings() -> dict[str, Any]:
    """Retrieve current Falcon configuration status (secrets are masked)."""
    settings = get_settings()
    return {
        "configured": settings.falcon_configured,
        "mode": "mock" if settings.falcon_mock else "live",
        "client_id_masked": _mask_id(settings.falcon_client_id),
        "base_url": settings.falcon_base_url or settings.falcon_cloud,
        "anthropic_configured": bool(settings.anthropic_api_key.get_secret_value()),
        "anthropic_model": settings.anthropic_model,
    }


@router.post("/falcon")
def update_falcon_settings(
    body: FalconConfigIn,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Update runtime Falcon API credentials and reinitialize client without restart."""
    settings = get_settings()

    # Update in-memory settings
    settings.falcon_client_id = body.client_id.strip()
    settings.falcon_client_secret = SecretStr(body.client_secret.strip())
    settings.falcon_base_url = body.base_url.strip()
    settings.falcon_mock = body.falcon_mock

    # Clear cached Falcon client
    get_falcon.cache_clear()

    # Test the new client
    try:
        new_client = get_falcon()
        auth = new_client.check_auth()
    except Exception as exc:
        raise HTTPException(400, f"Failed initializing Falcon client: {exc}")

    audit.record(
        db,
        actor="admin",
        event="settings.falcon_updated",
        target_type="system",
        target_id="falcon_api",
        details={"base_url": body.base_url, "mock": body.falcon_mock},
    )
    db.commit()

    return {
        "status": "updated",
        "ok": auth.get("ok", False),
        "mode": new_client.mode,
        "base_url": body.base_url,
    }


@router.post("/falcon/test", response_model=DiagnosticResponse)
def test_falcon_connection() -> DiagnosticResponse:
    """Run an end-to-end diagnostic probe testing OAuth2 and individual API scopes."""
    settings = get_settings()

    if settings.falcon_mock:
        return DiagnosticResponse(
            connected=True,
            mode="mock",
            base_url="mock://crowdstrike-falcon",
            client_id_masked="MOCK-TENANT-ACTIVE",
            scopes=[
                ScopeCheckResult(
                    name="OAuth2 Authentication",
                    scope_required="Client Credentials",
                    status="ok",
                    message="Mock authentication active. Simulating CrowdStrike US-2 cloud.",
                ),
                ScopeCheckResult(
                    name="Alerts API v2",
                    scope_required="Alerts: Read",
                    status="ok",
                    message="Mock alert feed active with sample MITRE scenarios.",
                ),
                ScopeCheckResult(
                    name="Endpoint Isolation",
                    scope_required="Hosts: Read/Write",
                    status="ok",
                    message="Mock host containment supported.",
                ),
                ScopeCheckResult(
                    name="Threat Intelligence",
                    scope_required="Falcon Intelligence: Read",
                    status="ok",
                    message="Mock threat intelligence database available.",
                ),
            ],
        )

    if not settings.falcon_configured:
        return DiagnosticResponse(
            connected=False,
            mode="live",
            base_url=settings.falcon_base_url or settings.falcon_cloud,
            client_id_masked="Not configured",
            scopes=[
                ScopeCheckResult(
                    name="OAuth2 Authentication",
                    scope_required="API Client & Secret",
                    status="failed",
                    message="Client ID or Secret is not configured.",
                )
            ],
        )

    client = get_falcon()
    if not isinstance(client, FalconClient):
        client = FalconClient(settings)

    scopes: list[ScopeCheckResult] = []

    # 1. Test OAuth2 Authentication
    try:
        auth = client.check_auth()
        if auth.get("ok"):
            scopes.append(
                ScopeCheckResult(
                    name="OAuth2 Authentication",
                    scope_required="Client Credentials",
                    status="ok",
                    message=f"Successfully authenticated against {client.check_auth().get('base_url')}.",
                )
            )
        else:
            scopes.append(
                ScopeCheckResult(
                    name="OAuth2 Authentication",
                    scope_required="Client Credentials",
                    status="failed",
                    message=f"Authentication rejected (HTTP {auth.get('status_code')}). Check Client ID, Secret, and Base URL.",
                )
            )
            return DiagnosticResponse(
                connected=False,
                mode="live",
                base_url=settings.falcon_base_url or settings.falcon_cloud,
                client_id_masked=_mask_id(settings.falcon_client_id),
                scopes=scopes,
            )
    except Exception as exc:
        scopes.append(
            ScopeCheckResult(
                name="OAuth2 Authentication",
                scope_required="Client Credentials",
                status="failed",
                message=f"Connection error: {exc}",
            )
        )
        return DiagnosticResponse(
            connected=False,
            mode="live",
            base_url=settings.falcon_base_url or settings.falcon_cloud,
            client_id_masked=_mask_id(settings.falcon_client_id),
            scopes=scopes,
        )

    # 2. Test Alerts API
    try:
        r = client.alerts.query_alerts_v2(limit=1)
        status_code = r.get("status_code", 500)
        if 200 <= status_code < 300:
            scopes.append(
                ScopeCheckResult(
                    name="Alerts API v2",
                    scope_required="Alerts: Read",
                    status="ok",
                    message="Access granted. Real-time endpoint detections can be queried.",
                )
            )
        elif status_code == 403:
            scopes.append(
                ScopeCheckResult(
                    name="Alerts API v2",
                    scope_required="Alerts: Read",
                    status="failed",
                    message="Permission denied (HTTP 403). Check the 'Alerts: Read' checkbox in CrowdStrike Falcon Console.",
                )
            )
        else:
            scopes.append(
                ScopeCheckResult(
                    name="Alerts API v2",
                    scope_required="Alerts: Read",
                    status="failed",
                    message=f"Returned HTTP {status_code}: {r.get('body', {}).get('errors')}",
                )
            )
    except Exception as exc:
        scopes.append(
            ScopeCheckResult(
                name="Alerts API v2",
                scope_required="Alerts: Read",
                status="failed",
                message=str(exc),
            )
        )

    # 3. Test Hosts API
    try:
        r = client.hosts.query_devices_by_filter(limit=1)
        status_code = r.get("status_code", 500)
        if 200 <= status_code < 300:
            scopes.append(
                ScopeCheckResult(
                    name="Endpoints & Hosts",
                    scope_required="Hosts: Read",
                    status="ok",
                    message="Access granted. Endpoint telemetry and containment controls available.",
                )
            )
        elif status_code == 403:
            scopes.append(
                ScopeCheckResult(
                    name="Endpoints & Hosts",
                    scope_required="Hosts: Read",
                    status="failed",
                    message="Permission denied (HTTP 403). Enable 'Hosts: Read' and 'Hosts: Write' in Falcon Console.",
                )
            )
        else:
            scopes.append(
                ScopeCheckResult(
                    name="Endpoints & Hosts",
                    scope_required="Hosts: Read",
                    status="failed",
                    message=f"Returned HTTP {status_code}",
                )
            )
    except Exception as exc:
        scopes.append(
            ScopeCheckResult(
                name="Endpoints & Hosts",
                scope_required="Hosts: Read",
                status="failed",
                message=str(exc),
            )
        )

    # 4. Test Falcon Intelligence API
    try:
        r = client.intel.query_indicator_entities(parameters={"limit": 1})
        status_code = r.get("status_code", 500)
        if 200 <= status_code < 300:
            scopes.append(
                ScopeCheckResult(
                    name="Falcon Intelligence",
                    scope_required="Falcon Intelligence: Read",
                    status="ok",
                    message="Access granted. Threat actor and indicator reputation lookups active.",
                )
            )
        elif status_code == 403:
            scopes.append(
                ScopeCheckResult(
                    name="Falcon Intelligence",
                    scope_required="Falcon Intelligence: Read",
                    status="failed",
                    message="Optional permission denied (HTTP 403). Enable 'Falcon Intelligence: Read' to enrich alerts with threat actor attribution.",
                )
            )
        else:
            scopes.append(
                ScopeCheckResult(
                    name="Falcon Intelligence",
                    scope_required="Falcon Intelligence: Read",
                    status="unsupported",
                    message=f"Returned HTTP {status_code} (Intel may not be subscribed on this CID).",
                )
            )
    except Exception as exc:
        scopes.append(
            ScopeCheckResult(
                name="Falcon Intelligence",
                scope_required="Falcon Intelligence: Read",
                status="failed",
                message=str(exc),
            )
        )

    connected = any(s.status == "ok" for s in scopes if s.name == "Alerts API v2")

    return DiagnosticResponse(
        connected=connected,
        mode="live",
        base_url=settings.falcon_base_url or settings.falcon_cloud,
        client_id_masked=_mask_id(settings.falcon_client_id),
        scopes=scopes,
    )

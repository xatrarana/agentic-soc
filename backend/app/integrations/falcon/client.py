"""Live CrowdStrike Falcon backend built on FalconPy."""

from collections.abc import Iterator
from datetime import datetime
from typing import Any

from falconpy import OAuth2, Alerts, Hosts, Incidents

from app.config import Settings
from app.integrations.falcon.base import FalconAPIError
from app.timeutil import to_fql

ALERT_DETAIL_CHUNK = 500  # get_alerts_v2 accepts up to 1000 composite IDs
INCIDENT_DETAIL_CHUNK = 500
HOST_DETAIL_CHUNK = 100


def _chunks(items: list[str], size: int) -> Iterator[list[str]]:
    for i in range(0, len(items), size):
        yield items[i : i + size]


def _check(resp: dict[str, Any], operation: str) -> dict[str, Any]:
    """Raise FalconAPIError unless the FalconPy response is a 2xx; return the body."""
    status = resp.get("status_code")
    body = resp.get("body") or {}
    if status is None or not (200 <= status < 300):
        raise FalconAPIError(operation, status, body.get("errors"))
    return body


class FalconClient:
    mode = "live"

    def __init__(self, settings: Settings):
        kwargs: dict[str, Any] = {
            "client_id": settings.falcon_client_id,
            "client_secret": settings.falcon_client_secret.get_secret_value(),
            "base_url": settings.falcon_cloud,
        }
        if settings.falcon_member_cid:
            kwargs["member_cid"] = settings.falcon_member_cid
        # One shared OAuth2 token for all service classes (auto-refreshes).
        self._auth = OAuth2(**kwargs)
        self.alerts = Alerts(auth_object=self._auth)
        self.incidents = Incidents(auth_object=self._auth)
        self.hosts = Hosts(auth_object=self._auth)

    # ------------------------------------------------------------------ auth
    def check_auth(self) -> dict[str, Any]:
        resp = self._auth.token()
        status = resp.get("status_code")
        ok = status == 201
        result: dict[str, Any] = {
            "ok": ok,
            "mode": self.mode,
            "status_code": status,
            "base_url": getattr(self._auth, "base_url", None),
        }
        if not ok:
            result["errors"] = (resp.get("body") or {}).get("errors")
        return result

    # ---------------------------------------------------------------- alerts
    def fetch_alerts(self, since: datetime, limit: int) -> list[dict[str, Any]]:
        body = _check(
            self.alerts.query_alerts_v2(
                filter=f"created_timestamp:>='{to_fql(since)}'",
                sort="created_timestamp.asc",
                limit=limit,
            ),
            "query_alerts_v2",
        )
        ids: list[str] = body.get("resources") or []
        results: list[dict[str, Any]] = []
        for chunk in _chunks(ids, ALERT_DETAIL_CHUNK):
            detail = _check(self.alerts.get_alerts_v2(composite_ids=chunk), "get_alerts_v2")
            results.extend(detail.get("resources") or [])
        return results

    # ------------------------------------------------------------- incidents
    def fetch_incidents(self, since: datetime, limit: int) -> list[dict[str, Any]]:
        body = _check(
            self.incidents.query_incidents(
                filter=f"modified_timestamp:>='{to_fql(since)}'",
                sort="modified_timestamp.asc",
                limit=min(limit, 500),
            ),
            "query_incidents",
        )
        ids: list[str] = body.get("resources") or []
        results: list[dict[str, Any]] = []
        for chunk in _chunks(ids, INCIDENT_DETAIL_CHUNK):
            detail = _check(self.incidents.get_incidents(ids=chunk), "get_incidents")
            results.extend(detail.get("resources") or [])
        return results

    # ----------------------------------------------------------------- hosts
    def get_hosts(self, device_ids: list[str]) -> list[dict[str, Any]]:
        results: list[dict[str, Any]] = []
        for chunk in _chunks(device_ids, HOST_DETAIL_CHUNK):
            detail = _check(self.hosts.get_device_details(ids=chunk), "get_device_details")
            results.extend(detail.get("resources") or [])
        return results


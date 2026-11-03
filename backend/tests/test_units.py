from datetime import datetime, timezone

import pytest

from app.config import Settings
from app.ingestion.normalize import normalize_alert, normalize_incident
from app.integrations.falcon.base import FalconAPIError
from app.integrations.falcon.client import FalconClient, _check
from app.timeutil import parse_ts


def test_parse_ts_handles_nanoseconds_and_z():
    dt = parse_ts("2024-05-01T12:34:56.123456789Z")
    assert dt == datetime(2024, 5, 1, 12, 34, 56, 123456, tzinfo=timezone.utc)
    assert parse_ts("garbage") is None
    assert parse_ts(None) is None


def test_normalize_alert_maps_fields():
    raw = {
        "composite_id": "cid:ind:dev:agg",
        "display_name": "EncodedPowerShell",
        "severity": 70,
        "tactic": "Execution",
        "technique_id": "T1059.001",
        "device": {"device_id": "dev", "hostname": "WS-1", "platform_name": "Windows"},
        "created_timestamp": "2024-05-01T00:00:00Z",
        "sha256": "a" * 64,
    }
    out = normalize_alert(raw)
    assert out["falcon_id"] == "cid:ind:dev:agg"
    assert out["severity_name"] == "High"
    assert out["hostname"] == "WS-1"
    assert out["falcon_created_at"].year == 2024
    assert out["raw"] is raw


def test_normalize_incident_status_names():
    out = normalize_incident({"incident_id": "inc:1", "status": 30, "hosts": [{"hostname": "h", "device_id": "d"}]})
    assert out["falcon_status"] == "In Progress"
    assert out["hostnames"] == ["h"] and out["device_ids"] == ["d"]


def test_check_raises_on_error():
    with pytest.raises(FalconAPIError) as exc:
        _check({"status_code": 403, "body": {"errors": [{"message": "access denied"}]}}, "query_alerts_v2")
    assert exc.value.status_code == 403
    assert _check({"status_code": 200, "body": {"resources": []}}, "x") == {"resources": []}


class _StubAlerts:
    def __init__(self, ids):
        self.ids = ids
        self.query_kwargs = None
        self.detail_calls = []

    def query_alerts_v2(self, **kwargs):
        self.query_kwargs = kwargs
        return {"status_code": 200, "body": {"resources": self.ids}}

    def get_alerts_v2(self, composite_ids):
        self.detail_calls.append(list(composite_ids))
        return {"status_code": 200, "body": {"resources": [{"composite_id": i} for i in composite_ids]}}


def test_live_client_fetch_alerts_builds_filter_and_chunks():
    client = FalconClient.__new__(FalconClient)  # skip real OAuth2 setup
    client.alerts = _StubAlerts([f"id{i}" for i in range(1200)])

    out = client.fetch_alerts(datetime(2024, 1, 2, 3, 4, 5, tzinfo=timezone.utc), limit=5000)

    assert client.alerts.query_kwargs["filter"] == "created_timestamp:>='2024-01-02T03:04:05Z'"
    assert client.alerts.query_kwargs["sort"] == "created_timestamp.asc"
    assert [len(c) for c in client.alerts.detail_calls] == [500, 500, 200]
    assert len(out) == 1200


def test_settings_falcon_configured():
    assert not Settings(falcon_client_id="", _env_file=None).falcon_configured
    assert Settings(falcon_client_id="x", falcon_client_secret="y", _env_file=None).falcon_configured


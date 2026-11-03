"""Convert raw Falcon payloads into AISOC model fields."""

from typing import Any

from app.timeutil import parse_ts

INCIDENT_STATUS = {20: "New", 25: "Reopened", 30: "In Progress", 40: "Closed"}


def severity_name(sev: int) -> str:
    if sev >= 90:
        return "Critical"
    if sev >= 70:
        return "High"
    if sev >= 50:
        return "Medium"
    if sev >= 20:
        return "Low"
    return "Informational"


def _int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _trunc(value: Any, length: int) -> str | None:
    if value is None or value == "":
        return None
    return str(value)[:length]


def normalize_alert(raw: dict[str, Any]) -> dict[str, Any]:
    device = raw.get("device") or {}
    sev = _int(raw.get("severity"))
    created = parse_ts(raw.get("created_timestamp") or raw.get("timestamp"))
    return {
        "falcon_id": raw.get("composite_id") or raw.get("id") or "",
        "title": _trunc(raw.get("display_name") or raw.get("name") or "Untitled alert", 512) or "",
        "description": raw.get("description"),
        "severity": sev,
        "severity_name": raw.get("severity_name") or severity_name(sev),
        "falcon_status": _trunc(raw.get("status"), 64),
        "product": _trunc(raw.get("product"), 64),
        "tactic": _trunc(raw.get("tactic"), 128),
        "tactic_id": _trunc(raw.get("tactic_id"), 32),
        "technique": _trunc(raw.get("technique"), 256),
        "technique_id": _trunc(raw.get("technique_id"), 32),
        "device_id": _trunc(device.get("device_id") or raw.get("agent_id"), 64),
        "hostname": _trunc(device.get("hostname"), 256),
        "platform": _trunc(device.get("platform_name"), 64),
        "local_ip": _trunc(device.get("local_ip"), 64),
        "external_ip": _trunc(device.get("external_ip"), 64),
        "user_name": _trunc(raw.get("user_name"), 256),
        "filename": _trunc(raw.get("filename"), 512),
        "cmdline": raw.get("cmdline"),
        "sha256": _trunc(raw.get("sha256"), 64),
        "falcon_created_at": created,
        "raw": raw,
    }


def normalize_incident(raw: dict[str, Any]) -> dict[str, Any]:
    hosts = raw.get("hosts") or []
    status_code = _int(raw.get("status"), -1)
    return {
        "falcon_id": raw.get("incident_id") or "",
        "name": _trunc(raw.get("name") or raw.get("incident_id") or "Incident", 512) or "",
        "description": raw.get("description"),
        "fine_score": _int(raw.get("fine_score")),
        "falcon_status": INCIDENT_STATUS.get(status_code, str(raw.get("status")) if raw.get("status") is not None else None),
        "state": _trunc(raw.get("state"), 32),
        "hostnames": [h.get("hostname") for h in hosts if h.get("hostname")],
        "device_ids": [h.get("device_id") for h in hosts if h.get("device_id")],
        "tactics": list(raw.get("tactics") or []),
        "techniques": list(raw.get("techniques") or []),
        "start": parse_ts(raw.get("start")),
        "end": parse_ts(raw.get("end")),
        "modified_at": parse_ts(raw.get("modified_timestamp")),
        "raw": raw,
    }


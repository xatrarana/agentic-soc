"""Read-only investigation tools exposed to the Claude AI triage agent."""

from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Alert
from app.integrations.falcon.base import FalconBackend

# Anthropic tool use schema definitions
TOOL_DEFINITIONS = [
    {
        "name": "get_host_details",
        "description": "Fetch detailed information about a host endpoint from CrowdStrike (OS, platform, status, network IPs, last seen).",
        "input_schema": {
            "type": "object",
            "properties": {
                "device_id": {
                    "type": "string",
                    "description": "CrowdStrike Agent ID (AID) or device ID of the host.",
                }
            },
            "required": ["device_id"],
        },
    },
    {
        "name": "lookup_threat_intel",
        "description": "Query Falcon Threat Intelligence for reputation and threat attribution of a file hash, domain, or IP address.",
        "input_schema": {
            "type": "object",
            "properties": {
                "indicator": {
                    "type": "string",
                    "description": "The indicator value (e.g., SHA256 hex string, IPv4/IPv6 address, or domain name).",
                },
                "indicator_type": {
                    "type": "string",
                    "enum": ["sha256", "ip_address", "domain"],
                    "description": "The type of indicator being evaluated.",
                },
            },
            "required": ["indicator"],
        },
    },
    {
        "name": "get_recent_alerts_for_host",
        "description": "Retrieve recent historical alerts on the specified host to analyze multi-stage attack patterns or lateral movement.",
        "input_schema": {
            "type": "object",
            "properties": {
                "device_id": {
                    "type": "string",
                    "description": "CrowdStrike Agent ID (AID) to check historical alerts for.",
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of recent alerts to return (default 5, max 20).",
                    "default": 5,
                },
            },
            "required": ["device_id"],
        },
    },
]


def execute_tool(
    tool_name: str,
    tool_inputs: dict[str, Any],
    db: Session,
    falcon: FalconBackend,
) -> dict[str, Any]:
    """Execute a read-only investigation tool and return structured results."""
    try:
        if tool_name == "get_host_details":
            device_id = tool_inputs.get("device_id")
            if not device_id:
                return {"error": "device_id is required"}
            hosts = falcon.get_hosts([device_id])
            if hosts:
                return {"host": hosts[0]}
            return {"error": f"No host record found for device_id {device_id}"}

        elif tool_name == "lookup_threat_intel":
            indicator = tool_inputs.get("indicator")
            ind_type = tool_inputs.get("indicator_type", "sha256")
            if not indicator:
                return {"error": "indicator is required"}
            return falcon.lookup_indicator(indicator, ind_type)

        elif tool_name == "get_recent_alerts_for_host":
            device_id = tool_inputs.get("device_id")
            limit = min(int(tool_inputs.get("limit", 5)), 20)
            if not device_id:
                return {"error": "device_id is required"}
            alerts = db.scalars(
                select(Alert)
                .where(Alert.device_id == device_id)
                .order_by(Alert.falcon_created_at.desc())
                .limit(limit)
            ).all()
            return {
                "recent_alerts": [
                    {
                        "id": a.id,
                        "title": a.title,
                        "severity": a.severity,
                        "status": a.status,
                        "technique": a.technique,
                        "created_at": a.falcon_created_at.isoformat() if a.falcon_created_at else None,
                    }
                    for a in alerts
                ]
            }

        return {"error": f"Unknown tool: {tool_name}"}

    except Exception as exc:
        return {"error": f"Failed executing {tool_name}: {exc}"}

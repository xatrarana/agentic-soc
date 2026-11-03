"""API response / request schemas."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict

AlertStatus = Literal["new", "triaging", "triaged", "in_progress", "closed", "false_positive"]


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    falcon_id: str
    title: str
    description: str | None
    severity: int
    severity_name: str
    status: str
    falcon_status: str | None
    product: str | None
    tactic: str | None
    tactic_id: str | None
    technique: str | None
    technique_id: str | None
    device_id: str | None
    hostname: str | None
    platform: str | None
    local_ip: str | None
    external_ip: str | None
    user_name: str | None
    filename: str | None
    cmdline: str | None
    sha256: str | None
    falcon_created_at: datetime | None
    ingested_at: datetime
    ai_verdict: str | None
    ai_confidence: float | None
    ai_summary: str | None
    case_id: int | None


class AlertDetail(AlertOut):
    raw: dict[str, Any]


class AlertPage(BaseModel):
    items: list[AlertOut]
    total: int


class AlertUpdate(BaseModel):
    status: AlertStatus


class IncidentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    falcon_id: str
    name: str
    description: str | None
    fine_score: int
    falcon_status: str | None
    state: str | None
    hostnames: list[str]
    device_ids: list[str]
    tactics: list[str]
    techniques: list[str]
    start: datetime | None
    end: datetime | None
    modified_at: datetime | None
    ingested_at: datetime


class IncidentPage(BaseModel):
    items: list[IncidentOut]
    total: int


class CheckpointOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    source: str
    last_timestamp: datetime | None
    last_run_at: datetime | None
    last_fetched: int
    last_new: int
    last_error: str | None


class AuditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ts: datetime
    actor: str
    event: str
    target_type: str | None
    target_id: str | None
    details: dict[str, Any]


class CountItem(BaseModel):
    key: str
    count: int


class ActionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: int | None
    alert_id: int | None
    action_type: str
    params: dict[str, Any]
    risk_tier: str
    status: str
    reason: str | None
    proposed_by: str
    decided_by: str | None
    created_at: datetime
    decided_at: datetime | None
    executed_at: datetime | None
    error: str | None


class ActionDecision(BaseModel):
    decision: Literal["approved", "rejected"]
    decided_by: str = "analyst"
    comment: str | None = None


class CaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    status: str
    severity: int
    verdict: str | None
    confidence: float | None
    summary: str | None
    created_at: datetime
    updated_at: datetime
    alerts: list[AlertOut] = []
    actions: list[ActionOut] = []


class CitationItem(BaseModel):
    alert_id: int
    title: str
    severity: int
    hostname: str | None


class BriefingResponse(BaseModel):
    threat_level: str
    threat_score: int
    time_window: str
    source_summary: str
    executive_summary: str
    key_findings: list[str]
    citations: list[CitationItem]
    endpoints_at_risk: list[str]
    recommended_focus: str


class Stats(BaseModel):
    total_alerts: int
    open_alerts: int
    total_incidents: int
    by_severity: list[CountItem]
    by_status: list[CountItem]
    top_hosts: list[CountItem]
    top_techniques: list[CountItem]


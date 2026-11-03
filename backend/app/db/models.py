"""SQLAlchemy ORM models."""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class Case(Base):
    """A case groups related alerts/incidents for investigation (filled by AI triage in Phase 3)."""

    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(512))
    status: Mapped[str] = mapped_column(String(32), default="open", index=True)
    severity: Mapped[int] = mapped_column(Integer, default=0)
    verdict: Mapped[str | None] = mapped_column(String(32))  # true_positive | false_positive | needs_review
    confidence: Mapped[float | None] = mapped_column(Float)
    summary: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    alerts: Mapped[list["Alert"]] = relationship(back_populates="case")
    actions: Mapped[list["Action"]] = relationship(back_populates="case")


class Alert(Base):
    """A normalized CrowdStrike Falcon alert (Alerts API v2)."""

    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True)
    falcon_id: Mapped[str] = mapped_column(String(512), unique=True, index=True)

    title: Mapped[str] = mapped_column(String(512), default="")
    description: Mapped[str | None] = mapped_column(Text)
    severity: Mapped[int] = mapped_column(Integer, default=0, index=True)  # Falcon 0-100
    severity_name: Mapped[str] = mapped_column(String(32), default="Informational")
    status: Mapped[str] = mapped_column(String(32), default="new", index=True)  # AISOC workflow status
    falcon_status: Mapped[str | None] = mapped_column(String(64))
    product: Mapped[str | None] = mapped_column(String(64))

    tactic: Mapped[str | None] = mapped_column(String(128))
    tactic_id: Mapped[str | None] = mapped_column(String(32))
    technique: Mapped[str | None] = mapped_column(String(256))
    technique_id: Mapped[str | None] = mapped_column(String(32))

    device_id: Mapped[str | None] = mapped_column(String(64), index=True)
    hostname: Mapped[str | None] = mapped_column(String(256), index=True)
    platform: Mapped[str | None] = mapped_column(String(64))
    local_ip: Mapped[str | None] = mapped_column(String(64))
    external_ip: Mapped[str | None] = mapped_column(String(64))
    user_name: Mapped[str | None] = mapped_column(String(256))

    filename: Mapped[str | None] = mapped_column(String(512))
    cmdline: Mapped[str | None] = mapped_column(Text)
    sha256: Mapped[str | None] = mapped_column(String(64), index=True)

    falcon_created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    raw: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    # AI triage output (Phase 3)
    ai_verdict: Mapped[str | None] = mapped_column(String(32))
    ai_confidence: Mapped[float | None] = mapped_column(Float)
    ai_summary: Mapped[str | None] = mapped_column(Text)

    case_id: Mapped[int | None] = mapped_column(ForeignKey("cases.id"), index=True)
    case: Mapped[Case | None] = relationship(back_populates="alerts")


class Incident(Base):
    """A CrowdStrike Falcon incident."""

    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(primary_key=True)
    falcon_id: Mapped[str] = mapped_column(String(256), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(512), default="")
    description: Mapped[str | None] = mapped_column(Text)
    fine_score: Mapped[int] = mapped_column(Integer, default=0)  # Falcon 0-100 (displayed as /10)
    falcon_status: Mapped[str | None] = mapped_column(String(32))
    state: Mapped[str | None] = mapped_column(String(32))
    hostnames: Mapped[list[str]] = mapped_column(JSON, default=list)
    device_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    tactics: Mapped[list[str]] = mapped_column(JSON, default=list)
    techniques: Mapped[list[str]] = mapped_column(JSON, default=list)
    start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    modified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    raw: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class Action(Base):
    """A SOAR response action — proposed, approved/rejected, executed (Phase 4)."""

    __tablename__ = "actions"

    id: Mapped[int] = mapped_column(primary_key=True)
    case_id: Mapped[int | None] = mapped_column(ForeignKey("cases.id"), index=True)
    alert_id: Mapped[int | None] = mapped_column(ForeignKey("alerts.id"), index=True)
    action_type: Mapped[str] = mapped_column(String(64))
    params: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    risk_tier: Mapped[str] = mapped_column(String(16), default="safe")  # safe | destructive | undo
    status: Mapped[str] = mapped_column(String(32), default="pending_approval", index=True)
    reason: Mapped[str | None] = mapped_column(Text)
    proposed_by: Mapped[str] = mapped_column(String(128), default="system")
    decided_by: Mapped[str | None] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    executed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    result: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    error: Mapped[str | None] = mapped_column(Text)

    case: Mapped[Case | None] = relationship(back_populates="actions")


class AuditLog(Base):
    """Append-only audit trail of every state change and response action."""

    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    actor: Mapped[str] = mapped_column(String(128))
    event: Mapped[str] = mapped_column(String(128), index=True)
    target_type: Mapped[str | None] = mapped_column(String(64))
    target_id: Mapped[str | None] = mapped_column(String(256))
    details: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class IngestCheckpoint(Base):
    """Tracks the high-water mark for each ingestion source."""

    __tablename__ = "ingest_checkpoints"

    source: Mapped[str] = mapped_column(String(64), primary_key=True)
    last_timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_fetched: Mapped[int] = mapped_column(Integer, default=0)
    last_new: Mapped[int] = mapped_column(Integer, default=0)
    last_error: Mapped[str | None] = mapped_column(Text)


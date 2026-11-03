"""Audit trail helper. Every state change / response action should go through `record`."""

from typing import Any

from sqlalchemy.orm import Session

from app.db.models import AuditLog


def record(
    db: Session,
    actor: str,
    event: str,
    target_type: str | None = None,
    target_id: str | int | None = None,
    details: dict[str, Any] | None = None,
) -> AuditLog:
    entry = AuditLog(
        actor=actor,
        event=event,
        target_type=target_type,
        target_id=str(target_id) if target_id is not None else None,
        details=details or {},
    )
    db.add(entry)
    return entry


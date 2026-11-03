from typing import Any

from fastapi import APIRouter, Depends, Query
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Alert, AuditLog, Incident, IngestCheckpoint
from app.db.session import get_db
from app.ingestion.normalize import severity_name
from app.ingestion.service import run_ingestion_cycle
from app.schemas import AuditOut, CheckpointOut, CountItem, Stats

router = APIRouter(prefix="/api", tags=["ops"])

SEVERITY_ORDER = ["Critical", "High", "Medium", "Low", "Informational"]


@router.post("/ingest/run")
async def run_ingest_now() -> dict[str, Any]:
    """Trigger an immediate ingestion pass."""
    return await run_in_threadpool(run_ingestion_cycle)


@router.get("/ingest/status", response_model=list[CheckpointOut])
def ingest_status(db: Session = Depends(get_db)) -> list[IngestCheckpoint]:
    return list(db.scalars(select(IngestCheckpoint).order_by(IngestCheckpoint.source)).all())


@router.get("/audit", response_model=list[AuditOut])
def audit_log(limit: int = Query(100, ge=1, le=1000), db: Session = Depends(get_db)) -> list[AuditLog]:
    return list(db.scalars(select(AuditLog).order_by(AuditLog.id.desc()).limit(limit)).all())


@router.get("/stats", response_model=Stats)
def stats(db: Session = Depends(get_db)) -> Stats:
    total = db.scalar(select(func.count(Alert.id))) or 0
    open_ = db.scalar(
        select(func.count(Alert.id)).where(Alert.status.not_in(["closed", "false_positive"]))
    ) or 0
    incidents = db.scalar(select(func.count(Incident.id))) or 0

    sev_counts: dict[str, int] = dict.fromkeys(SEVERITY_ORDER, 0)
    for sev, count in db.execute(select(Alert.severity, func.count()).group_by(Alert.severity)):
        sev_counts[severity_name(sev)] += count

    by_status = [
        CountItem(key=s, count=c)
        for s, c in db.execute(select(Alert.status, func.count()).group_by(Alert.status).order_by(func.count().desc()))
    ]
    top_hosts = [
        CountItem(key=h, count=c)
        for h, c in db.execute(
            select(Alert.hostname, func.count()).where(Alert.hostname.is_not(None))
            .group_by(Alert.hostname).order_by(func.count().desc()).limit(5)
        )
    ]
    top_techniques = [
        CountItem(key=f"{tid} {t}" if tid else t, count=c)
        for tid, t, c in db.execute(
            select(Alert.technique_id, Alert.technique, func.count()).where(Alert.technique.is_not(None))
            .group_by(Alert.technique_id, Alert.technique).order_by(func.count().desc()).limit(5)
        )
    ]
    return Stats(
        total_alerts=total,
        open_alerts=open_,
        total_incidents=incidents,
        by_severity=[CountItem(key=k, count=v) for k, v in sev_counts.items()],
        by_status=by_status,
        top_hosts=top_hosts,
        top_techniques=top_techniques,
    )


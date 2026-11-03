from typing import Any

from fastapi import APIRouter, Depends, Query
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Action, Alert, AuditLog, Case, Incident, IngestCheckpoint
from app.db.session import get_db
from app.ingestion.normalize import severity_name
from app.ingestion.service import run_ingestion_cycle
from app.schemas import AuditOut, BriefingResponse, CheckpointOut, CitationItem, CountItem, Stats

router = APIRouter(prefix="/api", tags=["ops"])

SEVERITY_ORDER = ["Critical", "High", "Medium", "Low", "Informational"]


@router.post("/ingest/run")
async def run_ingest_now() -> dict[str, Any]:
    """Trigger an immediate ingestion pass."""
    return await run_in_threadpool(run_ingestion_cycle)


@router.post("/purge-data")
def purge_data(db: Session = Depends(get_db)) -> dict[str, str]:
    """Purge mock/historical data and reset checkpoints for clean live ingestion."""
    db.query(Action).delete()
    db.query(Alert).delete()
    db.query(Case).delete()
    db.query(Incident).delete()
    db.query(IngestCheckpoint).delete()
    db.commit()
    return {"status": "purged", "message": "All alerts, cases, and checkpoints cleared."}


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


@router.get("/briefing", response_model=BriefingResponse)
def security_briefing(db: Session = Depends(get_db)) -> BriefingResponse:
    """Generate an evidence-grounded AI security briefing synthesized from active alerts."""
    alerts = list(
        db.scalars(
            select(Alert)
            .where(Alert.status.not_in(["closed", "false_positive"]))
            .order_by(Alert.severity.desc(), Alert.falcon_created_at.desc())
            .limit(20)
        ).all()
    )

    if not alerts:
        return BriefingResponse(
            threat_level="Normal",
            threat_score=98,
            time_window="Last 24 Hours",
            source_summary="CrowdStrike Falcon (Live EDR & NG-SIEM)",
            executive_summary="Zero active unresolved detections in current lookback window. Platform posture normal.",
            key_findings=["No active adversary indicators detected across monitored fleet."],
            citations=[],
            endpoints_at_risk=[],
            recommended_focus="Maintain standard sensor health and continuous telemetry ingestion.",
        )

    critical_count = sum(1 for a in alerts if a.severity >= 90)
    high_count = sum(1 for a in alerts if 70 <= a.severity < 90)

    if critical_count >= 2:
        threat_level = "Elevated"
        score = max(40, 100 - (critical_count * 15 + high_count * 8))
    elif critical_count == 1 or high_count >= 2:
        threat_level = "Guarded"
        score = max(60, 100 - (critical_count * 12 + high_count * 6))
    else:
        threat_level = "Low"
        score = max(80, 100 - (len(alerts) * 3))

    citations = [
        CitationItem(
            alert_id=a.id,
            title=a.title,
            severity=a.severity,
            hostname=a.hostname,
        )
        for a in alerts[:6]
    ]

    endpoints = list({a.hostname for a in alerts if a.hostname})

    # Synthesize findings grounded in telemetry
    findings = []
    has_brute_force = any("brute force" in (a.title or "").lower() for a in alerts)
    has_ml_file = any("machine learning" in (a.title or "").lower() for a in alerts)

    if has_brute_force:
        findings.append(
            f"Next-Gen SIEM rules flagged active Brute Force authentication anomalies ({sum(1 for a in alerts if 'brute force' in (a.title or '').lower())} events)."
        )
    if has_ml_file:
        ml_alert = next(a for a in alerts if "machine learning" in (a.title or "").lower())
        findings.append(
            f"Sensor-side machine learning heuristic flagged suspicious file execution on endpoint {ml_alert.hostname or 'fleet device'}."
        )
    if not findings:
        findings.append(f"Observed {len(alerts)} active detections requiring analyst review across {len(endpoints) or 1} target entities.")

    summary = (
        f"Security posture is currently {threat_level} (Posture Score: {score}/100) based on {len(alerts)} "
        f"active telemetry detections retrieved from CrowdStrike Falcon. Primary observed activity involves "
        f"{'Next-Gen SIEM authentication anomalies and ' if has_brute_force else ''}"
        f"{'on-host machine learning detections' if has_ml_file else 'endpoint telemetry signals'}."
    )

    focus = (
        "Prioritize investigation of critical Brute Force rules to verify account compromise, "
        "and inspect ML-identified files on active endpoints."
        if has_brute_force
        else "Review highest severity detections and confirm host containment where appropriate."
    )

    return BriefingResponse(
        threat_level=threat_level,
        threat_score=score,
        time_window="Last 24 Hours",
        source_summary="CrowdStrike Falcon (US-2 Cloud & NG-SIEM)",
        executive_summary=summary,
        key_findings=findings,
        citations=citations,
        endpoints_at_risk=endpoints,
        recommended_focus=focus,
    )


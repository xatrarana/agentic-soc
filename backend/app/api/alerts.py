from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app import audit
from app.ai.agent import triage_alert
from app.db.models import Alert
from app.db.session import get_db
from app.integrations.falcon import get_falcon
from app.schemas import AlertDetail, AlertPage, AlertUpdate

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=AlertPage)
def list_alerts(
    status: str | None = None,
    min_severity: int = Query(0, ge=0, le=100),
    hostname: str | None = None,
    q: str | None = Query(None, description="Search title, host, file, technique, command line"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> AlertPage:
    stmt = select(Alert).where(Alert.severity >= min_severity)
    if status:
        stmt = stmt.where(Alert.status == status)
    if hostname:
        stmt = stmt.where(Alert.hostname == hostname)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(
            Alert.title.ilike(like), Alert.hostname.ilike(like), Alert.filename.ilike(like),
            Alert.technique.ilike(like), Alert.technique_id.ilike(like), Alert.cmdline.ilike(like),
            Alert.sha256.ilike(like),
        ))
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.order_by(Alert.falcon_created_at.desc(), Alert.id.desc()).limit(limit).offset(offset)
    ).all()
    return AlertPage(items=rows, total=total)


@router.get("/{alert_id}", response_model=AlertDetail)
def get_alert(alert_id: int, db: Session = Depends(get_db)) -> Alert:
    alert = db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(404, "Alert not found")
    return alert


@router.patch("/{alert_id}", response_model=AlertDetail)
def update_alert(alert_id: int, body: AlertUpdate, db: Session = Depends(get_db)) -> Alert:
    alert = db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(404, "Alert not found")
    old = alert.status
    alert.status = body.status
    # TODO(Phase 6): use the authenticated analyst identity instead of "analyst".
    audit.record(db, "analyst", "alert.status_changed", "alert", alert.id, {"from": old, "to": body.status})
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/{alert_id}/triage", response_model=AlertDetail)
def trigger_alert_triage(alert_id: int, db: Session = Depends(get_db)) -> Alert:
    alert = db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(404, "Alert not found")
    falcon = get_falcon()
    triage_alert(alert, db, falcon)
    return alert


@router.post("/triage-pending")
def triage_pending_alerts(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> dict[str, int]:
    """Batch-triage pending/new alerts."""
    alerts = db.scalars(
        select(Alert).where(Alert.status == "new").order_by(Alert.severity.desc()).limit(limit)
    ).all()
    falcon = get_falcon()
    count = 0
    for a in alerts:
        triage_alert(a, db, falcon)
        count += 1
    return {"triaged": count}


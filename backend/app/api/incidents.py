from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Incident
from app.db.session import get_db
from app.schemas import IncidentOut, IncidentPage

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


@router.get("", response_model=IncidentPage)
def list_incidents(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> IncidentPage:
    total = db.scalar(select(func.count(Incident.id))) or 0
    rows = db.scalars(
        select(Incident).order_by(Incident.modified_at.desc(), Incident.id.desc()).limit(limit).offset(offset)
    ).all()
    return IncidentPage(items=rows, total=total)


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: int, db: Session = Depends(get_db)) -> Incident:
    inc = db.get(Incident, incident_id)
    if inc is None:
        raise HTTPException(404, "Incident not found")
    return inc


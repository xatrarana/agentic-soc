"""Case management API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.db.models import Case
from app.db.session import get_db
from app.schemas import CaseOut

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.get("", response_model=list[CaseOut])
def list_cases(
    status: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> list[Case]:
    stmt = (
        select(Case)
        .options(selectinload(Case.alerts), selectinload(Case.actions))
        .order_by(Case.updated_at.desc())
    )
    if status:
        stmt = stmt.where(Case.status == status)
    return list(db.scalars(stmt.limit(limit).offset(offset)).all())


@router.get("/{case_id}", response_model=CaseOut)
def get_case(case_id: int, db: Session = Depends(get_db)) -> Case:
    stmt = (
        select(Case)
        .where(Case.id == case_id)
        .options(selectinload(Case.alerts), selectinload(Case.actions))
    )
    case = db.scalar(stmt)
    if case is None:
        raise HTTPException(404, "Case not found")
    return case


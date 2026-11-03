"""SOAR Action Approval Queue & Execution API."""

from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import audit
from app.db.models import Action
from app.db.session import get_db
from app.integrations.falcon import get_falcon
from app.schemas import ActionDecision, ActionOut

router = APIRouter(prefix="/api/actions", tags=["actions"])


@router.get("", response_model=list[ActionOut])
def list_actions(
    status: str | None = None,
    risk_tier: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[Action]:
    stmt = select(Action).order_by(Action.created_at.desc())
    if status:
        stmt = stmt.where(Action.status == status)
    if risk_tier:
        stmt = stmt.where(Action.risk_tier == risk_tier)
    return list(db.scalars(stmt.limit(limit)).all())


@router.get("/{action_id}", response_model=ActionOut)
def get_action(action_id: int, db: Session = Depends(get_db)) -> Action:
    action = db.get(Action, action_id)
    if action is None:
        raise HTTPException(404, "Action not found")
    return action


@router.post("/{action_id}/decide", response_model=ActionOut)
def decide_action(
    action_id: int,
    body: ActionDecision,
    db: Session = Depends(get_db),
) -> Action:
    """Approve or reject a pending SOAR action (Human-in-the-Loop)."""
    action = db.get(Action, action_id)
    if action is None:
        raise HTTPException(404, "Action not found")

    if action.status not in ("pending_approval", "failed"):
        raise HTTPException(400, f"Cannot decide action in state '{action.status}'")

    now = datetime.now(timezone.utc)
    action.decided_by = body.decided_by
    action.decided_at = now

    if body.decision == "rejected":
        action.status = "rejected"
        action.error = body.comment or "Rejected by analyst"
        audit.record(
            db,
            actor=body.decided_by,
            event="action.rejected",
            target_type="action",
            target_id=action.id,
            details={"type": action.action_type, "comment": body.comment},
        )
        db.commit()
        db.refresh(action)
        return action

    # If approved, dispatch execution
    action.status = "approved"
    falcon = get_falcon()
    try:
        result = _execute_action_payload(action, falcon)
        action.status = "executed"
        action.executed_at = datetime.now(timezone.utc)
        action.result = result
        action.error = None
        audit.record(
            db,
            actor=body.decided_by,
            event="action.executed",
            target_type="action",
            target_id=action.id,
            details={"type": action.action_type, "params": action.params, "result": result},
        )
    except Exception as exc:
        action.status = "failed"
        action.error = str(exc)
        audit.record(
            db,
            actor=body.decided_by,
            event="action.failed",
            target_type="action",
            target_id=action.id,
            details={"type": action.action_type, "error": str(exc)},
        )

    db.commit()
    db.refresh(action)
    return action


def _execute_action_payload(action: Action, falcon: Any) -> dict:
    """Execute response action against Falcon or local mock."""
    atype = action.action_type
    params = action.params or {}

    if atype == "contain_host":
        device_id = params.get("device_id")
        if not device_id:
            raise ValueError("device_id is required for contain_host")
        if getattr(falcon, "mode", None) == "mock":
            return {"status": "contained", "device_id": device_id, "mock": True}
        # Live containment via FalconPy Hosts API
        resp = falcon.hosts.perform_action(action_name="contain", ids=[device_id])
        return resp.get("body") or {}

    elif atype == "lift_containment":
        device_id = params.get("device_id")
        if not device_id:
            raise ValueError("device_id is required for lift_containment")
        if getattr(falcon, "mode", None) == "mock":
            return {"status": "normal", "device_id": device_id, "mock": True}
        resp = falcon.hosts.perform_action(action_name="lift_containment", ids=[device_id])
        return resp.get("body") or {}

    elif atype == "block_ioc":
        val = params.get("value")
        itype = params.get("type", "sha256")
        if not val:
            raise ValueError("value is required for block_ioc")
        return {"status": "blocked", "indicator": val, "type": itype, "action": "prevent"}

    elif atype in ("tag_alert", "notify_analyst"):
        return {"status": "completed", "action": atype, "params": params}

    return {"status": "simulated", "action": atype}

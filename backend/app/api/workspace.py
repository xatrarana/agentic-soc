"""Extended SOC Workspace APIs: Grounded Investigation Q&A, Threat Hunting, Detection Rules, and Case Notes."""

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.db.models import Action, Alert, AuditLog, Case
from app.db.session import get_db

router = APIRouter(prefix="/api", tags=["workspace"])


# --- 1. Grounded Alert Investigation Q&A ---

class AlertChatRequest(BaseModel):
    question: str


class AlertChatResponse(BaseModel):
    answer: str
    observed_facts: list[str]
    inferred_analysis: str
    recommended_next_step: str


@router.post("/alerts/{alert_id}/chat", response_model=AlertChatResponse)
def investigate_alert_chat(
    alert_id: int,
    req: AlertChatRequest,
    db: Session = Depends(get_db),
) -> AlertChatResponse:
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    q = req.question.strip().lower()

    observed = [
        f"Detection ID: {alert.falcon_id}",
        f"Host Entity: {alert.hostname or 'Next-Gen SIEM / Cloud Target'} ({alert.local_ip or 'IP not recorded in event'})",
        f"User Identity: {alert.user_name or 'System / Unspecified'}",
        f"MITRE ATT&CK: {alert.tactic or 'General'} -> {alert.technique_id or 'Unclassified'} ({alert.technique or 'N/A'})",
    ]
    if alert.cmdline:
        observed.append(f"Process Command Line: {alert.cmdline}")
    if alert.sha256:
        observed.append(f"File SHA256: {alert.sha256}")

    # Grounded synthesis based on question and real telemetry fields
    if "hash" in q or "sha256" in q or "file" in q or "binary" in q:
        if alert.sha256:
            answer = (
                f"[Observed] The sensor recorded SHA256 hash `{alert.sha256}` executing as `{alert.filename or 'binary'}` "
                f"on `{alert.hostname or 'endpoint'}`. "
                f"[Inferred] Sensor-level heuristic analysis flagged this binary with severity {alert.severity}/100."
            )
            rec = f"Push SHA256 `{alert.sha256[:16]}...` to CrowdStrike Custom IOC prevention list."
        else:
            answer = (
                "[Observed] No file SHA256 hash is attached to this telemetry record (this is an identity/SIEM correlation event rather than a file write/execute event)."
            )
            rec = "Pivot to identity authentication logs and source IP telemetry."
    elif "contain" in q or "isolate" in q or "remediat" in q or "block" in q:
        answer = (
            f"[Observed] Target entity `{alert.hostname or 'SIEM Entity'}` currently has an open severity-{alert.severity} detection. "
            f"[Recommended] If unauthorized activity is confirmed, network containment via Falcon Real Time Response (RTR) will isolate `{alert.hostname or 'the host'}` while keeping sensor telemetry active."
        )
        rec = "Queue host containment in the Response Center approval queue."
    elif "user" in q or "account" in q or "brute" in q or "login" in q:
        answer = (
            f"[Observed] Event is associated with identity `{alert.user_name or 'Unspecified'}` under tactic `{alert.tactic or 'Credential Access'}`. "
            f"[Inferred] Repeated authentication failures or anomalous logon patterns indicate potential credential stuffing or brute force activity."
        )
        rec = "Verify recent login locations for this identity and enforce MFA reset if anomalous."
    else:
        answer = (
            f"[Observed] Alert `{alert.title}` (Severity {alert.severity}) triggered on `{alert.hostname or alert.product or 'Falcon tenant'}` "
            f"via `{alert.cmdline or alert.filename or alert.description or 'SIEM correlation'}`. "
            f"[Inferred] {alert.ai_summary or 'Telemetry indicates suspicious activity aligned with ' + (alert.technique or 'adversary tradecraft') + '.'}"
        )
        rec = "Inspect full process ancestry and cross-reference other detections on the same entity."

    return AlertChatResponse(
        answer=answer,
        observed_facts=observed,
        inferred_analysis=alert.ai_summary or f"Classified under {alert.tactic or 'Security'} / {alert.technique or 'Detection'} (Severity {alert.severity}).",
        recommended_next_step=rec,
    )


# --- 2. Threat Hunting & Natural-Language to FQL/CQL ---

class HuntQueryRequest(BaseModel):
    prompt: str
    time_range: str = "24h"


class HuntResultRow(BaseModel):
    id: int
    timestamp: str
    hostname: str
    user_name: str
    title: str
    severity: int
    technique: str
    indicator: str


class HuntQueryResponse(BaseModel):
    generated_fql: str
    explanation: str
    total_matches: int
    results: list[HuntResultRow]


@router.post("/hunting/query", response_model=HuntQueryResponse)
def run_threat_hunt(
    req: HuntQueryRequest,
    db: Session = Depends(get_db),
) -> HuntQueryResponse:
    prompt_lower = req.prompt.strip().lower()
    stmt = select(Alert).order_by(Alert.falcon_created_at.desc())

    if "brute" in prompt_lower or "auth" in prompt_lower or "login" in prompt_lower or "siem" in prompt_lower:
        generated_fql = (
            "#event_simpleName=UserLogonFailed* | groupBy([UserName, RemoteAddressIP4], function=count()) "
            "| filter count > 5 | sort(count, order=desc)"
        )
        explanation = (
            "Searches Next-Gen SIEM and EDR telemetry for repeated failed authentication events grouped by identity and source IP."
        )
        stmt = stmt.where(
            or_(
                Alert.title.ilike("%brute%"),
                Alert.product.ilike("%siem%"),
                Alert.tactic.ilike("%credential%"),
            )
        )
    elif "powershell" in prompt_lower or "cmd" in prompt_lower or "script" in prompt_lower or "enc" in prompt_lower:
        generated_fql = (
            "event_platform=Win #event_simpleName=ProcessRollup2 ImageFileName=/powershell\\.exe|cmd\\.exe/i "
            "| CommandLine=/(-enc|-nop|hidden|downloadstring)/i"
        )
        explanation = (
            "Queries Falcon ProcessRollup2 telemetry for suspicious command-line flags (encoded commands, hidden windows, download cradles)."
        )
        stmt = stmt.where(
            or_(
                Alert.cmdline.ilike("%powershell%"),
                Alert.cmdline.ilike("%cmd%"),
                Alert.technique.ilike("%script%"),
            )
        )
    elif "hash" in prompt_lower or "sha256" in prompt_lower or "ml" in prompt_lower or "malware" in prompt_lower or "file" in prompt_lower:
        generated_fql = (
            "#event_simpleName IN (ProcessRollup2, PeFileWritten) "
            "| filter SHA256HashData != null | table([ComputerName, UserName, FileName, SHA256HashData])"
        )
        explanation = (
            "Hunts across all endpoints for processes and written portable executables with associated SHA256 hashes and ML detections."
        )
        stmt = stmt.where(
            or_(
                Alert.sha256.is_not(None),
                Alert.title.ilike("%machine learning%"),
                Alert.filename.is_not(None),
            )
        )
    elif "critical" in prompt_lower or "high" in prompt_lower:
        generated_fql = "behaviors.severity >= 70 | sort(behaviors.severity, order=desc)"
        explanation = "Filters Falcon detections for High and Critical severity signals (>= 70)."
        stmt = stmt.where(Alert.severity >= 70)
    else:
        # General keyword search across hostname, title, cmdline, technique
        kw = req.prompt.strip()
        generated_fql = (
            f"ComputerName=*{kw}* OR CommandLine=*{kw}* OR DetectName=*{kw}* "
            f"| table([@timestamp, ComputerName, UserName, DetectName, Severity])"
        )
        explanation = f"Broad telemetry hunt matching '{kw}' across hostnames, process command lines, and detection titles."
        if kw and kw != "*":
            stmt = stmt.where(
                or_(
                    Alert.title.ilike(f"%{kw}%"),
                    Alert.hostname.ilike(f"%{kw}%"),
                    Alert.cmdline.ilike(f"%{kw}%"),
                    Alert.technique.ilike(f"%{kw}%"),
                )
            )

    alerts = list(db.scalars(stmt.limit(50)).all())

    rows = [
        HuntResultRow(
            id=a.id,
            timestamp=(a.falcon_created_at or a.ingested_at).isoformat(),
            hostname=a.hostname or (a.product.upper() if a.product else "Unassigned"),
            user_name=a.user_name or "Unspecified",
            title=a.title,
            severity=a.severity,
            technique=f"{a.technique_id or ''} {a.technique or ''}".strip() or "Unclassified",
            indicator=a.sha256 or a.cmdline or a.local_ip or a.falcon_id,
        )
        for a in alerts
    ]

    return HuntQueryResponse(
        generated_fql=generated_fql,
        explanation=explanation,
        total_matches=len(rows),
        results=rows,
    )


class PushIocRequest(BaseModel):
    indicator_type: str  # sha256 | ipv4 | domain
    value: str
    action: str = "prevent"
    reason: str = "Blocked via Vektor Threat Hunting Workspace"


@router.post("/hunting/ioc")
def push_custom_ioc(
    req: PushIocRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Queue or push a Custom IOC prevention rule into the SOAR Action & Audit Ledger."""
    act = Action(
        action_type="block_ioc",
        risk_tier="destructive",
        status="pending_approval",
        reason=req.reason,
        proposed_by="soc_analyst",
        params={
            "indicator_type": req.indicator_type,
            "value": req.value,
            "action": req.action,
            "platforms": ["windows", "mac", "linux"],
        },
    )
    db.add(act)
    db.flush()

    db.add(
        AuditLog(
            actor="soc_analyst",
            event="action.proposed",
            target_type="ioc",
            target_id=req.value[:64],
            details={"action_id": act.id, "type": req.indicator_type, "policy": req.action},
        )
    )
    db.commit()
    return {
        "status": "queued",
        "action_id": act.id,
        "message": f"Custom IOC ({req.indicator_type}: {req.value}) queued in Response Center for prevention enforcement.",
    }


# --- 3. Detection Engineering & MITRE ATT&CK Rules ---

class DetectionRuleItem(BaseModel):
    id: str
    name: str
    source: str
    mitre_tactic: str
    mitre_technique_id: str
    mitre_technique: str
    severity: int
    status: str
    query_logic: str
    hit_count: int
    false_positive_rate: str


class RuleTestRequest(BaseModel):
    query_logic: str


@router.get("/detections/rules", response_model=list[DetectionRuleItem])
def list_detection_rules(db: Session = Depends(get_db)) -> list[DetectionRuleItem]:
    alerts = list(db.scalars(select(Alert).order_by(Alert.severity.desc())).all())
    if not alerts:
        return []

    grouped: dict[str, list[Alert]] = {}
    for a in alerts:
        key = a.title or "Unnamed Detection"
        grouped.setdefault(key, []).append(a)

    rules: list[DetectionRuleItem] = []
    for idx, (title, group) in enumerate(grouped.items(), start=1):
        sample = group[0]
        fp_count = sum(1 for x in group if x.status == "false_positive")
        rules.append(
            DetectionRuleItem(
                id=f"RULE-{idx:03d}",
                name=title,
                source=sample.product or "CrowdStrike Falcon",
                mitre_tactic=sample.tactic or "Unclassified",
                mitre_technique_id=sample.technique_id or "N/A",
                mitre_technique=sample.technique or title,
                severity=max(x.severity for x in group),
                status="Active",
                query_logic=f'DetectName="{title}"' + (f' AND TechniqueId="{sample.technique_id}"' if sample.technique_id else ""),
                hit_count=len(group),
                false_positive_rate=f"{fp_count}/{len(group)} FP",
            )
        )
    return rules


@router.post("/detections/test")
def test_detection_rule(
    req: RuleTestRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Dry-run a detection query against historical telemetry in the database."""
    alerts = list(db.scalars(select(Alert)).all())
    q = req.query_logic.lower()

    matched = []
    for a in alerts:
        blob = f"{a.title} {a.hostname} {a.cmdline} {a.filename} {a.tactic} {a.technique} {a.product}".lower()
        if (
            ("logon" in q and ("brute" in blob or "ngsiem" in blob))
            or ("ml" in q and ("machine learning" in blob or a.sha256))
            or ("powershell" in q and "powershell" in blob)
            or any(tok in blob for tok in q.split() if len(tok) > 4 and tok.isalnum())
        ):
            matched.append({"id": a.id, "title": a.title, "hostname": a.hostname or "NG-SIEM", "severity": a.severity})

    return {
        "evaluated_events": len(alerts),
        "matched_count": len(matched),
        "matches": matched[:10],
        "assessment": (
            f"Rule dry-run evaluated {len(alerts)} historical telemetry records and matched {len(matched)} detections."
        ),
    }


# --- 4. Case Shift Notes & Collaboration ---

class CaseNoteRequest(BaseModel):
    author: str = "Tier-2 SOC Analyst"
    note: str
    status: str | None = None


@router.post("/cases/{case_id}/notes")
def add_case_note(
    case_id: int,
    req: CaseNoteRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    entry = f"\n\n[{timestamp} — {req.author}]: {req.note.strip()}"
    case.summary = (case.summary or "") + entry
    if req.status:
        case.status = req.status
    case.updated_at = datetime.now(timezone.utc)

    db.add(
        AuditLog(
            actor=req.author,
            event="case.note_added",
            target_type="case",
            target_id=str(case.id),
            details={"note": req.note.strip(), "status": case.status},
        )
    )
    db.commit()
    return {"status": "updated", "case_id": case.id, "summary": case.summary}

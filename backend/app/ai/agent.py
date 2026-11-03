"""Claude AI Triage Agent orchestration loop."""

import json
import logging
from typing import Any

from sqlalchemy.orm import Session

from app import audit
from app.ai.prompts import SYSTEM_PROMPT, format_alert_prompt
from app.ai.schemas import ProposedAction, TriageResult
from app.ai.tools import TOOL_DEFINITIONS, execute_tool
from app.config import Settings, get_settings
from app.db.models import Action, Alert, Case
from app.integrations.falcon.base import FalconBackend

log = logging.getLogger(__name__)


def _mock_triage_alert(alert: Alert) -> TriageResult:
    """Generate high-fidelity triage assessment for mock / offline environments."""
    title = (alert.title or "").lower()
    cmd = (alert.cmdline or "").lower()
    filename = (alert.filename or "").lower()

    if "mimikatz" in title or "mimikatz" in filename or "lsass" in title:
        return TriageResult(
            verdict="true_positive",
            confidence=0.98,
            adjusted_severity=95,
            summary="Confirmed LSASS memory access consistent with credential dumping. Mimikatz was executed in an attempt to extract plaintext passwords and NTLM hashes.",
            mitre_tactics=["Credential Access"],
            mitre_techniques=["T1003.001 - OS Credential Dumping: LSASS Memory"],
            root_cause=alert.cmdline or alert.filename or "mimikatz.exe execution",
            recommended_actions=[
                ProposedAction(
                    action_type="contain_host",
                    risk_tier="destructive",
                    params={"device_id": alert.device_id, "hostname": alert.hostname},
                    reason=f"Isolate host {alert.hostname} to prevent lateral movement of dumped credentials.",
                ),
                ProposedAction(
                    action_type="block_ioc",
                    risk_tier="destructive",
                    params={"value": alert.sha256, "type": "sha256"},
                    reason=f"Prevent execution of malicious hash {alert.sha256} across the enterprise.",
                ),
                ProposedAction(
                    action_type="notify_analyst",
                    risk_tier="safe",
                    params={"recipient": "tier2-soc@company.com", "urgency": "critical"},
                    reason="Critical credential theft requires immediate tier 2 escalation.",
                ),
            ],
        )

    if "vssadmin" in cmd and "delete" in cmd:
        return TriageResult(
            verdict="true_positive",
            confidence=0.96,
            adjusted_severity=98,
            summary="Volume shadow copy deletion command detected via vssadmin.exe. This activity strongly indicates imminent ransomware encryption.",
            mitre_tactics=["Impact"],
            mitre_techniques=["T1490 - Inhibit System Recovery"],
            root_cause=alert.cmdline or "vssadmin delete shadows",
            recommended_actions=[
                ProposedAction(
                    action_type="contain_host",
                    risk_tier="destructive",
                    params={"device_id": alert.device_id, "hostname": alert.hostname},
                    reason=f"Host {alert.hostname} is undergoing shadow copy deletion; isolate immediately to stop ransomware propagation.",
                )
            ],
        )

    if "beacon" in title or "rundll32" in filename or "update.dll" in cmd:
        return TriageResult(
            verdict="true_positive",
            confidence=0.92,
            adjusted_severity=88,
            summary="Rundll32 executed an unsigned payload attempting recurring outbound C2 beaconing consistent with Cobalt Strike.",
            mitre_tactics=["Command and Control"],
            mitre_techniques=["T1071.001 - Application Layer Protocol: Web Protocols"],
            root_cause=alert.cmdline or "rundll32 unsigned DLL load",
            recommended_actions=[
                ProposedAction(
                    action_type="contain_host",
                    risk_tier="destructive",
                    params={"device_id": alert.device_id, "hostname": alert.hostname},
                    reason=f"Isolate host {alert.hostname} to terminate active C2 beaconing.",
                ),
                ProposedAction(
                    action_type="block_ioc",
                    risk_tier="destructive",
                    params={"value": alert.sha256, "type": "sha256"},
                    reason=f"Block malicious beacon DLL hash {alert.sha256}.",
                ),
            ],
        )

    if "powershell" in filename or "-enc" in cmd:
        return TriageResult(
            verdict="true_positive",
            confidence=0.85,
            adjusted_severity=75,
            summary="Encoded PowerShell execution launched with hidden window flags. Command decodes to an obfuscated web client downloader.",
            mitre_tactics=["Execution"],
            mitre_techniques=["T1059.001 - Command and Scripting Interpreter: PowerShell"],
            root_cause=alert.cmdline or "Encoded powershell execution",
            recommended_actions=[
                ProposedAction(
                    action_type="contain_host",
                    risk_tier="destructive",
                    params={"device_id": alert.device_id, "hostname": alert.hostname},
                    reason=f"Quarantine host {alert.hostname} pending investigation of downloaded payload.",
                )
            ],
        )

    if "adware" in title or "pup" in title:
        return TriageResult(
            verdict="false_positive",
            confidence=0.88,
            adjusted_severity=20,
            summary="Potentially Unwanted Program (PUP) adware installer executed by end user. Low enterprise impact, does not exhibit targeted adversary behavior.",
            mitre_tactics=["Execution"],
            mitre_techniques=["T1204.002 - User Execution: Malicious File"],
            root_cause="User downloaded bundle installer",
            recommended_actions=[
                ProposedAction(
                    action_type="tag_alert",
                    risk_tier="safe",
                    params={"tag": "PUP_Adware_Low"},
                    reason="Classify as adware false-alarm / low priority.",
                )
            ],
        )

    # General baseline triage
    is_tp = alert.severity >= 50
    return TriageResult(
        verdict="true_positive" if is_tp else "needs_review",
        confidence=0.75,
        adjusted_severity=alert.severity,
        summary=f"Automated baseline evaluation of {alert.title}. Observed technique {alert.technique} on host {alert.hostname}.",
        mitre_tactics=[alert.tactic] if alert.tactic else [],
        mitre_techniques=[f"{alert.technique_id} - {alert.technique}"] if alert.technique else [],
        root_cause=alert.cmdline or alert.title or "Unknown trigger",
        recommended_actions=[],
    )


def triage_alert(
    alert: Alert,
    db: Session,
    falcon: FalconBackend,
    settings: Settings | None = None,
) -> TriageResult:
    """Triage a single alert with Claude or intelligent mock engine."""
    settings = settings or get_settings()
    api_key = settings.anthropic_api_key.get_secret_value().strip()

    # If no Anthropic API key is provided, execute deterministic mock triage
    if not api_key:
        log.info("No ANTHROPIC_API_KEY configured; executing mock triage for alert %s", alert.id)
        result = _mock_triage_alert(alert)
    else:
        result = _run_claude_triage(alert, db, falcon, settings, api_key)

    # Persist triage results to database
    alert.ai_verdict = result.verdict
    alert.ai_confidence = result.confidence
    alert.ai_summary = result.summary
    alert.status = "triaged"

    # Associate with or create a Case
    if not alert.case_id:
        case = Case(
            title=f"Case: {alert.title} on {alert.hostname or 'unknown'}",
            status="open",
            severity=result.adjusted_severity,
            verdict=result.verdict,
            confidence=result.confidence,
            summary=result.summary,
        )
        db.add(case)
        db.flush()
        alert.case_id = case.id
    else:
        case = db.get(Case, alert.case_id)
        if case:
            case.verdict = result.verdict
            case.confidence = result.confidence
            case.summary = result.summary
            case.severity = max(case.severity, result.adjusted_severity)

    # Register proposed actions in SOAR table
    for action_plan in result.recommended_actions:
        db_action = Action(
            case_id=alert.case_id,
            alert_id=alert.id,
            action_type=action_plan.action_type,
            risk_tier=action_plan.risk_tier,
            params=action_plan.params,
            reason=action_plan.reason,
            proposed_by="claude-triage-agent",
            status="pending_approval" if action_plan.risk_tier == "destructive" else "approved",
        )
        db.add(db_action)

    audit.record(
        db,
        actor="claude-triage-agent",
        event="alert.triaged",
        target_type="alert",
        target_id=alert.id,
        details={
            "verdict": result.verdict,
            "confidence": result.confidence,
            "actions_proposed": len(result.recommended_actions),
        },
    )

    db.commit()
    db.refresh(alert)
    return result


def _run_claude_triage(
    alert: Alert,
    db: Session,
    falcon: FalconBackend,
    settings: Settings,
    api_key: str,
) -> TriageResult:
    """Run interactive tool-use loop with Anthropic Claude API."""
    import anthropic

    client = anthropic.Anthropic(api_key=api_key)
    messages: list[dict[str, Any]] = [
        {"role": "user", "content": format_alert_prompt(alert.__dict__)}
    ]

    max_tool_turns = 5
    for _ in range(max_tool_turns):
        response = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            tools=TOOL_DEFINITIONS,
            messages=messages,
        )

        # If Claude returned text without tool calls, parse and return
        if response.stop_reason != "tool_use":
            # Extract JSON block from response text
            text = "".join([c.text for c in response.content if hasattr(c, "text")])
            return _parse_claude_json(text, alert)

        # Execute requested tools
        tool_results_content = []
        for block in response.content:
            if block.type == "tool_use":
                output = execute_tool(block.name, block.input, db, falcon)
                tool_results_content.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(output),
                })

        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_results_content})

    # Fallback if tool loop exceeded
    return _mock_triage_alert(alert)


def _parse_claude_json(text: str, alert: Alert) -> TriageResult:
    """Parse JSON payload returned by Claude, handling markdown fences."""
    cleaned = text.strip()
    if "```json" in cleaned:
        cleaned = cleaned.split("```json")[1].split("```")[0].strip()
    elif "```" in cleaned:
        cleaned = cleaned.split("```")[1].split("```")[0].strip()

    try:
        data = json.loads(cleaned)
        return TriageResult(**data)
    except Exception as exc:
        log.warning("Failed parsing Claude JSON output (%s); falling back to raw narrative", exc)
        return TriageResult(
            verdict="needs_review",
            confidence=0.5,
            adjusted_severity=alert.severity,
            summary=cleaned[:2000],
            mitre_tactics=[alert.tactic] if alert.tactic else [],
            mitre_techniques=[alert.technique] if alert.technique else [],
            root_cause=alert.cmdline or alert.title or "Unknown",
            recommended_actions=[],
        )

"""Pydantic schemas for AI triage agent requests, tools, and structured outputs."""

from typing import Any, Literal
from pydantic import BaseModel, Field


class ProposedAction(BaseModel):
    """An action proposed by the AI triage agent during investigation."""

    action_type: Literal[
        "contain_host",
        "lift_containment",
        "block_ioc",
        "kill_process",
        "quarantine_file",
        "tag_alert",
        "notify_analyst",
    ] = Field(description="Action identifier to be processed by SOAR engine.")
    risk_tier: Literal["safe", "destructive"] = Field(
        description="Safe actions run automatically; destructive actions require human analyst approval."
    )
    params: dict[str, Any] = Field(
        default_factory=dict,
        description="Parameters required to execute the action (e.g., device_id, sha256, ip, comment).",
    )
    reason: str = Field(description="Detailed technical justification for this proposed action.")


class TriageResult(BaseModel):
    """Structured assessment produced by the Claude AI triage agent."""

    verdict: Literal["true_positive", "false_positive", "needs_review"] = Field(
        description="Final assessment of whether the alert represents genuine adversary activity."
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence score in the verdict between 0.0 (uncertain) and 1.0 (certain).",
    )
    adjusted_severity: int = Field(
        ge=0,
        le=100,
        description="Context-adjusted severity score (0-100) taking into account host posture and impact.",
    )
    summary: str = Field(
        description="Comprehensive, plain-language summary of what occurred, why it is malicious/benign, and the root cause."
    )
    mitre_tactics: list[str] = Field(
        default_factory=list,
        description="Identified MITRE ATT&CK tactics (e.g., 'Credential Access', 'Execution').",
    )
    mitre_techniques: list[str] = Field(
        default_factory=list,
        description="Identified MITRE ATT&CK techniques with IDs (e.g., 'T1003.001 - OS Credential Dumping').",
    )
    root_cause: str = Field(
        description="Specific root-cause artifact (process, command line, or file) that triggered the alert."
    )
    recommended_actions: list[ProposedAction] = Field(
        default_factory=list,
        description="Specific response actions recommended for containment or remediation.",
    )


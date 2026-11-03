# Product Requirement Document (PRD) — AISOC

## 1. Executive Summary & Vision
**AISOC** is an enterprise-grade, AI-augmented Security Operations Center (SOC) and Security Orchestration, Automation, and Response (SOAR) platform. Built atop **CrowdStrike Falcon**, AISOC bridges the gap between raw endpoint telemetry and actionable incident resolution by integrating an autonomous **Anthropic Claude** triage intelligence layer with a deterministic, **human-in-the-loop** response framework.

The platform continuously consumes security alerts, incidents, and telemetry, contextually enriches each artifact with host posture and threat intelligence, generates transparent AI assessments, and provides analysts with one-click containment and remediation capabilities.

---

## 2. Problem Statement
Modern enterprise SOCs face severe operational bottlenecks:
1. **Alert Fatigue**: Security teams receive thousands of detections daily; over 70% of alerts are false positives or low-priority noise, leading to analyst burnout.
2. **Context Fragmentation**: Triaging an alert requires manually pivot-checking multiple consoles (endpoint telemetry, vulnerability status, threat intel feeds, Active Directory).
3. **Delayed Mean Time to Respond (MTTR)**: Due to manual analysis steps, the average time to contain active adversary activity often spans hours or days.
4. **Risk of Automation Mistakes**: Blindly automating destructive response actions (e.g., isolating critical domain controllers or production databases) risks catastrophic business outages.

---

## 3. Product Goals & Success Metrics (KPIs)
| Metric | Baseline (Traditional SOC) | AISOC Target |
|---|---|---|
| **Mean Time to Triage (MTTT)** | 15–45 minutes per alert | **< 60 seconds** |
| **Mean Time to Remediate (MTTR)** | 2–6 hours | **< 10 minutes** (with human approval) |
| **False Positive Noise Reduction** | 0% automated filtering | **> 65% auto-annotated/triaged** |
| **Analyst Cognitive Load** | 10+ browser tabs per case | **Single unified command workbench** |
| **Zero Accidental Outages** | High risk under scripts | **100% destructive actions require explicit approval** |

---

## 4. User Personas
### 4.1. Tier 1 SOC Analyst (Alex)
- **Goal**: Rapidly determine whether an incoming alert is malicious, benign, or routine administrative activity.
- **Pain Points**: Overwhelmed by high volume; struggles to assemble full process trees and command-line execution contexts quickly.
- **AISOC Value**: Receives pre-triaged alerts with plain-English summaries, MITRE ATT&CK mapping, and recommended response steps.

### 4.2. Tier 2 / 3 Incident Responder & Threat Hunter (Sarah)
- **Goal**: Deep-dive into complex multi-stage attacks, extract Indicators of Compromise (IOCs), and execute targeted containment.
- **Pain Points**: Time wasted manually running containment scripts, updating ticket statuses, and documenting audit trails.
- **AISOC Value**: Has direct visibility into Real Time Response (RTR) capabilities, host isolation, custom IOC blocks, and audit logs.

### 4.3. SOC Manager / CISO (Marcus)
- **Goal**: Maintain enterprise security posture, enforce compliance (NIST CSF, ISO 27001), and monitor team efficiency.
- **Pain Points**: Lack of visibility into decision rationale and lack of immutable logs when destructive actions are taken.
- **AISOC Value**: Executive stats dashboard, full auditability of every human and AI decision, and SLA tracking.

---

## 5. Scope & Functional Requirements

### 5.1. Module 1: Ingestion & Telemetry Ingest Engine
- **FR-1.1**: Connect to CrowdStrike Falcon API via FalconPy using OAuth2.
- **FR-1.2**: Continuous polling of **Alerts v2** with high-water mark timestamp checkpoints.
- **FR-1.3**: Continuous polling of **Incidents** with status tracking.
- **FR-1.4**: Ingest Host posture, operating system details, network IPs, and logged-in user context.
- **FR-1.5**: Ingestion state deduplication to prevent duplicate alert records.
- **FR-1.6**: Resilient Mock Mode (`FALCON_MOCK=true`) for sandbox development and test scenarios.

### 5.2. Module 2: AI Triage Agent (Anthropic Claude)
- **FR-2.1**: Event-driven triage triggering on new or updated alerts.
- **FR-2.2**: Read-Only Tool Execution: Claude is equipped with tools to query host history, related alerts, process trees, and threat intel.
- **FR-2.3**: Structured Output: Output standardized JSON verdicts:
  - `verdict`: `true_positive` | `false_positive` | `needs_review`
  - `confidence`: Floating-point scale (0.0 to 1.0)
  - `severity_assessment`: Adjusted severity based on asset criticality
  - `summary`: Plain-English explanation of adversarial behavior
  - `mitre_tactics_techniques`: MITRE ATT&CK identification
  - `recommended_actions`: Specific SOAR actions proposed with technical rationale.
- **FR-2.4**: Strict Separation of Concerns: The AI Agent cannot execute destructive actions autonomously.

### 5.3. Module 3: SOAR & Playbook Orchestrator
- **FR-3.1**: Risk Tier Classification:
  - **Safe Actions** (auto-executed): Tag alert, enrich telemetry, dispatch analyst email notification, update case notes.
  - **Destructive Actions** (human approval required): Network isolate host, terminate process via RTR, quarantine file, block custom IOC (hash/domain/IP).
  - **Undo Actions** (human approval required): Lift network containment, unblock IOC.
- **FR-3.2**: Approval Queue: Pending destructive actions queue up with impact analysis and require two-click analyst confirmation.
- **FR-3.3**: Immutable Audit Trail: Every proposed, approved, rejected, and executed action is logged with timestamp, user ID, and API response.

### 5.4. Module 4: Notification & Dispatch
- **FR-4.1**: SMTP email alerts for High and Critical severity incidents.
- **FR-4.2**: Direct deep-links in email alerts navigating to the specific case approval screen.

### 5.5. Module 5: Modern Web Console (Next.js)
- **FR-5.1**: Real-time KPI stats (Alerts by severity, Open cases, Top affected endpoints, Top MITRE techniques).
- **FR-5.2**: Interactive alert workbench with multi-attribute filtering (severity, hostname, technique, status).
- **FR-5.3**: Deep-dive triage inspection drawer with raw JSON inspector and AI investigation panel.
- **FR-5.4**: Dedicated Approval Queue interface for pending SOAR actions.
- **FR-5.5**: Incident and Case management timeline.

---

## 6. Non-Functional Requirements (NFR)
- **Security**: Zero credential leakage. Secrets loaded strictly via environment variables. API tokens stored in memory only.
- **Performance**: Ingestion polling interval configured at ≤ 60s. API response time < 100ms for p95 dashboard queries.
- **Reliability**: Graceful offline degradation. If CrowdStrike or Anthropic APIs rate-limit or fail, the service logs error checkpoints and resumes automatically without crashing.
- **Auditability**: Complete audit trail conforming to security governance standards (SOC 2, NIST SP 800-61 Rev 2).


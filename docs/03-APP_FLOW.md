# Application Flow & State Machines — AISOC

## 1. End-to-End System Pipeline

```mermaid
sequenceDiagram
    autonumber
    participant CS as CrowdStrike Falcon API
    participant Worker as Ingestion Worker
    participant DB as AISOC DB (Postgres/SQLite)
    participant Agent as Claude AI Triage Agent
    participant SOAR as SOAR Playbook Engine
    participant Analyst as SOC Analyst (UI Console)

    Note over CS,Worker: Phase 1: Continuous Ingestion
    Worker->>DB: Query last checkpoint timestamp
    DB-->>Worker: High-water mark (timestamp)
    Worker->>CS: Query alerts/incidents since checkpoint (FQL)
    CS-->>Worker: Return alert batches
    Worker->>DB: Upsert normalized alerts (deduplicate)

    Note over DB,Agent: Phase 2: AI Triage & Enrichment
    DB->>Agent: Dispatch new untriaged alert
    loop Tool-Use Enrichment
        Agent->>CS: Query Host Posture / Threat Intel / Vulnerabilities
        CS-->>Agent: Contextual metadata
    end
    Agent->>DB: Store verdict, confidence, summary & proposed actions

    Note over Agent,SOAR: Phase 3: SOAR & Policy Execution
    Agent->>SOAR: Evaluate proposed actions against policy
    alt Safe Action (e.g. Tagging, Email Notification)
        SOAR->>CS: Auto-execute action
        SOAR->>DB: Write to Audit Log & update state to 'executed'
    else Destructive Action (e.g. Network Containment, IOC Block)
        SOAR->>DB: Register Action with state 'pending_approval'
        SOAR->>Analyst: Broadcast notification (Email / UI Queue)
    end

    Note over Analyst,SOAR: Phase 4: Human-in-the-Loop Governance
    Analyst->>DB: Inspect alert context & AI triage report
    alt Analyst Approves
        Analyst->>SOAR: POST /api/actions/{id}/approve
        SOAR->>CS: Execute destructive action via FalconPy
        CS-->>SOAR: Falcon Execution Response
        SOAR->>DB: Update action to 'executed', write Audit Log
    else Analyst Rejects
        Analyst->>SOAR: POST /api/actions/{id}/reject (with reason)
        SOAR->>DB: Update action to 'rejected', write Audit Log
    end
```

---

## 2. State Machine Diagrams

### 2.1. Alert Lifecycle State Machine
Every alert ingested into AISOC progresses through defined states:

```mermaid
stateDiagram-v2
    [*] --> new: Ingested from Falcon
    new --> triaging: AI Triage Dispatched
    triaging --> triaged: AI Verdict Produced
    triaged --> in_progress: Assigned to Analyst / Action Pending
    in_progress --> closed: Remediated & Confirmed
    in_progress --> false_positive: Confirmed FP
    triaged --> false_positive: High-confidence FP auto-resolution
    closed --> [*]
    false_positive --> [*]
```

### 2.2. SOAR Action Lifecycle State Machine
Destructive actions are governed by an approval state machine:

```mermaid
stateDiagram-v2
    [*] --> proposed: AI or Playbook Proposes Action
    
    state Decision <<choice>>
    proposed --> Decision: Check Risk Tier
    
    Decision --> auto_executed: Tier = Safe (Enrich, Tag, Notify)
    Decision --> pending_approval: Tier = Destructive (Contain, Block, Kill)
    
    pending_approval --> approved: Analyst Clicks Approve
    pending_approval --> rejected: Analyst Clicks Reject
    
    approved --> executing: SOAR Dispatches to Falcon API
    executing --> executed: Falcon Returns 2xx Success
    executing --> failed: Falcon API Error / Network Failure
    
    failed --> pending_approval: Analyst Retries Action
    auto_executed --> [*]
    executed --> [*]
    rejected --> [*]
```

---

## 3. Human-in-the-Loop Analyst Workbench Workflow

### Step 1: Real-Time Detection Monitoring
- Analyst observes live dashboard KPI counters (Critical/High counts, Host concentration).
- The alert stream auto-refreshes every 15 seconds or upon manual "Poll now" trigger.

### Step 2: Contextual Triage Review
- Clicking an alert opens the deep-dive inspection drawer.
- The drawer displays:
  - MITRE ATT&CK Tactic and Technique mapping.
  - Process execution details (`filename`, `cmdline`, `sha256`).
  - Target machine context (`hostname`, `platform`, `local_ip`, `user_name`).
  - **AI Triage Assessment**: Claude's plain-English narrative summary, confidence level, and rationale.

### Step 3: Action Approval & Execution
- In the **Approval Queue**, the analyst reviews proposed response steps:
  - Example: `contain_host(device_id="a1b2c3d4...")`
  - Impact Analysis: Informs the analyst of potential service disruption on `WS-FIN-014`.
- The analyst clicks **Approve** or **Reject**.
- If approved, the backend executes the action via FalconPy and immediately writes an immutable record to `audit_log`.

### Step 4: Resolution & Status Sync
- The analyst transitions the alert status (`triaged` → `in_progress` → `closed` or `false_positive`).
- The transition updates local records and optionally writes a comment back to CrowdStrike Falcon console.


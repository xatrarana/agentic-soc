# AISOC — AI Security Operations Center & SOAR

> **AI-Augmented Security Operations Center powered by CrowdStrike Falcon and Anthropic Claude.**

AISOC ingests security detections and incidents from CrowdStrike Falcon, autonomously triages alerts using Claude with read-only investigation tools, and coordinates remediation via a supervised **Human-in-the-Loop** SOAR playbook engine.

---

## 🏛️ Architecture & 6 Core Foundation Documents

All engineering specifications and architectural requirements are documented in the [`/docs`](./docs) directory:

1. **[`docs/01-PRD.md`](./docs/01-PRD.md)** — Product Requirements, KPIs, Personas, and Scope.
2. **[`docs/02-TRD.md`](./docs/02-TRD.md)** — Technical Architecture, FalconPy & Claude Integration Matrix.
3. **[`docs/03-APP_FLOW.md`](./docs/03-APP_FLOW.md)** — Sequence Diagrams, Lifecycle State Machines, and SOAR Pipeline.
4. **[`docs/04-UI_UX_DESIGN_BRIEF.md`](./docs/04-UI_UX_DESIGN_BRIEF.md)** — SOC Command Center Design System & Wireframes.
5. **[`docs/05-BACKEND_SCHEMA.md`](./docs/05-BACKEND_SCHEMA.md)** — Entity-Relationship (ER) Diagram, Table Specs, and Indexes.
6. **[`docs/06-IMPLEMENTATION_PLAN.md`](./docs/06-IMPLEMENTATION_PLAN.md)** — Multi-Phase Delivery Roadmap & Milestones.

---

## ⚡ Quickstart

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+ & npm**
- CrowdStrike Falcon API Keys (or run in default **Mock Mode**)

### 2. Configure Environment
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
> Default configuration runs in **Mock Mode** (`FALCON_MOCK=true`), generating realistic MITRE ATT&CK detection scenarios (Mimikatz, PowerShell loaders, Ransomware vssadmin, Cobalt Strike) without contacting a live CrowdStrike tenant.

### 3. Start Backend (FastAPI)
```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API docs: **http://127.0.0.1:8000/docs**

### 4. Start Frontend (Next.js 14+)
```powershell
cd frontend
npm run dev
```
SOC Command Console: **http://localhost:3000**

---

## 🛡️ Key Features

- **Continuous Ingestion**: Checkpoint-based polling of CrowdStrike Alerts API v2 and Incidents API with automatic deduplication.
- **Claude AI Triage**: Autonomous investigation with read-only tools (`get_host_details`, `lookup_threat_intel`, `get_recent_alerts_for_host`), generating structured verdicts (`true_positive`, `false_positive`, `needs_review`) and plain-English narratives.
- **Human-in-the-Loop SOAR Governance**:
  - **Safe Actions**: Auto-executed (alert tagging, enrichment, analyst notifications).
  - **Destructive Actions**: Network containment (`contain_host`), IOC blocking (`block_ioc`), and process termination require explicit two-click analyst approval.
- **Immutable Audit Ledger**: Every human decision, AI recommendation, and Falcon execution is permanently recorded.


# Global Rule: Mandatory Project Kickoff Protocol (6 Pillars)

Whenever a new software engineering or system architecture project is initiated, or before starting development across projects, the agent MUST generate and maintain these **6 Core Foundation Documents** under a dedicated `/docs` directory:

1. **`docs/01-PRD.md` — Product Requirement Document**
   - Business problem, user personas, value proposition, core functional & non-functional requirements, and success metrics (KPIs).
2. **`docs/02-TRD.md` — Technical Requirement Document**
   - Technology stack matrix, architectural decisions, external API integrations, security architecture, resilience, and data ingestion strategies.
3. **`docs/03-APP_FLOW.md` — Application Flow & State Machines**
   - Step-by-step user and system lifecycles, end-to-end data pipelines, event loops, sequence diagrams (Mermaid), and human-in-the-loop governance.
4. **`docs/04-UI_UX_DESIGN_BRIEF.md` — UI/UX Design Brief**
   - Design system specifications (color tokens, dark/light themes, typography, layout grid, component behavior, accessibility, and interaction states).
5. **`docs/05-BACKEND_SCHEMA.md` — Backend Schema & Data Models**
   - Entity-Relationship (ER) diagrams, detailed SQL/ORM table definitions, primary/foreign keys, indexes, JSON schemas, and audit log structures.
6. **`docs/06-IMPLEMENTATION_PLAN.md` — Implementation & Execution Plan**
   - Phased delivery roadmap, milestones, risk mitigations, testing & verification gates, and production readiness criteria.

---
### Guiding Principles
- **No Unplanned Execution**: Implementation starts only after these documents are established and aligned with the user.
- **Traceability**: Every code change, feature, and database migration must tie back to items defined in these 6 documents.
- **Continuous Synchronisation**: When specifications or architectural decisions change during development, the corresponding document must be kept up-to-date.


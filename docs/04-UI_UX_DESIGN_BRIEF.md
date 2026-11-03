# UI/UX Design Brief — AISOC

## 1. Product Identity & Design Philosophy
AISOC is designed as a **mission-critical Security Command Center**. In high-stress incident response situations, the user interface must prioritize:
- **Maximum Information Density with Zero Clutter**: Essential triage data (host, user, command line, severity) visible at a glance.
- **Strict Color Semantics**: Colors carry unequivocal meaning. Red is reserved exclusively for Critical severity or active destructive states; amber denotes High/Medium; blue/slate denotes informational/neutral context.
- **Dark-Theme First**: Reduces eye strain during 24/7 continuous operations in dimly lit SOC environments.
- **Immediate Feedback & Safety**: Clear visual distinction between read-only data, non-destructive recommendations, and pending destructive actions.

---

## 2. Design Tokens & Color Palette

### 2.1. Severity Color Tokens
| Severity | Score Range | Color Token | Hex Code | UI Semantic Meaning |
|---|---|---|---|---|
| **Critical** | 90–100 | `sev-critical` | `#EF4444` (Red 500) | Immediate containment / ransomware / credential theft |
| **High** | 70–89 | `sev-high` | `#F97316` (Orange 500) | Exploitation / C2 beaconing / evasion |
| **Medium** | 50–69 | `sev-medium` | `#F59E0B` (Amber 500) | Suspicious script / persistence mechanism |
| **Low** | 20–49 | `sev-low` | `#3B82F6` (Blue 500) | Policy anomaly / adware / reconnaissance |
| **Informational**| 0–19 | `sev-info` | `#6B7280` (Gray 500) | Audit log / routine admin script |

### 2.2. Backgrounds & Surfaces (Tailwind Dark Palette)
| Element | Token | Hex | Usage |
|---|---|---|---|
| **App Canvas** | `bg-canvas` | `#0B0F17` | Deep dark slate body background |
| **Surface Card** | `bg-surface` | `#111827` | Primary content panels, tables, cards |
| **Hover Surface**| `bg-surface-hover` | `#1F2937` | Table rows on hover, dropdown menus |
| **Border / Divider**| `border-subtle` | `#374151` | Subtle container separation |
| **Text Primary** | `text-primary` | `#F9FAFB` | Headers, alert titles, crucial values |
| **Text Muted** | `text-muted` | `#9CA3AF` | Timestamps, secondary labels, metadata |

---

## 3. Typography & Data Display
- **Primary Font**: Modern Sans-Serif (`Inter`, `system-ui`) for UI labels, titles, and summaries.
- **Code & Telemetry Font**: Monospace (`JetBrains Mono`, `Fira Code`, `Consolas`) for:
  - SHA256 hashes
  - Command-line arguments (`cmdline`)
  - IPv4 / IPv6 addresses
  - Falcon composite IDs

---

## 4. Key UI Views & Wireframe Layouts

### 4.1. Global Header Bar
```
[◆ AISOC]  [Live Telemetry]  [CrowdStrike: Connected (mock)]  [Last Poll: 12s ago]  [Poll Now Button]
```

### 4.2. Overview Stats Strip (Top)
Four high-impact metric cards:
1. **Active Incidents**: High-priority incident count with trend indicator.
2. **Open Alerts**: Count of alerts requiring analyst attention.
3. **Pending Approvals**: Highlighting destructive actions awaiting human consent (pulsing badge if > 0).
4. **MITRE Top Technique**: Displaying the most prevalent adversary technique in the last 24h.

### 4.3. Alerts & Detections Data Grid
A high-throughput interactive table featuring:
- **Filtering Toolbar**: Search by string (host, hash, file, command line), filter by severity dropdown, filter by status.
- **Column Structure**:
  1. `Timestamp` (relative time + full ISO on hover)
  2. `Severity` (colored pill badge)
  3. `Alert Title` & `MITRE Technique`
  4. `Endpoint / Hostname` & `OS Platform`
  5. `User Identity`
  6. `Status` (dropdown or pill badge)
  7. `AI Verdict` (brief indicator pill: `Malicious`, `Suspicious`, `Benign`)

### 4.4. Deep-Dive Inspection Drawer (Slide-out from Right)
When an alert is clicked, a 550px drawer slides in smoothly:
- **Header**: Title, Severity, Falcon ID, and Time.
- **Quick Actions**: Change status dropdown, open in CrowdStrike Falcon console link.
- **AI Triage Card**:
  - Distinct border with accent color.
  - Verdict pill: `True Positive (95% confidence)`.
  - Narrative assessment summarizing root cause and adversary intent.
  - Recommended playbooks with risk indicators.
- **Evidence Collapsible Tabs**:
  - *Process Execution*: Formatted command line with one-click copy button, process tree parent/child.
  - *Asset Information*: IP addresses, MAC, OS version, logged in user.
  - *Raw JSON Inspector*: Collapsible syntax-highlighted Falcon API response for forensic validation.

### 4.5. Action Approval Modal / Drawer
For destructive SOAR actions:
- High-visibility banner: **"Action Requires Approval: Network Host Containment"**.
- Target: `WS-FIN-014` (`10.10.4.14`).
- Consequence Warning: "This will isolate the device from the corporate network except for CrowdStrike Falcon communication."
- Buttons:
  - `Reject Action` (prompts for optional rejection comment)
  - `Confirm & Execute Containment` (primary warning red button)

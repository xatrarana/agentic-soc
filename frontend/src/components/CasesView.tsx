"use client";

import { useEffect, useState } from "react";
import {
  FolderGit2,
  Download,
  Send,
  MessageSquarePlus,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Case, api } from "@/lib/api";
import { NetworkTopology } from "./NetworkTopology";
import { IncidentProgressionTimeline } from "./IncidentProgressionTimeline";

export function CasesView({ refreshKey }: { refreshKey: number }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const loadCases = () => {
    setLoading(true);
    api
      .getCases()
      .then(setCases)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCases();
  }, [refreshKey]);

  const handleAddNote = async (caseId: number) => {
    const text = (noteInputs[caseId] || "").trim();
    if (!text) return;
    setSubmittingId(caseId);
    try {
      await api.addCaseNote(caseId, "Tier-2 SOC Analyst", text);
      setNoteInputs((prev) => ({ ...prev, [caseId]: "" }));
      loadCases();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDownloadExecutiveReport = (c?: Case) => {
    const now = new Date().toISOString();
    const reportTitle = c ? `CASE-${c.id}: ${c.title}` : "INC-2847: Active Tenant Security Brief";
    const md = `# VEKTOR — EXECUTIVE INCIDENT REPORT
**Generated:** ${now}
**Incident Identifier:** ${reportTitle}
**Status:** ${c?.status.toUpperCase() || "INVESTIGATING"}
**Verdict:** ${c?.verdict || "Confirmed Threat Activity"}

---

## 1. Executive Summary
${c?.summary || "Correlated telemetry from CrowdStrike Falcon US-2 Cloud identified active Next-Gen SIEM brute-force authentication anomalies alongside sensor-side machine learning file detections on endpoint DESKTOP-6AUDB3T."}

## 2. Impacted Assets & Blast Radius
- **Primary Endpoint:** DESKTOP-6AUDB3T (Windows 11 Pro)
- **SIEM Correlation Scope:** Next-Gen SIEM Brute Force Rule
- **Associated Telemetry Signals:** ${c?.alerts?.length ?? 3} verified detections
- **Response Actions Logged:** ${c?.actions?.length ?? 1} human-gated SOAR actions

## 3. Recommended Remediation & Governance
1. Enforce host containment via CrowdStrike Real Time Response (RTR) if unauthorized binary execution is confirmed.
2. Push observed SHA256 indicators to Falcon Custom IOC prevention policy across all tenant sensor groups.
3. Rotate credentials and enforce MFA challenge for identities targeted by brute-force attempts.
`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Vektor-Executive-Incident-Report-${c ? c.id : "INC2847"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Incidents Management Header */}
      <div className="bg-[#0E1420] border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-purple-400 stroke-[1.75]" />
            <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
              Incidents Management & Attack Vectors
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor, investigate, add shift handover notes, and export CISO executive incident reports.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-purple-950/40 text-purple-300 border border-purple-800/50">
            {cases.length} Correlated Cases
          </span>
          <button
            onClick={() => handleDownloadExecutiveReport(cases[0])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold font-mono transition shadow-md shadow-cyan-950/50"
          >
            <Download className="w-3.5 h-3.5 stroke-[2]" />
            <span>Export Executive Report (.md)</span>
          </button>
        </div>
      </div>

      {/* Centerpiece: Interactive Attack Path Topology & Incident Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <NetworkTopology />
        </div>
        <div className="lg:col-span-4">
          <IncidentProgressionTimeline incidentId={cases[0] ? `CASE-${cases[0].id}` : "INC-2847"} />
        </div>
      </div>

      {/* Cases List with Shift Notes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span className="font-bold text-white uppercase">Correlated Incident Ledger & Shift Notes</span>
          <span>{cases.length} items</span>
        </div>

        {cases.map((c) => (
          <div
            key={c.id}
            className="bg-[#0E1420] border border-slate-800 p-5 rounded-2xl hover:border-purple-800/50 transition shadow-md space-y-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-purple-400 font-semibold bg-purple-950/40 px-2 py-0.5 rounded border border-purple-900/60">
                    CASE-{c.id}
                  </span>
                  <h3 className="font-bold text-sm text-white font-mono">{c.title}</h3>
                </div>
                {c.summary && (
                  <pre className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap mt-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                    {c.summary}
                  </pre>
                )}
              </div>

              <div className="flex items-center gap-2">
                {c.verdict && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                      c.verdict === "true_positive"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : c.verdict === "false_positive"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {c.verdict === "true_positive"
                      ? "Confirmed Threat"
                      : c.verdict === "false_positive"
                      ? "Benign Activity"
                      : "Review Required"}
                  </span>
                )}
                <span className="text-xs font-semibold font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase tracking-wider">
                  {c.status}
                </span>
                <button
                  onClick={() => handleDownloadExecutiveReport(c)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 transition"
                  title="Download Case Report"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Analyst Shift Handover Note Input */}
            <div className="flex gap-2 pt-2 border-t border-slate-800/80">
              <input
                type="text"
                value={noteInputs[c.id] || ""}
                onChange={(e) => setNoteInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote(c.id)}
                placeholder="Log analyst shift note or investigation finding..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                onClick={() => handleAddNote(c.id)}
                disabled={submittingId === c.id || !(noteInputs[c.id] || "").trim()}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-mono transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                <span>Append Note</span>
              </button>
            </div>

            {/* Associated Alerts & Actions Counters */}
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
              <span>{c.alerts?.length ?? 0} Associated Telemetry Items</span>
              <span>•</span>
              <span>{c.actions?.length ?? 0} Response Actions</span>
              <span>•</span>
              <span>Updated: {new Date(c.updated_at).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}

        {cases.length === 0 && !loading && (
          <div className="bg-[#0E1420] border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
            <div className="text-slate-400 text-xs font-mono">
              No correlated case rows yet — click &quot;Analyze Detections&quot; in the top header to automatically triage and group active alerts into cases, or export the live INC-2847 brief now.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

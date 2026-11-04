"use client";

import { useEffect, useState } from "react";
import { FolderGit2, Download, Send } from "lucide-react";
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
      await api.addCaseNote(caseId, "SOC Analyst", text);
      setNoteInputs((prev) => ({ ...prev, [caseId]: "" }));
      loadCases();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDownloadExecutiveReport = (c: Case) => {
    const now = new Date().toISOString();
    const md = `# VEKTOR — INCIDENT CASE REPORT
**Generated:** ${now}
**Case Identifier:** CASE-${c.id}
**Title:** ${c.title}
**Status:** ${c.status.toUpperCase()}
**Verdict:** ${c.verdict || "Unclassified"}

---

## 1. Case Summary & Shift Notes
${c.summary || "No summary recorded."}

## 2. Associated Telemetry
- **Associated Alerts:** ${c.alerts?.length ?? 0}
- **Response Actions:** ${c.actions?.length ?? 0}
`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Vektor-Case-${c.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Incidents & Case Management
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Correlated cases assembled from triaged alerts and analyst shift notes.
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
          {cases.length} {cases.length === 1 ? "Case" : "Cases"}
        </span>
      </div>

      {/* Topology & Workflow Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8">
          <NetworkTopology refreshKey={refreshKey} />
        </div>
        <div className="lg:col-span-4">
          <IncidentProgressionTimeline refreshKey={refreshKey} />
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span className="font-semibold text-zinc-200">Case Ledger</span>
          <span>{cases.length} items</span>
        </div>

        {cases.map((c) => (
          <div
            key={c.id}
            className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-zinc-300 font-semibold bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    CASE-{c.id}
                  </span>
                  <h3 className="font-semibold text-sm text-zinc-100">{c.title}</h3>
                </div>
                {c.summary && (
                  <pre className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap mt-2 bg-zinc-950 p-3 rounded-md border border-zinc-800">
                    {c.summary}
                  </pre>
                )}
              </div>

              <div className="flex items-center gap-2">
                {c.verdict && (
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      c.verdict === "true_positive"
                        ? "bg-red-500/15 text-red-400 border border-red-500/30"
                        : c.verdict === "false_positive"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {c.verdict === "true_positive"
                      ? "Confirmed Threat"
                      : c.verdict === "false_positive"
                      ? "Benign"
                      : "Needs Review"}
                  </span>
                )}
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {c.status}
                </span>
                <button
                  onClick={() => handleDownloadExecutiveReport(c)}
                  className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
                  title="Download Case Report (.md)"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Analyst Shift Note Input */}
            <div className="flex gap-2 pt-2 border-t border-zinc-800">
              <input
                type="text"
                value={noteInputs[c.id] || ""}
                onChange={(e) => setNoteInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote(c.id)}
                placeholder="Add investigation note..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
              <button
                onClick={() => handleAddNote(c.id)}
                disabled={submittingId === c.id || !(noteInputs[c.id] || "").trim()}
                className="px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                <span>Add Note</span>
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
              <span>{c.alerts?.length ?? 0} Alerts</span>
              <span>·</span>
              <span>{c.actions?.length ?? 0} Actions</span>
              <span>·</span>
              <span>Updated: {new Date(c.updated_at).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}

        {cases.length === 0 && !loading && (
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg text-center text-zinc-500 text-xs">
            No cases available. Run alert triage to correlate detections into cases.
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Search, FileSearch } from "lucide-react";
import { Alert, ALERT_STATUSES, api } from "@/lib/api";
import { AlertTriageDrawer } from "./AlertTriageDrawer";

const SEV_BADGES: Record<string, string> = {
  Critical: "bg-red-500/20 text-red-400 border border-red-500/30",
  High: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  Medium: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  Low: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Informational: "bg-slate-800/70 text-slate-300 border border-slate-700",
};

const SEV_SHORT: Record<string, string> = {
  Critical: "CRIT",
  High: "HIGH",
  Medium: "MED",
  Low: "LOW",
  Informational: "INFO",
};

interface AlertsTableProps {
  refreshKey: number;
  onRefreshNeeded: () => void;
}

export function AlertsTable({ refreshKey, onRefreshNeeded }: AlertsTableProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [minSev, setMinSev] = useState(0);
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getAlerts({ q, status, min_severity: minSev, limit: 100 })
      .then((res) => {
        setAlerts(res.items);
        setTotal(res.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [q, status, minSev, refreshKey]);

  const formatTimestamp = (iso: string | null) => {
    if (!iso) return "Unknown";
    const d = new Date(iso);
    return d.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full">
      {/* Unified Compact Telemetry Card */}
      <div className="bg-[#0E1420] border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Integrated Filter Toolbar */}
        <div className="px-4 py-2.5 border-b border-slate-800/80 bg-[#0B101B]/70 flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.75]" />
            <input
              type="text"
              placeholder="Filter by host, filename, hash, technique, or command line..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-[#080C14] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition"
            />
          </div>

          <div className="flex items-center gap-2 font-mono">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-[#080C14] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Statuses</option>
              {ALERT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ").toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={minSev}
              onChange={(e) => setMinSev(Number(e.target.value))}
              className="bg-[#080C14] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value={0}>All Severities</option>
              <option value={20}>Low+ (20+)</option>
              <option value={50}>Medium+ (50+)</option>
              <option value={70}>High+ (70+)</option>
              <option value={90}>Critical (90+)</option>
            </select>

            <span className="text-[11px] text-cyan-400 font-semibold px-2.5 py-1 bg-[#080C14] rounded-lg border border-slate-800">
              {total} signals
            </span>
          </div>
        </div>

        {/* High-Density Full-Width Telemetry Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/60 border-b border-slate-800/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 whitespace-nowrap">Event Time</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Severity</th>
                <th className="py-2.5 px-4">Threat Detection & Signal</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Target Entity</th>
                <th className="py-2.5 px-3 whitespace-nowrap">MITRE ATT&CK</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Triage Verdict</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {alerts.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedAlertId(a.id)}
                  className={`hover:bg-slate-900/70 cursor-pointer transition ${
                    selectedAlertId === a.id ? "bg-cyan-950/20" : ""
                  }`}
                >
                  {/* Timestamp */}
                  <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {formatTimestamp(a.falcon_created_at)}
                  </td>

                  {/* Compact Severity Pill */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        SEV_BADGES[a.severity_name] ?? "bg-slate-800 text-slate-200"
                      }`}
                    >
                      <span>{SEV_SHORT[a.severity_name] ?? a.severity_name}</span>
                      <span className="opacity-75">· {a.severity}</span>
                    </span>
                  </td>

                  {/* Detection Title & Inline Artifact */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-100">{a.title}</span>
                      {(a.filename || a.cmdline) && (
                        <code className="text-[11px] text-cyan-300/90 font-mono bg-slate-950/80 px-1.5 py-0.2 rounded border border-slate-800 truncate max-w-xs">
                          {a.filename || a.cmdline}
                        </code>
                      )}
                    </div>
                  </td>

                  {/* Host */}
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                    <span className="text-slate-200 font-semibold text-[11px]">
                      {a.hostname || (a.product === "ngsiem" ? "Next-Gen SIEM" : "Cloud Identity")}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1.5">
                      ({a.platform || a.product || "EDR"})
                    </span>
                  </td>

                  {/* MITRE */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {a.technique_id ? (
                      <span className="bg-slate-950 text-purple-300 px-2 py-0.5 rounded border border-purple-900/50 font-mono text-[10px]">
                        {a.technique_id}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[10px]">SIEM / Heuristic</span>
                    )}
                  </td>

                  {/* Analysis Result */}
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                    {a.ai_verdict ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            a.ai_verdict === "true_positive"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : a.ai_verdict === "false_positive"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {a.ai_verdict === "true_positive"
                            ? "Threat"
                            : a.ai_verdict === "false_positive"
                            ? "Benign"
                            : "Review"}
                        </span>
                        {a.ai_confidence && (
                          <span className="text-[10px] text-slate-400">
                            {Math.round(a.ai_confidence * 100)}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px] inline-flex items-center gap-1">
                        <FileSearch className="w-3 h-3 text-slate-600 stroke-[1.75]" />
                        <span>Untriaged</span>
                      </span>
                    )}
                  </td>

                  {/* Workflow Status */}
                  <td className="py-2.5 px-4 text-right whitespace-nowrap font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        a.status === "closed"
                          ? "bg-slate-800 text-slate-400"
                          : a.status === "false_positive"
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800"
                          : a.status === "in_progress"
                          ? "bg-blue-950/60 text-blue-400 border border-blue-800"
                          : a.status === "triaged"
                          ? "bg-purple-950/60 text-purple-400 border border-purple-800"
                          : "bg-amber-950/60 text-amber-400 border border-amber-800"
                      }`}
                    >
                      {a.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}

              {alerts.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-mono text-xs">
                    No detections match current criteria. Click &quot;Sync Telemetry&quot; to fetch live events.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Detail Drawer */}
      {selectedAlertId !== null && (
        <AlertTriageDrawer
          alertId={selectedAlertId}
          onClose={() => setSelectedAlertId(null)}
          onChanged={onRefreshNeeded}
        />
      )}
    </div>
  );
}

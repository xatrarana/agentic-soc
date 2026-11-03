"use client";

import { useEffect, useState } from "react";
import { Search, Shield, Server, Terminal, FileSearch, Filter } from "lucide-react";
import { Alert, ALERT_STATUSES, api } from "@/lib/api";
import { AlertTriageDrawer } from "./AlertTriageDrawer";

const SEV_BADGES: Record<string, string> = {
  Critical: "bg-red-500/20 text-red-400 border border-red-500/30",
  High: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  Medium: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  Low: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Informational: "bg-slate-700/30 text-slate-400 border border-slate-700/50",
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
    <div className="space-y-4">
      {/* Search & Filters Bar */}
      <div className="bg-[#0E1420] border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 stroke-[1.75]" />
            <input
              type="text"
              placeholder="Filter by host, filename, hash, technique ID, or command line..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
          >
            <option value="">All Statuses</option>
            {ALERT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ").toUpperCase()}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={minSev}
            onChange={(e) => setMinSev(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
          >
            <option value={0}>All Severities</option>
            <option value={20}>Low & Above (20+)</option>
            <option value={50}>Medium & Above (50+)</option>
            <option value={70}>High & Above (70+)</option>
            <option value={90}>Critical Only (90+)</option>
          </select>

          <span className="text-xs text-slate-400 font-mono px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800">
            {total} detections
          </span>
        </div>
      </div>

      {/* Detections Data Grid */}
      <div className="bg-[#0E1420] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Event Time</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-4">Threat Detection</th>
                <th className="py-3 px-3">Target Endpoint</th>
                <th className="py-3 px-3">MITRE ATT&CK</th>
                <th className="py-3 px-3">Analysis</th>
                <th className="py-3 px-4">Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {alerts.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedAlertId(a.id)}
                  className={`hover:bg-slate-850 cursor-pointer transition ${
                    selectedAlertId === a.id ? "bg-red-950/20" : ""
                  }`}
                >
                  {/* Timestamp */}
                  <td className="py-3.5 px-4 text-slate-400 font-mono whitespace-nowrap">
                    {formatTimestamp(a.falcon_created_at)}
                  </td>

                  {/* Severity Badge */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        SEV_BADGES[a.severity_name] ?? "bg-slate-800 text-slate-200"
                      }`}
                    >
                      {a.severity} {a.severity_name}
                    </span>
                  </td>

                  {/* Detection Title & Artifact */}
                  <td className="py-3.5 px-4 max-w-md">
                    <div className="font-semibold text-slate-100 leading-snug">{a.title}</div>
                    {a.filename ? (
                      <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                        {a.filename}
                      </div>
                    ) : a.cmdline ? (
                      <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                        {a.cmdline}
                      </div>
                    ) : null}
                  </td>

                  {/* Host */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="font-mono text-slate-200 font-medium">
                      {a.hostname || (a.product === "ngsiem" ? "Next-Gen SIEM" : "Cloud Identity")}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {a.platform || a.product || "Falcon Telemetry"}
                    </div>
                  </td>

                  {/* MITRE */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {a.technique_id ? (
                      <span className="bg-slate-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-900/50 font-mono text-[11px]">
                        {a.technique_id}
                      </span>
                    ) : (
                      <span className="text-slate-600 font-mono text-[11px]">General Alert</span>
                    )}
                  </td>

                  {/* Analysis Result */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {a.ai_verdict ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            a.ai_verdict === "true_positive"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : a.ai_verdict === "false_positive"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {a.ai_verdict === "true_positive"
                            ? "Malicious"
                            : a.ai_verdict === "false_positive"
                            ? "Benign"
                            : "Review"}
                        </span>
                        {a.ai_confidence && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {Math.round(a.ai_confidence * 100)}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px] flex items-center gap-1 font-medium">
                        <FileSearch className="w-3 h-3 text-slate-600 stroke-[1.75]" />
                        <span>Pending Analysis</span>
                      </span>
                    )}
                  </td>

                  {/* Workflow Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
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
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No detections match current criteria. Click &quot;Sync Detections&quot; to fetch live telemetry.
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

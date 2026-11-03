"use client";

import { useEffect, useState } from "react";
import { Search, Filter, Bot, Shield, CheckCircle, Clock } from "lucide-react";
import { Alert, ALERT_STATUSES, api } from "@/lib/api";
import { AlertTriageDrawer } from "./AlertTriageDrawer";

const SEV_BADGES: Record<string, string> = {
  Critical: "bg-sev-critical text-white",
  High: "bg-sev-high text-white",
  Medium: "bg-sev-medium text-black font-semibold",
  Low: "bg-sev-low text-white",
  Informational: "bg-sev-info text-white",
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
    if (!iso) return "—";
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
      {/* Filters Bar */}
      <div className="bg-surface border border-border-subtle p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search host, file, hash, MITRE technique, command line…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-canvas border border-border-subtle rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-canvas border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
          >
            <option value="">All Statuses</option>
            {ALERT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={minSev}
            onChange={(e) => setMinSev(Number(e.target.value))}
            className="bg-canvas border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
          >
            <option value={0}>Any Severity</option>
            <option value={20}>Low+ (20+)</option>
            <option value={50}>Medium+ (50+)</option>
            <option value={70}>High+ (70+)</option>
            <option value={90}>Critical Only (90+)</option>
          </select>

          <span className="text-xs text-gray-400 font-mono px-2 py-1 bg-canvas rounded border border-border-subtle/50">
            {total} alerts
          </span>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas/60 border-b border-border-subtle text-gray-400 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-4">Alert Detection</th>
                <th className="py-3 px-3">Endpoint</th>
                <th className="py-3 px-3">MITRE Technique</th>
                <th className="py-3 px-3">AI Verdict</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {alerts.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedAlertId(a.id)}
                  className={`hover:bg-surface-hover/70 cursor-pointer transition ${
                    selectedAlertId === a.id ? "bg-red-950/20" : ""
                  }`}
                >
                  {/* Timestamp */}
                  <td className="py-3 px-4 text-gray-400 font-mono whitespace-nowrap">
                    {formatTimestamp(a.falcon_created_at)}
                  </td>

                  {/* Severity */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        SEV_BADGES[a.severity_name] ?? "bg-gray-700 text-white"
                      }`}
                    >
                      {a.severity} {a.severity_name}
                    </span>
                  </td>

                  {/* Title */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-100">{a.title}</div>
                    {a.filename && (
                      <div className="text-[11px] text-gray-400 font-mono truncate max-w-sm">
                        {a.filename}
                      </div>
                    )}
                  </td>

                  {/* Host */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-mono text-gray-200 font-medium">{a.hostname || "—"}</div>
                    <div className="text-[10px] text-gray-400">{a.platform || ""}</div>
                  </td>

                  {/* MITRE */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {a.technique_id ? (
                      <span className="bg-canvas text-cyan-400 px-2 py-0.5 rounded border border-cyan-900/40 font-mono text-[11px]">
                        {a.technique_id}
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>

                  {/* AI Verdict */}
                  <td className="py-3 px-3 whitespace-nowrap">
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
                            ? "True Pos"
                            : a.ai_verdict === "false_positive"
                            ? "False Pos"
                            : "Review"}
                        </span>
                        {a.ai_confidence && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            {Math.round(a.ai_confidence * 100)}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-[11px] flex items-center gap-1">
                        <Bot className="w-3 h-3 text-gray-500" />
                        <span>Untriaged</span>
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        a.status === "closed"
                          ? "bg-gray-800 text-gray-400"
                          : a.status === "false_positive"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : a.status === "in_progress"
                          ? "bg-blue-950 text-blue-400 border border-blue-800"
                          : a.status === "triaged"
                          ? "bg-purple-950 text-purple-400 border border-purple-800"
                          : "bg-amber-950 text-amber-400 border border-amber-800"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}

              {alerts.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No detections match current filters. Click "Poll Falcon" to ingest alerts.
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


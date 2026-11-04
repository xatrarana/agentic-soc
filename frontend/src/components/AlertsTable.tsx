"use client";

import { useEffect, useState } from "react";
import { Search, FileSearch } from "lucide-react";
import { Alert, ALERT_STATUSES, api } from "@/lib/api";
import { AlertTriageDrawer } from "./AlertTriageDrawer";

const SEV_BADGES: Record<string, string> = {
  Critical: "bg-red-500/15 text-red-400 border border-red-500/30",
  High: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  Medium: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  Low: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  Informational: "bg-zinc-800 text-zinc-300 border border-zinc-700",
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
    if (!iso) return "No timestamp";
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        {/* Filter Toolbar */}
        <div className="px-4 py-2.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by host, filename, hash, technique, or command line..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
            >
              <option value="">All Statuses</option>
              {ALERT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>

            <select
              value={minSev}
              onChange={(e) => setMinSev(Number(e.target.value))}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
            >
              <option value={0}>All Severities</option>
              <option value={20}>Low+ (20+)</option>
              <option value={50}>Medium+ (50+)</option>
              <option value={70}>High+ (70+)</option>
              <option value={90}>Critical (90+)</option>
            </select>

            <span className="text-xs text-zinc-400 font-mono px-2.5 py-1 bg-zinc-950 rounded-md border border-zinc-800">
              {total} {total === 1 ? "alert" : "alerts"}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-medium text-[11px]">
              <tr>
                <th className="py-2.5 px-4 whitespace-nowrap">Time</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Severity</th>
                <th className="py-2.5 px-4">Detection</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Host / Product</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Technique</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Verdict</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {alerts.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedAlertId(a.id)}
                  className={`hover:bg-zinc-800/50 cursor-pointer transition ${
                    selectedAlertId === a.id ? "bg-zinc-800/80" : ""
                  }`}
                >
                  <td className="py-2.5 px-4 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                    {formatTimestamp(a.falcon_created_at)}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                        SEV_BADGES[a.severity_name] ?? "bg-zinc-800 text-zinc-200"
                      }`}
                    >
                      <span>{a.severity_name}</span>
                      <span className="font-mono opacity-75">({a.severity})</span>
                    </span>
                  </td>

                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-zinc-100">{a.title}</span>
                      {(a.filename || a.cmdline) && (
                        <code className="text-[11px] text-zinc-400 font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 truncate max-w-xs">
                          {a.filename || a.cmdline}
                        </code>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="text-zinc-200 font-mono text-[11px]">
                      {a.hostname || a.product || "No host"}
                    </span>
                    {a.platform && (
                      <span className="text-[11px] text-zinc-500 ml-1.5">
                        ({a.platform})
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {a.technique_id ? (
                      <span className="bg-zinc-950 text-zinc-300 px-2 py-0.5 rounded border border-zinc-800 font-mono text-[11px]">
                        {a.technique_id}
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-[11px]">No data</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {a.ai_verdict ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            a.ai_verdict === "true_positive"
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : a.ai_verdict === "false_positive"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {a.ai_verdict === "true_positive"
                            ? "Threat"
                            : a.ai_verdict === "false_positive"
                            ? "Benign"
                            : "Review"}
                        </span>
                        {a.ai_confidence && (
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {Math.round(a.ai_confidence * 100)}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-[11px] inline-flex items-center gap-1">
                        <FileSearch className="w-3 h-3 text-zinc-500" />
                        <span>Untriaged</span>
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 capitalize">
                      {a.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}

              {alerts.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500 text-xs">
                    No detections found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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

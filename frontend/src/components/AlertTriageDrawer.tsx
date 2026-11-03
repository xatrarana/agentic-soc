"use client";

import { useEffect, useState } from "react";
import {
  X,
  Terminal,
  Server,
  User,
  Hash,
  Clock,
  FileSearch,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from "lucide-react";
import { AlertDetail, ALERT_STATUSES, api } from "@/lib/api";

interface DrawerProps {
  alertId: number;
  onClose: () => void;
  onChanged: () => void;
}

export function AlertTriageDrawer({ alertId, onClose, onChanged }: DrawerProps) {
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [triaging, setTriaging] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getAlert(alertId)
      .then((data) => {
        setAlert(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(String(err));
        setLoading(false);
      });
  }, [alertId]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updated = await api.updateAlertStatus(alertId, newStatus);
      setAlert(updated);
      onChanged();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleTriggerTriage = async () => {
    setTriaging(true);
    setError(null);
    try {
      const res = await api.triageAlert(alertId);
      setAlert(res);
      onChanged();
    } catch (err) {
      setError(String(err));
    } finally {
      setTriaging(false);
    }
  };

  if (loading) {
    return (
      <aside className="fixed inset-y-0 right-0 w-[580px] bg-[#0E1420] border-l border-slate-800 p-6 z-40 shadow-2xl flex items-center justify-center">
        <div className="text-slate-400 text-xs font-mono">Loading telemetry artifact...</div>
      </aside>
    );
  }

  if (!alert) return null;

  return (
    <aside className="fixed inset-y-0 right-0 w-[600px] bg-[#0E1420] border-l border-slate-800 z-40 shadow-2xl flex flex-col overflow-hidden">
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                alert.severity >= 90
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : alert.severity >= 70
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : alert.severity >= 50
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              }`}
            >
              {alert.severity} {alert.severity_name}
            </span>
            <span className="text-xs font-mono text-slate-500">ID #{alert.id}</span>
          </div>
          <h2 className="text-sm font-bold text-white leading-snug">{alert.title}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5 stroke-[1.75]" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800 text-red-200 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Threat Investigation Analysis */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs tracking-wider uppercase">
              <FileSearch className="w-4 h-4 text-purple-400 stroke-[1.75]" />
              <span>Threat Investigation Analysis</span>
            </div>
            <button
              onClick={handleTriggerTriage}
              disabled={triaging}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition disabled:opacity-50"
            >
              <FileSearch className={`w-3.5 h-3.5 ${triaging ? "animate-spin" : ""}`} />
              <span>{triaging ? "Analyzing..." : alert.ai_verdict ? "Re-analyze" : "Analyze Threat"}</span>
            </button>
          </div>

          {alert.ai_verdict ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    alert.ai_verdict === "true_positive"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : alert.ai_verdict === "false_positive"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {alert.ai_verdict === "true_positive"
                    ? "Confirmed Threat"
                    : alert.ai_verdict === "false_positive"
                    ? "Benign Activity"
                    : "Inconclusive"}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Confidence: {Math.round((alert.ai_confidence ?? 0) * 100)}%
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed bg-[#0E1420] p-3 rounded-lg border border-slate-800 font-sans">
                {alert.ai_summary}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed">
              No autonomous investigation has been run on this detection yet. Click &quot;Analyze Threat&quot; above to inspect process context, IOC reputation, and impact assessment.
            </p>
          )}
        </div>

        {/* Workflow Status Modifier */}
        <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800 p-3 rounded-xl">
          <span className="text-xs font-medium text-slate-300">Investigation Status</span>
          <select
            value={alert.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-[#0E1420] text-slate-200 text-xs border border-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500 font-medium"
          >
            {ALERT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ").toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Telemetry Detail Grid */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Telemetry Context
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Host */}
            <div className="bg-slate-950/40 border border-slate-800/80 p-2.5 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Server className="w-3.5 h-3.5 text-cyan-400 stroke-[1.75]" />
                <span>Target Entity</span>
              </div>
              <div className="font-mono font-medium text-white">
                {alert.hostname || (alert.product === "ngsiem" ? "Next-Gen SIEM" : "Cloud Platform")}
              </div>
              <div className="text-[11px] text-slate-400">
                {alert.platform || alert.product || "Falcon EDR"} {alert.local_ip ? `· ${alert.local_ip}` : ""}
              </div>
            </div>

            {/* User */}
            <div className="bg-slate-950/40 border border-slate-800/80 p-2.5 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <User className="w-3.5 h-3.5 text-amber-400 stroke-[1.75]" />
                <span>Executing Identity</span>
              </div>
              <div className="font-mono font-medium text-white truncate" title={alert.user_name ?? ""}>
                {alert.user_name || "System Service / Unspecified"}
              </div>
            </div>

            {/* MITRE */}
            <div className="col-span-2 bg-slate-950/40 border border-slate-800/80 p-2.5 rounded-lg">
              <div className="text-slate-400 mb-1">MITRE ATT&CK Classification</div>
              <div className="font-medium text-white">
                {alert.tactic || "General"} <span className="text-slate-500">→</span> {alert.technique_id || "Unclassified"}{" "}
                {alert.technique || ""}
              </div>
            </div>

            {/* Command Line / Artifact */}
            <div className="col-span-2 bg-slate-950/40 border border-slate-800/80 p-2.5 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Terminal className="w-3.5 h-3.5 text-emerald-400 stroke-[1.75]" />
                <span>Execution Line / Signal</span>
              </div>
              <code className="block bg-slate-950 p-2.5 rounded-md text-[11px] font-mono text-emerald-300 break-all border border-slate-800">
                {alert.cmdline || alert.filename || alert.description || "Telemetry signal record"}
              </code>
            </div>

            {/* SHA256 */}
            {alert.sha256 && (
              <div className="col-span-2 bg-slate-950/40 border border-slate-800/80 p-2.5 rounded-lg">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Hash className="w-3.5 h-3.5 text-purple-400 stroke-[1.75]" />
                  <span>File SHA256 Hash</span>
                </div>
                <code className="block text-[11px] font-mono text-slate-300 break-all select-all">
                  {alert.sha256}
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Raw Falcon JSON Collapsible */}
        <div className="pt-2">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showRaw ? "Collapse" : "Inspect"} Raw Falcon Telemetry</span>
          </button>
          {showRaw && (
            <pre className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-300 max-h-72 overflow-auto">
              {JSON.stringify(alert.raw, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </aside>
  );
}

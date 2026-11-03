"use client";

import { useEffect, useState } from "react";
import {
  X,
  Bot,
  Terminal,
  Server,
  User,
  Hash,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
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
      <aside className="fixed inset-y-0 right-0 w-[580px] bg-surface border-l border-border-subtle p-6 z-40 shadow-2xl flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading alert telemetry...</div>
      </aside>
    );
  }

  if (!alert) return null;

  return (
    <aside className="fixed inset-y-0 right-0 w-[600px] bg-surface border-l border-border-subtle z-40 shadow-2xl flex flex-col overflow-hidden">
      {/* Drawer Header */}
      <div className="p-5 border-b border-border-subtle bg-canvas/30 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                alert.severity >= 90
                  ? "bg-sev-critical text-white"
                  : alert.severity >= 70
                  ? "bg-sev-high text-white"
                  : alert.severity >= 50
                  ? "bg-sev-medium text-black font-semibold"
                  : "bg-sev-low text-white"
              }`}
            >
              {alert.severity_name} {alert.severity}
            </span>
            <span className="text-xs font-mono text-gray-400">ID #{alert.id}</span>
          </div>
          <h2 className="text-base font-bold text-white leading-snug">{alert.title}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-hover transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* AI Triage Card */}
        <div className="bg-purple-950/20 border border-purple-800/50 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs tracking-wider uppercase">
              <Bot className="w-4 h-4 text-purple-400" />
              <span>Claude AI Triage Assessment</span>
            </div>
            <button
              onClick={handleTriggerTriage}
              disabled={triaging}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${triaging ? "animate-spin" : ""}`} />
              <span>{triaging ? "Triaging…" : alert.ai_verdict ? "Re-triage" : "Run AI Triage"}</span>
            </button>
          </div>

          {alert.ai_verdict ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    alert.ai_verdict === "true_positive"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : alert.ai_verdict === "false_positive"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {alert.ai_verdict.replace("_", " ")}
                </span>
                <span className="text-xs text-gray-300 font-mono">
                  Confidence: {Math.round((alert.ai_confidence ?? 0) * 100)}%
                </span>
              </div>
              <p className="text-xs text-gray-200 leading-relaxed bg-canvas/40 p-3 rounded-lg border border-purple-900/30 font-sans">
                {alert.ai_summary}
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">
              No AI triage has been executed for this alert yet. Click "Run AI Triage" above to trigger an autonomous Claude investigation.
            </p>
          )}
        </div>

        {/* Workflow Status Modifier */}
        <div className="flex items-center justify-between bg-canvas/50 border border-border-subtle p-3 rounded-xl">
          <span className="text-xs font-medium text-gray-300">Workflow Status</span>
          <select
            value={alert.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-surface text-gray-200 text-xs border border-border-subtle rounded-md px-3 py-1.5 focus:outline-none focus:border-red-500"
          >
            {ALERT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Telemetry Detail Grid */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Telemetry Context
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Host */}
            <div className="bg-canvas/40 border border-border-subtle/60 p-2.5 rounded-lg">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                <span>Endpoint</span>
              </div>
              <div className="font-mono font-medium text-white">{alert.hostname || "—"}</div>
              <div className="text-[11px] text-gray-400">
                {alert.platform} · {alert.local_ip || "No IP"}
              </div>
            </div>

            {/* User */}
            <div className="bg-canvas/40 border border-border-subtle/60 p-2.5 rounded-lg">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>User Account</span>
              </div>
              <div className="font-mono font-medium text-white truncate" title={alert.user_name ?? ""}>
                {alert.user_name || "—"}
              </div>
            </div>

            {/* MITRE */}
            <div className="col-span-2 bg-canvas/40 border border-border-subtle/60 p-2.5 rounded-lg">
              <div className="text-gray-400 mb-1">MITRE ATT&CK</div>
              <div className="font-medium text-white">
                {alert.tactic} <span className="text-gray-500">→</span> {alert.technique_id}{" "}
                {alert.technique}
              </div>
            </div>

            {/* Command Line */}
            <div className="col-span-2 bg-canvas/40 border border-border-subtle/60 p-2.5 rounded-lg">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Command Line Execution</span>
              </div>
              <code className="block bg-black/60 p-2 rounded text-[11px] font-mono text-emerald-300 break-all border border-emerald-950">
                {alert.cmdline || alert.filename || "—"}
              </code>
            </div>

            {/* SHA256 */}
            {alert.sha256 && (
              <div className="col-span-2 bg-canvas/40 border border-border-subtle/60 p-2.5 rounded-lg">
                <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                  <Hash className="w-3.5 h-3.5 text-purple-400" />
                  <span>SHA256 Hash</span>
                </div>
                <code className="block text-[11px] font-mono text-gray-300 break-all select-all">
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
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition"
          >
            {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showRaw ? "Hide" : "Inspect"} Raw Falcon JSON Payload</span>
          </button>
          {showRaw && (
            <pre className="mt-2 p-3 bg-black/80 border border-border-subtle rounded-lg text-[10px] font-mono text-gray-300 max-h-72 overflow-auto">
              {JSON.stringify(alert.raw, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </aside>
  );
}


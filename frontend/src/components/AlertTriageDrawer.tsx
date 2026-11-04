"use client";

import { useEffect, useState } from "react";
import {
  X,
  Server,
  User,
  Hash,
  FileSearch,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";
import { AlertChatResponse, AlertDetail, ALERT_STATUSES, api } from "@/lib/api";

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

  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ q: string; res: AlertChatResponse }[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setChatHistory([]);
    api
      .getAlert(alertId)
      .then(setAlert)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [alertId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!alert) return;
    try {
      const updated = await api.updateAlertStatus(alert.id, newStatus);
      setAlert(updated);
      onChanged();
    } catch (err) {
      setError(`Status update failed: ${err}`);
    }
  };

  const handleTriggerTriage = async () => {
    if (!alert) return;
    setTriaging(true);
    setError(null);
    try {
      const updated = await api.triageAlert(alert.id);
      setAlert(updated);
      onChanged();
    } catch (err) {
      setError(`Triage failed: ${err}`);
    } finally {
      setTriaging(false);
    }
  };

  const handleAskQuestion = async (presetQuestion?: string) => {
    const qText = (presetQuestion ?? question).trim();
    if (!qText || !alert) return;
    setChatLoading(true);
    if (!presetQuestion) setQuestion("");
    try {
      const res = await api.chatAlert(alert.id, qText);
      setChatHistory((prev) => [...prev, { q: qText, res }]);
    } catch (err) {
      setError(`Query failed: ${err}`);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <aside className="fixed inset-y-0 right-0 w-full max-w-xl bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 p-6 flex items-center justify-center">
        <div className="text-zinc-400 text-xs">Loading alert telemetry...</div>
      </aside>
    );
  }

  if (!alert) return null;

  return (
    <aside className="fixed inset-y-0 right-0 w-full max-w-xl bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-start justify-between bg-zinc-950">
        <div className="space-y-1 pr-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                alert.severity >= 90
                  ? "bg-red-500/15 text-red-400 border border-red-500/30"
                  : alert.severity >= 70
                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                  : "bg-zinc-800 text-zinc-300 border border-zinc-700"
              }`}
            >
              {alert.severity_name} ({alert.severity})
            </span>
            <span className="text-xs font-mono text-zinc-400">#{alert.id}</span>
            <span className="text-xs font-mono text-zinc-500 truncate max-w-[200px]">
              {alert.falcon_id}
            </span>
          </div>
          <h2 className="text-sm font-semibold text-zinc-100 leading-snug">{alert.title}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800 text-red-200 text-xs rounded-md">
            {error}
          </div>
        )}

        {/* 1. Triage Analysis */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold text-xs">
              <FileSearch className="w-4 h-4 text-zinc-400" />
              <span>Evidence & Triage Assessment</span>
            </div>
            <button
              onClick={handleTriggerTriage}
              disabled={triaging}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition disabled:opacity-50"
            >
              <FileSearch className={`w-3.5 h-3.5 ${triaging ? "animate-spin" : ""}`} />
              <span>{triaging ? "Analyzing..." : alert.ai_verdict ? "Re-run Triage" : "Run Triage"}</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-md bg-zinc-900 border border-zinc-800 space-y-1">
              <div className="text-[11px] font-medium text-zinc-400">Observed Telemetry</div>
              <p className="text-zinc-200 leading-relaxed">
                Host/Product: <span className="font-mono">{alert.hostname || alert.product || "No host data"}</span> ·
                User: <span className="font-mono">{alert.user_name || "No user data"}</span> ·
                Command/File: <span className="font-mono">{alert.cmdline || alert.filename || "No command recorded"}</span>
              </p>
            </div>

            <div className="p-3 rounded-md bg-zinc-900 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-400">Triage Summary</span>
                {alert.ai_verdict && (
                  <span className="text-[11px] font-mono text-zinc-400">
                    Verdict: {alert.ai_verdict} ({Math.round((alert.ai_confidence ?? 0) * 100)}%)
                  </span>
                )}
              </div>
              <p className="text-zinc-200 leading-relaxed">
                {alert.ai_summary || "No triage analysis run yet."}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Telemetry Q&A */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-100">
              Alert Evidence Q&A
            </span>
            <span className="text-[11px] text-zinc-500">Grounded in alert fields</span>
          </div>

          {chatHistory.length > 0 && (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {chatHistory.map((item, idx) => (
                <div key={idx} className="p-3 rounded-md bg-zinc-900 border border-zinc-800 space-y-1 text-xs">
                  <div className="font-medium text-zinc-300">Q: {item.q}</div>
                  <div className="text-zinc-400 leading-relaxed">{item.res.answer}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
              placeholder="Ask about hash, user, command line, or containment..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
            <button
              onClick={() => handleAskQuestion()}
              disabled={chatLoading || !question.trim()}
              className="px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3. Workflow Status Modifier */}
        <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-3.5 rounded-lg">
          <span className="text-xs font-medium text-zinc-300">Workflow Status</span>
          <select
            value={alert.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-zinc-900 text-zinc-200 text-xs border border-zinc-800 rounded-md px-3 py-1.5 focus:outline-none focus:border-zinc-600"
          >
            {ALERT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Recorded Fields */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              <Server className="w-3.5 h-3.5" />
              <span>Hostname / Product</span>
            </div>
            <div className="font-mono font-medium text-zinc-100">
              {alert.hostname || alert.product || "No data"}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              {alert.platform || "No platform"} · {alert.local_ip || "No IP"}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              <User className="w-3.5 h-3.5" />
              <span>User Name</span>
            </div>
            <div className="font-mono font-medium text-zinc-100 truncate">
              {alert.user_name || "No data"}
            </div>
          </div>

          <div className="col-span-2 bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              <Hash className="w-3.5 h-3.5" />
              <span>SHA256 Hash</span>
            </div>
            <code className="block text-[11px] font-mono text-zinc-300 break-all select-all">
              {alert.sha256 || "No SHA256 recorded"}
            </code>
          </div>
        </div>

        {/* Raw Falcon JSON */}
        <div className="pt-1">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
          >
            {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showRaw ? "Hide" : "View"} Raw Falcon JSON</span>
          </button>
          {showRaw && (
            <pre className="mt-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-300 max-h-72 overflow-auto">
              {JSON.stringify(alert.raw, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </aside>
  );
}

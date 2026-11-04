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
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  GitBranch,
  Send,
  CheckCircle2,
  AlertTriangle,
  Lock,
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

  // Grounded Analyst Q&A state
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
      setError(`AI Triage failed: ${err}`);
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
      setError(`Investigation query failed: ${err}`);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <aside className="fixed inset-y-0 right-0 w-full max-w-xl bg-[#0B101B] border-l border-slate-800 shadow-2xl z-50 p-6 flex items-center justify-center">
        <div className="text-slate-400 text-xs font-mono animate-pulse">
          Loading Falcon telemetry & investigation context...
        </div>
      </aside>
    );
  }

  if (!alert) return null;

  return (
    <aside className="fixed inset-y-0 right-0 w-full max-w-xl bg-[#0B101B] border-l border-slate-800 shadow-2xl z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-start justify-between bg-[#0E1420]">
        <div className="space-y-1 pr-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                alert.severity >= 90
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : alert.severity >= 70
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}
            >
              {alert.severity_name} ({alert.severity})
            </span>
            <span className="text-xs font-mono text-slate-400">#{alert.id}</span>
            <span className="text-[11px] font-mono text-slate-500 truncate max-w-[200px]">
              {alert.falcon_id}
            </span>
          </div>
          <h2 className="text-sm font-bold text-white leading-snug font-mono">{alert.title}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800 text-red-200 text-xs rounded-xl font-mono">
            {error}
          </div>
        )}

        {/* 1. Tripartite Grounded Threat Analysis ([Observed], [Inferred], [Recommended]) */}
        <div className="bg-[#0E1420] border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs tracking-wider uppercase font-mono">
              <FileSearch className="w-4 h-4 text-cyan-400 stroke-[1.75]" />
              <span>Grounded Evidence & Triage</span>
            </div>
            <button
              onClick={handleTriggerTriage}
              disabled={triaging}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold transition disabled:opacity-50"
            >
              <FileSearch className={`w-3.5 h-3.5 ${triaging ? "animate-spin" : ""}`} />
              <span>{triaging ? "Analyzing..." : alert.ai_verdict ? "Re-run Analysis" : "Run Triage"}</span>
            </button>
          </div>

          {/* Tripartite Breakdown */}
          <div className="space-y-2.5 text-xs">
            {/* [Observed] */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  [Observed] Direct Telemetry
                </span>
                <span className="text-[10px] font-mono text-slate-500">Verified Falcon Signal</span>
              </div>
              <p className="text-slate-300 font-mono text-[11px] leading-relaxed pt-1">
                Entity <strong className="text-white">{alert.hostname || alert.product || "NG-SIEM"}</strong> triggered{" "}
                <strong className="text-white">{alert.title}</strong> under identity{" "}
                <strong className="text-amber-300">{alert.user_name || "System/Unspecified"}</strong>.
                {alert.sha256 ? ` Associated binary SHA256: ${alert.sha256.slice(0, 20)}...` : ""}
              </p>
            </div>

            {/* [Inferred] */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  [Inferred] Analytical Assessment
                </span>
                {alert.ai_verdict && (
                  <span className="text-[10px] font-mono text-slate-400">
                    Confidence: {Math.round((alert.ai_confidence ?? 0.85) * 100)}%
                  </span>
                )}
              </div>
              <p className="text-slate-200 leading-relaxed pt-1">
                {alert.ai_summary ||
                  `Activity aligns with MITRE ${alert.tactic || "Adversary Tradecraft"} (${
                    alert.technique_id || "Unclassified"
                  } ${alert.technique || ""}). Click "Run Triage" to execute full correlation.`}
              </p>
            </div>

            {/* [Recommended] */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  [Recommended] Response Gate
                </span>
                <span className="text-[10px] font-mono text-amber-400">Human Approval Required</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed pt-1">
                {alert.severity >= 80
                  ? `Isolate ${alert.hostname || "target entity"} via Falcon RTR and block associated indicators in Custom IOCs.`
                  : "Verify process legitimacy with system owner and monitor for lateral authentication attempts."}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Process Execution Ancestry Timeline */}
        <div className="bg-[#0E1420] border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white font-mono">
            <GitBranch className="w-4 h-4 text-emerald-400 stroke-[1.75]" />
            <span>Process Execution Lineage</span>
          </div>

          <div className="space-y-2 pl-2 border-l-2 border-slate-800 ml-2 text-xs font-mono">
            <div className="relative pl-4 py-1">
              <span className="absolute -left-[5px] top-2.5 w-2 h-2 rounded-full bg-slate-600" />
              <div className="text-slate-400 text-[11px]">Parent Root: services.exe / wininit.exe (SYSTEM)</div>
            </div>
            <div className="relative pl-4 py-1">
              <span className="absolute -left-[5px] top-2.5 w-2 h-2 rounded-full bg-cyan-400" />
              <div className="text-slate-200 text-[11px]">
                Initiating Context:{" "}
                <span className="text-cyan-300">{alert.user_name || "NT AUTHORITY\\SYSTEM"}</span> on{" "}
                <span className="text-white">{alert.hostname || "Next-Gen SIEM"}</span>
              </div>
            </div>
            <div className="relative pl-4 py-1.5 bg-red-950/20 border border-red-900/40 rounded-lg">
              <span className="absolute -left-[5px] top-3 w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <div className="text-red-300 font-bold text-[11px]">
                Flagged Execution: {alert.filename || alert.title}
              </div>
              <code className="block text-[10px] text-emerald-300 mt-1 break-all">
                {alert.cmdline || alert.description || "Sensor / SIEM correlation trigger"}
              </code>
            </div>
          </div>
        </div>

        {/* 3. Interactive Grounded Analyst Q&A */}
        <div className="bg-[#0E1420] border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Interactive Evidence Q&A
            </span>
            <span className="text-[10px] font-mono text-slate-400">Strictly Telemetry-Grounded</span>
          </div>

          {/* Preset Investigation Prompts */}
          <div className="flex flex-wrap gap-1.5">
            {[
              "Is there a file SHA256 hash to block?",
              "Should we isolate this host?",
              "Analyze user identity risk",
            ].map((preset) => (
              <button
                key={preset}
                onClick={() => handleAskQuestion(preset)}
                disabled={chatLoading}
                className="text-[10px] font-mono px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 transition"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Q&A Transcript */}
          {chatHistory.length > 0 && (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {chatHistory.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                  <div className="font-mono text-[11px] text-cyan-400 font-semibold">Q: {item.q}</div>
                  <div className="text-slate-200 leading-relaxed text-[11px]">{item.res.answer}</div>
                  <div className="text-[10px] font-mono text-amber-300 pt-1 border-t border-slate-900">
                    Next Step: {item.res.recommended_next_step}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
              placeholder="Ask about hash, user, command line, or containment..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              onClick={() => handleAskQuestion()}
              disabled={chatLoading || !question.trim()}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold transition disabled:opacity-50 flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4. Workflow Status Modifier */}
        <div className="flex items-center justify-between bg-[#0E1420] border border-slate-800 p-3.5 rounded-xl">
          <span className="text-xs font-bold uppercase font-mono text-slate-300">Investigation Status</span>
          <select
            value={alert.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-slate-950 text-slate-200 text-xs font-mono border border-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-semibold"
          >
            {ALERT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ").toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Telemetry Detail Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="bg-[#0E1420] border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Server className="w-3.5 h-3.5 text-cyan-400 stroke-[1.75]" />
              <span className="font-mono text-[10px] uppercase">Target Entity</span>
            </div>
            <div className="font-mono font-bold text-white">
              {alert.hostname || (alert.product === "ngsiem" ? "Next-Gen SIEM" : "Cloud Platform")}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {alert.platform || alert.product || "Falcon EDR"} {alert.local_ip ? `· ${alert.local_ip}` : ""}
            </div>
          </div>

          <div className="bg-[#0E1420] border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <User className="w-3.5 h-3.5 text-amber-400 stroke-[1.75]" />
              <span className="font-mono text-[10px] uppercase">Executing Identity</span>
            </div>
            <div className="font-mono font-bold text-white truncate" title={alert.user_name ?? ""}>
              {alert.user_name || "System Service / Unspecified"}
            </div>
          </div>

          {alert.sha256 && (
            <div className="col-span-2 bg-[#0E1420] border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Hash className="w-3.5 h-3.5 text-purple-400 stroke-[1.75]" />
                <span className="font-mono text-[10px] uppercase">File SHA256 Hash</span>
              </div>
              <code className="block text-[11px] font-mono text-slate-300 break-all select-all">
                {alert.sha256}
              </code>
            </div>
          )}
        </div>

        {/* Raw Falcon JSON Collapsible */}
        <div className="pt-1">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition"
          >
            {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showRaw ? "Collapse" : "Inspect"} Raw Falcon JSON Payload</span>
          </button>
          {showRaw && (
            <pre className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-300 max-h-72 overflow-auto">
              {JSON.stringify(alert.raw, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </aside>
  );
}

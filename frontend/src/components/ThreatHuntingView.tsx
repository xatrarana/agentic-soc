"use client";

import { useEffect, useState } from "react";
import {
  Crosshair,
  Terminal,
  Play,
  ShieldAlert,
  Hash,
  Server,
  Lock,
  CheckCircle2,
  Search,
  Eye,
} from "lucide-react";
import { HuntQueryResponse, api } from "@/lib/api";

interface ThreatHuntingViewProps {
  onSelectAlert?: (alertId: number) => void;
  onActionQueued?: () => void;
}

const HUNT_TEMPLATES = [
  {
    label: "Brute Force & Auth Anomalies",
    prompt: "Find brute force authentication failures and SIEM login anomalies",
  },
  {
    label: "Malicious Hashes & ML Files",
    prompt: "Hunt machine learning file detections and SHA256 executable hashes",
  },
  {
    label: "Encoded PowerShell & Scripts",
    prompt: "Search encoded powershell and command line script executions",
  },
  {
    label: "Critical & High Severity Signals",
    prompt: "Show all critical and high severity detections across fleet",
  },
];

export function ThreatHuntingView({ onSelectAlert, onActionQueued }: ThreatHuntingViewProps) {
  const [prompt, setPrompt] = useState(HUNT_TEMPLATES[0].prompt);
  const [timeRange, setTimeRange] = useState("24h");
  const [loading, setLoading] = useState(false);
  const [huntResult, setHuntResult] = useState<HuntQueryResponse | null>(null);

  // Custom IOC Prevention state
  const [iocType, setIocType] = useState("sha256");
  const [iocValue, setIocValue] = useState("");
  const [iocReason, setIocReason] = useState("Confirmed malicious indicator during threat hunt");
  const [iocFeedback, setIocFeedback] = useState<string | null>(null);
  const [submittingIoc, setSubmittingIoc] = useState(false);

  const executeHunt = async (customPrompt?: string) => {
    const q = (customPrompt ?? prompt).trim();
    if (!q) return;
    if (customPrompt) setPrompt(customPrompt);
    setLoading(true);
    try {
      const res = await api.runThreatHunt(q, timeRange);
      setHuntResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeHunt(HUNT_TEMPLATES[0].prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePushIoc = async () => {
    if (!iocValue.trim()) return;
    setSubmittingIoc(true);
    setIocFeedback(null);
    try {
      const res = await api.pushCustomIoc(iocType, iocValue.trim(), iocReason);
      setIocFeedback(res.message);
      setIocValue("");
      onActionQueued?.();
    } catch (err) {
      setIocFeedback(`Failed to queue IOC: ${err}`);
    } finally {
      setSubmittingIoc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0E1420] border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Crosshair className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Threat Hunting & Falcon Query Workspace
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Translate natural-language hypotheses into CrowdStrike LogScale / FQL queries and push sensor-level IOC blocks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Lookback:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-cyan-400 rounded-lg px-2.5 py-1 font-semibold focus:outline-none"
          >
            <option value="1h">Last 1 Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Left 8 Cols (NL-to-FQL & Results), Right 4 Cols (Custom IOC Prevention) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-5">
          {/* Query Builder Box */}
          <div className="bg-[#0E1420] border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase font-mono text-white">
                Hypothesis & Query Translator (NL → Falcon CQL)
              </span>
              <span className="text-[10px] font-mono text-cyan-400">Read-Only Telemetry Search</span>
            </div>

            {/* Preset Templates */}
            <div className="flex flex-wrap gap-2">
              {HUNT_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  onClick={() => executeHunt(tpl.prompt)}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition"
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            {/* Prompt Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && executeHunt()}
                  placeholder="Describe threat hypothesis (e.g. 'Find brute force logins or SHA256 hashes on DESKTOP-6AUDB3T')..."
                  className="w-full bg-[#080C14] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <button
                onClick={() => executeHunt()}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-md shadow-cyan-950/50 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{loading ? "Hunting..." : "Execute Hunt"}</span>
              </button>
            </div>

            {/* Generated FQL & Explanation Gate */}
            {huntResult && (
              <div className="p-3.5 rounded-xl bg-[#080C14] border border-slate-800/90 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Generated CrowdStrike LogScale / FQL Syntax</span>
                  </span>
                  <span>{huntResult.total_matches} matching records</span>
                </div>
                <code className="block text-xs font-mono text-emerald-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 select-all">
                  {huntResult.generated_fql}
                </code>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Query Explanation:</strong> {huntResult.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Hunt Results Table */}
          {huntResult && (
            <div className="bg-[#0E1420] border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase font-mono text-white">
                  Telemetry Hunt Results ({huntResult.results.length})
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Click any row to open full evidence drawer or copy indicator
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-mono uppercase text-slate-400">
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Entity / Host</th>
                      <th className="py-3 px-4">Detection Signal</th>
                      <th className="py-3 px-4">MITRE Technique</th>
                      <th className="py-3 px-4">Observed Indicator (SHA256 / Cmd)</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {huntResult.results.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-900/70 transition cursor-pointer"
                        onClick={() => onSelectAlert?.(r.id)}
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.severity >= 90
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : r.severity >= 70
                                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            }`}
                          >
                            SEV {r.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white whitespace-nowrap">{r.hostname}</td>
                        <td className="py-3 px-4 text-slate-200 max-w-[220px] truncate" title={r.title}>
                          {r.title}
                        </td>
                        <td className="py-3 px-4 text-purple-300 text-[11px]">{r.technique}</td>
                        <td
                          className="py-3 px-4 text-emerald-300 text-[11px] max-w-[180px] truncate"
                          title={r.indicator}
                        >
                          {r.indicator}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setIocValue(r.indicator);
                              setIocType(r.indicator.length === 64 ? "sha256" : "domain");
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-slate-700 text-[10px] transition"
                          >
                            Stage IOC
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Cols: CrowdStrike Custom IOC Prevention Pusher */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-[#0E1420] border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Lock className="w-4 h-4 text-red-400 stroke-[1.75]" />
              <div>
                <h3 className="text-xs font-bold uppercase font-mono text-white">
                  Falcon Custom IOC Blocker
                </h3>
                <p className="text-[11px] text-slate-400">
                  Push SHA256, IPv4, or Domain indicators to sensor prevention.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">Indicator Type</label>
                <select
                  value={iocType}
                  onChange={(e) => setIocType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="sha256">SHA256 File Hash (Prevent Execution)</option>
                  <option value="ipv4">IPv4 Address (Network Telemetry Block)</option>
                  <option value="domain">Domain Name (DNS Sinkhole / Detect)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">Indicator Value</label>
                <input
                  type="text"
                  value={iocValue}
                  onChange={(e) => setIocValue(e.target.value)}
                  placeholder="Paste SHA256 hash, IP, or domain..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">Analyst Rationale</label>
                <input
                  type="text"
                  value={iocReason}
                  onChange={(e) => setIocReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {iocFeedback && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/50 text-emerald-200 text-[11px] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{iocFeedback}</span>
                </div>
              )}

              <button
                onClick={handlePushIoc}
                disabled={submittingIoc || !iocValue.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition disabled:opacity-50 shadow-md shadow-red-950/50"
              >
                {submittingIoc ? "Queueing Prevention Rule..." : "Queue Custom IOC Prevention"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


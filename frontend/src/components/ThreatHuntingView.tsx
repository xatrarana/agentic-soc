"use client";

import { useEffect, useState } from "react";
import {
  Crosshair,
  Terminal,
  Play,
  Lock,
  CheckCircle2,
  Search,
} from "lucide-react";
import { HuntQueryResponse, api } from "@/lib/api";

interface ThreatHuntingViewProps {
  onSelectAlert?: (alertId: number) => void;
  onActionQueued?: () => void;
}

const HUNT_TEMPLATES = [
  {
    label: "All Ingested Telemetry",
    prompt: "*",
  },
  {
    label: "Authentication & SIEM",
    prompt: "brute",
  },
  {
    label: "File Hashes & ML",
    prompt: "machine learning",
  },
  {
    label: "High / Critical Severity",
    prompt: "critical",
  },
];

export function ThreatHuntingView({ onSelectAlert, onActionQueued }: ThreatHuntingViewProps) {
  const [prompt, setPrompt] = useState("*");
  const [timeRange, setTimeRange] = useState("24h");
  const [loading, setLoading] = useState(false);
  const [huntResult, setHuntResult] = useState<HuntQueryResponse | null>(null);

  const [iocType, setIocType] = useState("sha256");
  const [iocValue, setIocValue] = useState("");
  const [iocReason, setIocReason] = useState("Blocked via Threat Hunting");
  const [iocFeedback, setIocFeedback] = useState<string | null>(null);
  const [submittingIoc, setSubmittingIoc] = useState(false);

  const executeHunt = async (customPrompt?: string) => {
    const q = (customPrompt ?? prompt).trim() || "*";
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
    executeHunt("*");
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
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Crosshair className="w-4 h-4 text-zinc-400" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Threat Hunting & IOC Blocking
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Search ingested telemetry records and queue custom IOC prevention rules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400">Window:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-md px-2.5 py-1 focus:outline-none"
          >
            <option value="1h">Last 1 Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-3">
            <div className="flex flex-wrap gap-2">
              {HUNT_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  onClick={() => executeHunt(tpl.prompt)}
                  className="text-xs px-2.5 py-1 rounded-md bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && executeHunt()}
                  placeholder="Enter hostname, keyword, technique, or * for all..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <button
                onClick={() => executeHunt()}
                disabled={loading}
                className="px-4 py-2 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{loading ? "Searching..." : "Run Query"}</span>
              </button>
            </div>

            {huntResult && (
              <div className="p-3 rounded-md bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Generated FQL</span>
                  </span>
                  <span className="font-mono">{huntResult.total_matches} matches</span>
                </div>
                <code className="block text-xs font-mono text-zinc-300 bg-zinc-900 p-2 rounded border border-zinc-800 select-all">
                  {huntResult.generated_fql}
                </code>
              </div>
            )}
          </div>

          {huntResult && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-100">
                  Matching Telemetry ({huntResult.results.length})
                </span>
              </div>

              {huntResult.results.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  No matching telemetry records found for this query.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950 text-[11px] font-medium text-zinc-400">
                        <th className="py-2.5 px-4">Severity</th>
                        <th className="py-2.5 px-4">Host / Product</th>
                        <th className="py-2.5 px-4">Title</th>
                        <th className="py-2.5 px-4">Indicator</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80">
                      {huntResult.results.map((r) => (
                        <tr
                          key={r.id}
                          className="hover:bg-zinc-800/50 transition cursor-pointer"
                          onClick={() => onSelectAlert?.(r.id)}
                        >
                          <td className="py-2.5 px-4 whitespace-nowrap font-mono">
                            {r.severity}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-zinc-200 whitespace-nowrap">{r.hostname}</td>
                          <td className="py-2.5 px-4 text-zinc-200 max-w-[240px] truncate">{r.title}</td>
                          <td className="py-2.5 px-4 font-mono text-zinc-400 max-w-[180px] truncate">
                            {r.indicator}
                          </td>
                          <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setIocValue(r.indicator);
                                setIocType(r.indicator.length === 64 ? "sha256" : "domain");
                              }}
                              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[11px] transition"
                            >
                              Stage IOC
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Custom IOC Form */}
        <div className="lg:col-span-4">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Lock className="w-4 h-4 text-zinc-400" />
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Stage Custom IOC Block
                </h3>
                <p className="text-xs text-zinc-400">
                  Queue SHA256, IPv4, or Domain for approval.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Type</label>
                <select
                  value={iocType}
                  onChange={(e) => setIocType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-100 focus:outline-none"
                >
                  <option value="sha256">SHA256 File Hash</option>
                  <option value="ipv4">IPv4 Address</option>
                  <option value="domain">Domain Name</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Indicator Value</label>
                <input
                  type="text"
                  value={iocValue}
                  onChange={(e) => setIocValue(e.target.value)}
                  placeholder="Enter hash, IP, or domain..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Reason</label>
                <input
                  type="text"
                  value={iocReason}
                  onChange={(e) => setIocReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:outline-none"
                />
              </div>

              {iocFeedback && (
                <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{iocFeedback}</span>
                </div>
              )}

              <button
                onClick={handlePushIoc}
                disabled={submittingIoc || !iocValue.trim()}
                className="w-full py-2 px-4 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition disabled:opacity-50"
              >
                {submittingIoc ? "Submitting..." : "Queue IOC for Approval"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

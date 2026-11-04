"use client";

import { useEffect, useState } from "react";
import {
  Sliders,
  ShieldCheck,
  Play,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Activity,
} from "lucide-react";
import { DetectionRuleItem, RuleTestResponse, api } from "@/lib/api";

export function DetectionRulesView() {
  const [rules, setRules] = useState<DetectionRuleItem[]>([]);
  const [selectedRule, setSelectedRule] = useState<DetectionRuleItem | null>(null);
  const [customQuery, setCustomQuery] = useState(
    "#event_simpleName=UserLogonFailed* | groupBy([TargetUserName, RemoteAddressIP4], function=count()) | filter count >= 10"
  );
  const [testResult, setTestResult] = useState<RuleTestResponse | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    api
      .getDetectionRules()
      .then((items) => {
        setRules(items);
        if (items.length > 0) {
          setSelectedRule(items[0]);
          setCustomQuery(items[0].query_logic);
        }
      })
      .catch(console.error);
  }, []);

  const handleSelectRule = (rule: DetectionRuleItem) => {
    setSelectedRule(rule);
    setCustomQuery(rule.query_logic);
    setTestResult(null);
  };

  const handleDryRun = async () => {
    if (!customQuery.trim()) return;
    setTesting(true);
    try {
      const res = await api.testDetectionRule(customQuery);
      setTestResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0E1420] border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Sliders className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Detection Engineering & MITRE ATT&CK Coverage
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Author, tune, and dry-run Next-Gen SIEM correlation rules and Falcon IOA behavioral policies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
            {rules.length} Active Rules Enabled
          </span>
          <span className="px-3 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
            MITRE ATT&CK v15 Aligned
          </span>
        </div>
      </div>

      {/* MITRE ATT&CK Coverage Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {rules.map((r) => (
          <button
            key={r.id}
            onClick={() => handleSelectRule(r)}
            className={`text-left p-3.5 rounded-xl border transition ${
              selectedRule?.id === r.id
                ? "bg-slate-900 border-purple-500/60 shadow-md"
                : "bg-[#0E1420] border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-purple-400 font-bold">{r.mitre_technique_id}</span>
              <span
                className={`px-1.5 py-0.2 rounded font-bold ${
                  r.hit_count > 0
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {r.hit_count} hits
              </span>
            </div>
            <div className="text-xs font-bold text-white mt-1.5 truncate" title={r.mitre_technique}>
              {r.mitre_technique}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.mitre_tactic}</div>
          </button>
        ))}
      </div>

      {/* Main 2-Column Workspace: Left (Rules Catalog), Right (Rule Logic & Dry-Run Harness) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Detection Catalog */}
        <div className="lg:col-span-7 bg-[#0E1420] border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase font-mono text-white">
              Active Detection Rule Catalog
            </span>
            <span className="text-[11px] font-mono text-slate-400">Click rule to inspect & dry-run</span>
          </div>

          <div className="divide-y divide-slate-800/70">
            {rules.map((r) => {
              const isSelected = selectedRule?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelectRule(r)}
                  className={`p-4 cursor-pointer transition ${
                    isSelected ? "bg-slate-900/90" : "hover:bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50 font-bold">
                          {r.id}
                        </span>
                        <h3 className="text-xs font-bold text-white font-mono">{r.name}</h3>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-3 font-mono">
                        <span>Source: {r.source}</span>
                        <span>•</span>
                        <span className="text-cyan-400">
                          {r.mitre_tactic} ({r.mitre_technique_id})
                        </span>
                        <span>•</span>
                        <span>FP Rate: {r.false_positive_rate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          r.hit_count > 0
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {r.hit_count} Live Hits
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                        {r.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Rule Query Editor & Historical Dry-Run Test Harness */}
        <div className="lg:col-span-5 bg-[#0E1420] border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase font-mono text-white">
                Rule Dry-Run & Validation Harness
              </h3>
            </div>
            {selectedRule && (
              <span className="text-[10px] font-mono text-purple-400 font-bold">{selectedRule.id}</span>
            )}
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="block text-[10px] uppercase text-slate-400 mb-1.5">
                Correlation Query Logic (LogScale / FQL)
              </label>
              <textarea
                rows={4}
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                className="w-full bg-[#080C14] border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={handleDryRun}
              disabled={testing}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{testing ? "Evaluating Telemetry..." : "Dry-Run Rule Against Live Telemetry"}</span>
            </button>

            {testResult && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white">Dry-Run Backtest Result</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                    {testResult.matched_count} / {testResult.evaluated_events} Matched
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{testResult.assessment}</p>
                {testResult.matches.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase">Matched Tenant Detections:</div>
                    {testResult.matches.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-[11px] bg-[#0E1420] px-2.5 py-1.5 rounded border border-slate-800"
                      >
                        <span className="text-white truncate max-w-[200px]">
                          #{m.id} {m.title}
                        </span>
                        <span className="text-amber-400">{m.hostname}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


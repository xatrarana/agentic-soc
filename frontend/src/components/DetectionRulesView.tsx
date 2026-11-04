"use client";

import { useEffect, useState } from "react";
import { Sliders, Play, Terminal } from "lucide-react";
import { DetectionRuleItem, RuleTestResponse, api } from "@/lib/api";

export function DetectionRulesView() {
  const [rules, setRules] = useState<DetectionRuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<DetectionRuleItem | null>(null);
  const [customQuery, setCustomQuery] = useState("");
  const [testResult, setTestResult] = useState<RuleTestResponse | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getDetectionRules()
      .then((items) => {
        setRules(items);
        if (items.length > 0) {
          setSelectedRule(items[0]);
          setCustomQuery(items[0].query_logic);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
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
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-zinc-400" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Detection Rules
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Detection rules grouped directly from ingested CrowdStrike Falcon alerts.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
          {rules.length} {rules.length === 1 ? "Rule" : "Rules"} Observed
        </span>
      </div>

      {loading ? (
        <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-lg text-center text-xs text-zinc-400">
          Loading detection rules...
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-lg text-center text-xs text-zinc-500">
          No detection rules observed in database yet. Sync telemetry from CrowdStrike Falcon to populate rules.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Observed Rules List */}
          <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-100">
                Observed Detection Rules ({rules.length})
              </span>
            </div>

            <div className="divide-y divide-zinc-800/80">
              {rules.map((r) => {
                const isSelected = selectedRule?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRule(r)}
                    className={`p-4 cursor-pointer transition ${
                      isSelected ? "bg-zinc-800/80" : "hover:bg-zinc-800/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {r.id}
                          </span>
                          <h3 className="text-xs font-semibold text-zinc-100">{r.name}</h3>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-3">
                          <span>Source: {r.source}</span>
                          <span>·</span>
                          <span>
                            Tactic: {r.mitre_tactic} ({r.mitre_technique_id})
                          </span>
                          <span>·</span>
                          <span>{r.false_positive_rate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                          {r.hit_count} {r.hit_count === 1 ? "hit" : "hits"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Dry-Run Test Harness */}
          <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Rule Backtest against Database
                </h3>
              </div>
              {selectedRule && (
                <span className="text-xs font-mono text-zinc-400">{selectedRule.id}</span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1.5">
                  Query Expression
                </label>
                <textarea
                  rows={4}
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <button
                onClick={handleDryRun}
                disabled={testing}
                className="w-full py-2 px-4 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{testing ? "Evaluating..." : "Test Against Stored Alerts"}</span>
              </button>

              {testResult && (
                <div className="p-3 rounded-md bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200">Backtest Result</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-200">
                      {testResult.matched_count} / {testResult.evaluated_events} matched
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{testResult.assessment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

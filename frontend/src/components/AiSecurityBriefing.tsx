"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import { BriefingResponse, api } from "@/lib/api";

interface BriefingProps {
  refreshKey: number;
  onSelectAlert: (alertId: number) => void;
}

export function AiSecurityBriefing({ refreshKey, onSelectAlert }: BriefingProps) {
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBriefing = () => {
    setLoading(true);
    api
      .getBriefing()
      .then(setBriefing)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBriefing();
  }, [refreshKey]);

  if (!briefing && loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex items-center justify-center min-h-[260px]">
        <div className="text-xs text-zinc-400 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
          <span>Loading security summary...</span>
        </div>
      </div>
    );
  }

  if (!briefing) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-100">Security Summary</h3>
          </div>

          <button
            onClick={fetchBriefing}
            disabled={loading}
            className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition disabled:opacity-50"
            title="Refresh summary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Summary Text */}
        <div className="mt-4 space-y-3">
          <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-3 rounded-md border border-zinc-800">
            {briefing.executive_summary}
          </p>

          {/* Findings */}
          {briefing.key_findings.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-zinc-400">Active Detections</div>
              {briefing.key_findings.map((f, i) => (
                <div
                  key={i}
                  className="text-xs text-zinc-300 bg-zinc-950 p-2 rounded border border-zinc-800 leading-snug"
                >
                  {f}
                </div>
              ))}
            </div>
          )}

          {/* Citations */}
          {briefing.citations.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-xs font-medium text-zinc-400">
                Alert References ({briefing.citations.length})
              </div>
              <div className="space-y-1">
                {briefing.citations.map((c) => (
                  <button
                    key={c.alert_id}
                    onClick={() => onSelectAlert(c.alert_id)}
                    className="w-full text-left p-2 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 transition flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                        #{c.alert_id}
                      </span>
                      <span className="text-zinc-200 group-hover:text-white truncate">
                        {c.title}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-200 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Next Step */}
      <div className="p-3 rounded-md bg-zinc-950 border border-zinc-800 text-xs space-y-1">
        <div className="text-[11px] font-medium text-zinc-400">Recommended Action</div>
        <p className="text-zinc-300 leading-relaxed">{briefing.recommended_focus}</p>
      </div>
    </div>
  );
}

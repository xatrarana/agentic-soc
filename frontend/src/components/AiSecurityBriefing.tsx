"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, ArrowRight, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
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
      <div className="bg-[#0E1420] border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-center min-h-[300px]">
        <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Synthesizing live security briefing...</span>
        </div>
      </div>
    );
  }

  if (!briefing) return null;

  const isElevated = briefing.threat_level === "Elevated" || briefing.threat_level === "High" || briefing.threat_level === "Critical";

  return (
    <div className="bg-[#0E1420] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-4 h-4 stroke-[1.75]" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Security Briefing</h3>
            <p className="text-[10px] text-slate-400 font-mono">{briefing.source_summary} · {briefing.time_window}</p>
          </div>
        </div>

        <button
          onClick={fetchBriefing}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50"
          title="Refresh briefing"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Threat Posture Meter */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-semibold text-slate-500 font-mono">Environment Threat Level</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`text-sm font-bold tracking-tight uppercase font-mono ${
                isElevated ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {briefing.threat_level}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">({briefing.threat_score}/100 Posture)</span>
          </div>
        </div>

        <div className="w-24 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 ${
              isElevated ? "bg-amber-500 w-[65%]" : "bg-emerald-500 w-[95%]"
            }`}
          />
        </div>
      </div>

      {/* Narrative Synthesis */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
          Executive Synthesis
        </div>
        <p className="text-xs text-slate-200 leading-relaxed bg-[#0A0E17] p-3 rounded-xl border border-slate-800/70">
          {briefing.executive_summary}
        </p>
      </div>

      {/* Key Findings */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
          Observed Findings
        </div>
        <div className="space-y-1.5">
          {briefing.key_findings.map((f, i) => (
            <div
              key={i}
              className="text-xs text-slate-300 bg-[#0A0E17] p-2.5 rounded-lg border border-slate-800/60 flex items-start gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
              <span className="leading-snug">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Citations (Grounding) */}
      {briefing.citations.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
            <span>Evidence Citations ({briefing.citations.length})</span>
            <span className="text-slate-500">Click to inspect</span>
          </div>
          <div className="space-y-1">
            {briefing.citations.map((c) => (
              <button
                key={c.alert_id}
                onClick={() => onSelectAlert(c.alert_id)}
                className="w-full text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 transition flex items-center justify-between text-xs group"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${
                      c.severity >= 90
                        ? "bg-red-500/20 text-red-400"
                        : c.severity >= 70
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    #{c.alert_id}
                  </span>
                  <span className="text-slate-200 group-hover:text-cyan-300 transition truncate font-medium">
                    {c.title}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 transition" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Focus */}
      <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs space-y-1">
        <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider font-mono">
          Recommended Analyst Priority
        </div>
        <p className="text-[11px] text-cyan-200/90 leading-relaxed font-sans">
          {briefing.recommended_focus}
        </p>
      </div>
    </div>
  );
}


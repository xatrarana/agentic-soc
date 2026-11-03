"use client";

import { Activity, TrendingUp } from "lucide-react";
import { Stats } from "@/lib/api";

export function ThreatActivityChart({ stats }: { stats: Stats | null }) {
  const total = stats?.total_alerts || 0;

  // Derive normalized bars for severity distribution
  const sevMap = (stats?.by_severity || []).reduce((acc, s) => {
    acc[s.key] = s.count;
    return acc;
  }, {} as Record<string, number>);

  const critical = sevMap["Critical"] || 0;
  const high = sevMap["High"] || 0;
  const medium = sevMap["Medium"] || 0;
  const low = sevMap["Low"] || 0;
  const info = sevMap["Informational"] || 0;

  return (
    <div className="bg-[#0E1420] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-4 h-4 stroke-[1.75]" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Threat Activity Volume</h3>
            <p className="text-[10px] text-slate-400 font-mono">Real-time telemetry distribution across monitored attack surface</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400">
          <TrendingUp className="w-3 h-3 text-cyan-400" />
          <span>Last 24 Hours</span>
        </div>
      </div>

      {/* Visual Volume Curve / Simulated Time distribution */}
      <div className="h-32 w-full bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden">
        {/* SVG Curve */}
        <div className="absolute inset-0 pt-4 px-2 opacity-80 pointer-events-none">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Area */}
            <path
              d="M0,35 Q15,30 30,18 T60,22 T85,8 T100,25 L100,40 L0,40 Z"
              fill="url(#curveGradient)"
            />
            {/* Stroke */}
            <path
              d="M0,35 Q15,30 30,18 T60,22 T85,8 T100,25"
              fill="none"
              stroke="#22D3EE"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Floating Metrics */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 z-10">
          <span>Active Ingestion Stream</span>
          <span className="text-cyan-400 font-semibold">{total} Events Processed</span>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 z-10">
          <span>T-24h</span>
          <span>T-12h</span>
          <span>T-6h</span>
          <span>T-1h</span>
          <span className="text-cyan-400">Now</span>
        </div>
      </div>

      {/* Stacked Severity Distribution Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-slate-400 uppercase">
          <span>Distribution by Severity Tier</span>
          <span>{total} Total Detections</span>
        </div>

        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
          {total > 0 ? (
            <>
              <div style={{ width: `${(critical / total) * 100}%` }} className="bg-red-500 transition-all" title={`Critical: ${critical}`} />
              <div style={{ width: `${(high / total) * 100}%` }} className="bg-orange-500 transition-all" title={`High: ${high}`} />
              <div style={{ width: `${(medium / total) * 100}%` }} className="bg-amber-500 transition-all" title={`Medium: ${medium}`} />
              <div style={{ width: `${(low / total) * 100}%` }} className="bg-blue-500 transition-all" title={`Low: ${low}`} />
              <div style={{ width: `${(info / total) * 100}%` }} className="bg-slate-600 transition-all" title={`Info: ${info}`} />
            </>
          ) : (
            <div className="w-full bg-slate-800" />
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Critical ({critical})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            High ({high})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Medium ({medium})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Low ({low})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            Info ({info})
          </span>
        </div>
      </div>
    </div>
  );
}


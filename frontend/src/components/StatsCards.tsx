"use client";

import { AlertOctagon, Flame, Monitor, ShieldAlert, Layers } from "lucide-react";
import { Stats } from "@/lib/api";

const SEV_COLORS: Record<string, string> = {
  Critical: "bg-red-500/20 text-red-400 border border-red-500/30",
  High: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  Medium: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  Low: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Informational: "bg-slate-700/30 text-slate-400 border border-slate-700/50",
};

export function StatsCards({ stats }: { stats: Stats | null }) {
  if (!stats) return null;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-6 font-sans">
      {/* Active Detections */}
      <div className="bg-[#0E1420] border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-md">
        <div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">{stats.open_alerts}</div>
          <div className="text-xs text-slate-400 font-medium mt-0.5">Active Detections</div>
        </div>
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <Flame className="w-5 h-5 stroke-[1.75]" />
        </div>
      </div>

      {/* Total Telemetry */}
      <div className="bg-[#0E1420] border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-md">
        <div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">{stats.total_alerts}</div>
          <div className="text-xs text-slate-400 font-medium mt-0.5">Total Ingested</div>
        </div>
        <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <AlertOctagon className="w-5 h-5 stroke-[1.75]" />
        </div>
      </div>

      {/* Correlated Incidents */}
      <div className="bg-[#0E1420] border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-md">
        <div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">{stats.total_incidents}</div>
          <div className="text-xs text-slate-400 font-medium mt-0.5">Correlated Incidents</div>
        </div>
        <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
          <ShieldAlert className="w-5 h-5 stroke-[1.75]" />
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="bg-[#0E1420] border border-slate-800 p-3.5 rounded-xl shadow-md">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Severity Breakdown
        </div>
        <div className="space-y-1">
          {stats.by_severity.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-xs">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  SEV_COLORS[s.key] ?? "bg-slate-800 text-slate-200"
                }`}
              >
                {s.key}
              </span>
              <span className="font-mono font-medium text-slate-300">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Endpoints */}
      <div className="bg-[#0E1420] border border-slate-800 p-3.5 rounded-xl shadow-md">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5 text-slate-400 stroke-[1.75]" />
          <span>Top Endpoints</span>
        </div>
        <div className="space-y-1">
          {stats.top_hosts.slice(0, 4).map((h) => (
            <div key={h.key} className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-300 truncate max-w-[100px]" title={h.key}>
                {h.key || "Platform"}
              </span>
              <span className="font-semibold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[10px] font-mono">
                {h.count}
              </span>
            </div>
          ))}
          {stats.top_hosts.length === 0 && <span className="text-xs text-slate-500">None observed</span>}
        </div>
      </div>

      {/* Top MITRE Techniques */}
      <div className="bg-[#0E1420] border border-slate-800 p-3.5 rounded-xl shadow-md">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-400 stroke-[1.75]" />
          <span>Techniques</span>
        </div>
        <div className="space-y-1">
          {stats.top_techniques.slice(0, 4).map((t) => (
            <div key={t.key} className="flex items-center justify-between text-xs">
              <span className="text-slate-300 truncate max-w-[110px] font-mono" title={t.key}>
                {t.key}
              </span>
              <span className="font-semibold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[10px] font-mono">
                {t.count}
              </span>
            </div>
          ))}
          {stats.top_techniques.length === 0 && (
            <span className="text-xs text-slate-500">None observed</span>
          )}
        </div>
      </div>
    </section>
  );
}

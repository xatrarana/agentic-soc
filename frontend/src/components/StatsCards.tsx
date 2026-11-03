"use client";

import { AlertOctagon, Flame, Monitor, ShieldAlert } from "lucide-react";
import { Stats } from "@/lib/api";

const SEV_COLORS: Record<string, string> = {
  Critical: "bg-sev-critical text-white",
  High: "bg-sev-high text-white",
  Medium: "bg-sev-medium text-black font-semibold",
  Low: "bg-sev-low text-white",
  Informational: "bg-sev-info text-white",
};

export function StatsCards({ stats }: { stats: Stats | null }) {
  if (!stats) return null;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
      {/* Open Alerts Tile */}
      <div className="bg-surface border border-border-subtle p-4 rounded-xl flex items-center justify-between shadow-sm">
        <div>
          <div className="text-2xl font-bold text-white tracking-tight">{stats.open_alerts}</div>
          <div className="text-xs text-gray-400 font-medium">Open Alerts</div>
        </div>
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Flame className="w-5 h-5" />
        </div>
      </div>

      {/* Total Alerts Tile */}
      <div className="bg-surface border border-border-subtle p-4 rounded-xl flex items-center justify-between shadow-sm">
        <div>
          <div className="text-2xl font-bold text-white tracking-tight">{stats.total_alerts}</div>
          <div className="text-xs text-gray-400 font-medium">Total Alerts</div>
        </div>
        <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <AlertOctagon className="w-5 h-5" />
        </div>
      </div>

      {/* Incidents Tile */}
      <div className="bg-surface border border-border-subtle p-4 rounded-xl flex items-center justify-between shadow-sm">
        <div>
          <div className="text-2xl font-bold text-white tracking-tight">{stats.total_incidents}</div>
          <div className="text-xs text-gray-400 font-medium">Correlated Incidents</div>
        </div>
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="bg-surface border border-border-subtle p-3.5 rounded-xl shadow-sm">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Severity Breakdown
        </div>
        <div className="space-y-1">
          {stats.by_severity.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-xs">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  SEV_COLORS[s.key] ?? "bg-gray-700 text-gray-200"
                }`}
              >
                {s.key}
              </span>
              <span className="font-mono font-medium text-gray-300">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Affected Hosts */}
      <div className="bg-surface border border-border-subtle p-3.5 rounded-xl shadow-sm">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5 text-gray-400" />
          <span>Top Hosts</span>
        </div>
        <div className="space-y-1">
          {stats.top_hosts.slice(0, 4).map((h) => (
            <div key={h.key} className="flex items-center justify-between text-xs">
              <span className="font-mono text-gray-300 truncate max-w-[100px]" title={h.key}>
                {h.key}
              </span>
              <span className="font-semibold text-gray-400 bg-canvas px-1.5 py-0.5 rounded border border-border-subtle/50 text-[10px]">
                {h.count}
              </span>
            </div>
          ))}
          {stats.top_hosts.length === 0 && <span className="text-xs text-gray-500">None yet</span>}
        </div>
      </div>

      {/* Top MITRE Techniques */}
      <div className="bg-surface border border-border-subtle p-3.5 rounded-xl shadow-sm">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Top MITRE Techniques
        </div>
        <div className="space-y-1">
          {stats.top_techniques.slice(0, 4).map((t) => (
            <div key={t.key} className="flex items-center justify-between text-xs">
              <span className="text-gray-300 truncate max-w-[110px]" title={t.key}>
                {t.key}
              </span>
              <span className="font-semibold text-gray-400 bg-canvas px-1.5 py-0.5 rounded border border-border-subtle/50 text-[10px]">
                {t.count}
              </span>
            </div>
          ))}
          {stats.top_techniques.length === 0 && (
            <span className="text-xs text-gray-500">None yet</span>
          )}
        </div>
      </div>
    </section>
  );
}


"use client";

import { Activity } from "lucide-react";
import { Stats } from "@/lib/api";

export function ThreatActivityChart({ stats }: { stats: Stats | null }) {
  const total = stats?.total_alerts || 0;

  const sevMap = (stats?.by_severity || []).reduce((acc, s) => {
    acc[s.key] = s.count;
    return acc;
  }, {} as Record<string, number>);

  const critical = sevMap["Critical"] || 0;
  const high = sevMap["High"] || 0;
  const medium = sevMap["Medium"] || 0;
  const low = sevMap["Low"] || 0;
  const info = sevMap["Informational"] || 0;

  const topHosts = stats?.top_hosts || [];
  const topTechniques = stats?.top_techniques || [];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Severity & Host Breakdown</h3>
        </div>
        <span className="text-xs font-mono text-zinc-400">{total} total alerts</span>
      </div>

      {total === 0 ? (
        <div className="p-8 rounded-md bg-zinc-950 border border-zinc-800 text-center text-xs text-zinc-500">
          No telemetry data available
        </div>
      ) : (
        <div className="space-y-4">
          {/* Real Severity Distribution */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-zinc-400">Distribution by Severity</div>
            <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800">
              <div style={{ width: `${(critical / total) * 100}%` }} className="bg-red-500" />
              <div style={{ width: `${(high / total) * 100}%` }} className="bg-orange-500" />
              <div style={{ width: `${(medium / total) * 100}%` }} className="bg-amber-500" />
              <div style={{ width: `${(low / total) * 100}%` }} className="bg-blue-500" />
              <div style={{ width: `${(info / total) * 100}%` }} className="bg-zinc-600" />
            </div>

            <div className="grid grid-cols-5 gap-1.5 text-[11px] pt-1 text-zinc-400 font-mono">
              <div>Crit: {critical}</div>
              <div>High: {high}</div>
              <div>Med: {medium}</div>
              <div>Low: {low}</div>
              <div>Info: {info}</div>
            </div>
          </div>

          {/* Real Top Hosts */}
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-zinc-400">Top Hosts by Alert Count</div>
            {topHosts.length === 0 ? (
              <div className="text-xs text-zinc-500">No hostnames recorded</div>
            ) : (
              <div className="space-y-1.5">
                {topHosts.map((h) => (
                  <div
                    key={h.key}
                    className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                  >
                    <span className="text-zinc-200 truncate">{h.key}</span>
                    <span className="text-zinc-400">{h.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real Top Techniques */}
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-zinc-400">Top MITRE Techniques</div>
            {topTechniques.length === 0 ? (
              <div className="text-xs text-zinc-500">No MITRE techniques recorded</div>
            ) : (
              <div className="space-y-1.5">
                {topTechniques.map((t) => (
                  <div
                    key={t.key}
                    className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                  >
                    <span className="text-zinc-200 truncate">{t.key}</span>
                    <span className="text-zinc-400">{t.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

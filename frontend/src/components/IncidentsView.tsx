"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Incident, api } from "@/lib/api";

export function IncidentsView({ refreshKey }: { refreshKey: number }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getIncidents()
      .then((res) => setIncidents(res.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <div className="space-y-4">
      <div className="bg-[#0E1420] border border-slate-800 p-3 rounded-xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400 stroke-[1.75]" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            CrowdStrike Multi-Host Correlated Incidents
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">{incidents.length} incidents</span>
      </div>

      <div className="bg-[#0E1420] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Event Window</th>
                <th className="py-3 px-3">Score</th>
                <th className="py-3 px-4">Incident Name</th>
                <th className="py-3 px-3">Affected Endpoints</th>
                <th className="py-3 px-3">Tactics Observed</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {incidents.map((i) => (
                <tr key={i.id} className="hover:bg-slate-850 transition">
                  <td className="py-3.5 px-4 text-slate-400 font-mono whitespace-nowrap">
                    {i.modified_at ? new Date(i.modified_at).toLocaleString() : "Real-time"}
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="font-bold text-red-400 font-mono bg-red-950/60 px-2 py-0.5 rounded border border-red-800 text-[11px]">
                      {(i.fine_score / 10).toFixed(1)} / 10
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-100">{i.name}</div>
                    {i.description && (
                      <div className="text-[11px] text-slate-400 mt-0.5">{i.description}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-300">
                    {i.hostnames.join(", ") || "General Platform"}
                  </td>
                  <td className="py-3.5 px-3 text-cyan-300">
                    {i.tactics.join(", ") || "Uncategorized"}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-300">
                    {i.falcon_status || i.state || "Active"}
                  </td>
                </tr>
              ))}
              {incidents.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No multi-host correlated incidents in the active lookback window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

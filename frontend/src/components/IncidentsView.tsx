"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Server, Activity } from "lucide-react";
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
      <div className="bg-surface border border-border-subtle p-3 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            CrowdStrike Correlated Incidents
          </h2>
        </div>
        <span className="text-xs text-gray-400 font-mono">{incidents.length} incidents</span>
      </div>

      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas/60 border-b border-border-subtle text-gray-400 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Modified</th>
                <th className="py-3 px-3">Score</th>
                <th className="py-3 px-4">Incident Name</th>
                <th className="py-3 px-3">Affected Endpoints</th>
                <th className="py-3 px-3">Observed Tactics</th>
                <th className="py-3 px-4">Falcon Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {incidents.map((i) => (
                <tr key={i.id} className="hover:bg-surface-hover/70 transition">
                  <td className="py-3 px-4 text-gray-400 font-mono whitespace-nowrap">
                    {i.modified_at ? new Date(i.modified_at).toLocaleString() : "—"}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-bold text-red-400 font-mono bg-red-950/60 px-2 py-0.5 rounded border border-red-800 text-[11px]">
                      {(i.fine_score / 10).toFixed(1)} / 10
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-100">{i.name}</div>
                    {i.description && (
                      <div className="text-[11px] text-gray-400">{i.description}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-gray-300">
                    {i.hostnames.join(", ") || "—"}
                  </td>
                  <td className="py-3 px-3 text-cyan-300">
                    {i.tactics.join(", ") || "—"}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-medium text-gray-300">
                    {i.falcon_status || i.state || "—"}
                  </td>
                </tr>
              ))}
              {incidents.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No multi-host correlated incidents in the current lookback window.
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


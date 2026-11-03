"use client";

import { useEffect, useState } from "react";
import { ScrollText, ShieldCheck } from "lucide-react";
import { AuditEntry, api } from "@/lib/api";

export function AuditLogView({ refreshKey }: { refreshKey: number }) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getAuditLog(100)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border-subtle p-3 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            Immutable Audit Trail & Governance Ledger
          </h2>
        </div>
        <span className="text-xs text-gray-400 font-mono">{logs.length} logged events</span>
      </div>

      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas/60 border-b border-border-subtle text-gray-400 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Actor</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-3">Target</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-surface-hover/70 transition">
                  <td className="py-3 px-4 text-gray-400 font-mono whitespace-nowrap">
                    {new Date(l.ts).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-purple-300 whitespace-nowrap">
                    {l.actor}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-cyan-300">
                    {l.event}
                  </td>
                  <td className="py-3 px-3 font-mono text-gray-400 whitespace-nowrap">
                    {l.target_type && `${l.target_type} #${l.target_id || ""}`}
                  </td>
                  <td className="py-3 px-4 text-gray-300 font-mono text-[11px] break-all max-w-md">
                    {JSON.stringify(l.details)}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Audit log is empty.
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


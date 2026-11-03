"use client";

import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
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
      <div className="bg-[#0E1420] border border-slate-800 p-3 rounded-xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-emerald-400 stroke-[1.75]" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            Immutable Audit & Compliance Ledger
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">{logs.length} logged events</span>
      </div>

      <div className="bg-[#0E1420] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-3">Actor</th>
                <th className="py-3 px-4">Event Operation</th>
                <th className="py-3 px-3">Target Entity</th>
                <th className="py-3 px-4">Payload Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-850 transition">
                  <td className="py-3.5 px-4 text-slate-400 font-mono whitespace-nowrap">
                    {new Date(l.ts).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 font-mono font-medium text-purple-300 whitespace-nowrap">
                    {l.actor}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-cyan-300">
                    {l.event}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                    {l.target_type ? `${l.target_type} #${l.target_id || ""}` : "System"}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px] break-all max-w-md">
                    {JSON.stringify(l.details)}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Audit ledger is currently empty.
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

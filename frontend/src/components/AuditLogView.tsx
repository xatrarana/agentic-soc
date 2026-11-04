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
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-100">
            Audit Log
          </h2>
        </div>
        <span className="text-xs text-zinc-400 font-mono">{logs.length} events</span>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-medium text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-4">Event</th>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-zinc-800/40 transition">
                  <td className="py-2.5 px-4 text-zinc-400 font-mono whitespace-nowrap">
                    {new Date(l.ts).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-200 whitespace-nowrap">
                    {l.actor}
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap font-mono text-zinc-300">
                    {l.event}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-400 whitespace-nowrap">
                    {l.target_type ? `${l.target_type} #${l.target_id || ""}` : "System"}
                  </td>
                  <td className="py-2.5 px-4 text-zinc-400 font-mono text-[11px] break-all max-w-md">
                    {JSON.stringify(l.details)}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
                    No audit log entries recorded.
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

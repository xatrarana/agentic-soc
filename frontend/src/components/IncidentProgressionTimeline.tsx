"use client";

import { useEffect, useState } from "react";
import { Clock, Lock } from "lucide-react";
import { Action, Case, Stats, api } from "@/lib/api";

interface IncidentProgressionTimelineProps {
  stats?: Stats | null;
  refreshKey?: number;
  onAuthorizeAction?: () => void;
}

export function IncidentProgressionTimeline({
  stats,
  refreshKey = 0,
  onAuthorizeAction,
}: IncidentProgressionTimelineProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [pendingActions, setPendingActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getCases().catch(() => []),
      api.getActions("pending_approval").catch(() => []),
    ])
      .then(([c, a]) => {
        setCases(c);
        setPendingActions(a);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const byStatus = stats?.by_status || [];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-100">
            Workflow Status & Cases
          </h3>
        </div>
        <span className="text-xs text-zinc-400 font-mono">
          {cases.length} {cases.length === 1 ? "case" : "cases"}
        </span>
      </div>

      {/* Real Alert Workflow Breakdown */}
      <div className="my-4 space-y-3">
        <div className="text-xs font-medium text-zinc-400">Alerts by Workflow Stage</div>
        {byStatus.length === 0 ? (
          <div className="p-4 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-500 text-center">
            No workflow status data available
          </div>
        ) : (
          <div className="space-y-2">
            {byStatus.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-xs"
              >
                <span className="text-zinc-200 font-medium capitalize">
                  {item.key.replace("_", " ")}
                </span>
                <span className="font-mono font-semibold text-zinc-100">{item.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Active Cases Summary */}
        <div className="pt-2">
          <div className="text-xs font-medium text-zinc-400 mb-2">Recent Correlated Cases</div>
          {loading ? (
            <div className="text-xs text-zinc-500">Loading cases...</div>
          ) : cases.length === 0 ? (
            <div className="p-3 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-500 text-center">
              No correlated cases recorded yet
            </div>
          ) : (
            <div className="space-y-2">
              {cases.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-zinc-400 mr-1.5">CASE-{c.id}</span>
                    <span className="text-zinc-200 font-medium truncate">{c.title}</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 shrink-0">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Real Pending Response Actions */}
      <div className="pt-3 border-t border-zinc-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">Pending Approvals:</span>
          <span className="font-mono font-semibold text-zinc-200">
            {pendingActions.length} {pendingActions.length === 1 ? "action" : "actions"}
          </span>
        </div>
        {pendingActions.length > 0 && onAuthorizeAction && (
          <button
            onClick={onAuthorizeAction}
            className="w-full py-2 px-3 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Review Pending Actions ({pendingActions.length})</span>
          </button>
        )}
      </div>
    </div>
  );
}

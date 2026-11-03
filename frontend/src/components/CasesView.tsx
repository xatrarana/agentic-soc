"use client";

import { useEffect, useState } from "react";
import { FolderGit2, Bot, Shield, ChevronRight } from "lucide-react";
import { Case, api } from "@/lib/api";

export function CasesView({ refreshKey }: { refreshKey: number }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getCases()
      .then(setCases)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border-subtle p-3 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            Investigative Cases & Aggregations
          </h2>
        </div>
        <span className="text-xs text-gray-400 font-mono">{cases.length} cases</span>
      </div>

      <div className="space-y-3">
        {cases.map((c) => (
          <div
            key={c.id}
            className="bg-surface border border-border-subtle p-4 rounded-xl hover:border-purple-800/50 transition shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-purple-400 font-semibold">
                    CASE-#{c.id}
                  </span>
                  <h3 className="font-bold text-sm text-white">{c.title}</h3>
                </div>
                {c.summary && <p className="text-xs text-gray-300 leading-relaxed">{c.summary}</p>}
              </div>

              <div className="flex items-center gap-2">
                {c.verdict && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      c.verdict === "true_positive"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : c.verdict === "false_positive"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {c.verdict.replace("_", " ")}
                  </span>
                )}
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                  {c.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Associated Alerts & Actions Counters */}
            <div className="flex items-center gap-4 text-xs font-mono text-gray-400 pt-2 border-t border-border-subtle/50">
              <span>{c.alerts?.length ?? 0} Associated Alerts</span>
              <span>•</span>
              <span>{c.actions?.length ?? 0} Response Actions</span>
              <span>•</span>
              <span>Updated: {new Date(c.updated_at).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}

        {cases.length === 0 && !loading && (
          <div className="bg-surface border border-border-subtle p-8 rounded-xl text-center text-gray-400 text-xs">
            No investigative cases formed yet. Triage an alert to generate a case automatically.
          </div>
        )}
      </div>
    </div>
  );
}


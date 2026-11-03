"use client";

import { useEffect, useState } from "react";
import { FolderGit2, ShieldAlert, ChevronRight, Activity, ArrowUpRight, Radio } from "lucide-react";
import { Case, api } from "@/lib/api";
import { NetworkTopology } from "./NetworkTopology";
import { IncidentProgressionTimeline } from "./IncidentProgressionTimeline";

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
    <div className="space-y-6">
      {/* Incidents Management Header (Directly from Image 1) */}
      <div className="bg-[#0E1420] border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-purple-400 stroke-[1.75]" />
            <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
              Incidents Management & Attack Vectors
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor, investigate, prioritize, and resolve correlated adversary activity across endpoints and SIEM events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-purple-950/40 text-purple-300 border border-purple-800/50">
            {cases.length} Correlated Cases Active
          </span>
        </div>
      </div>

      {/* Centerpiece: Interactive Attack Path Topology & Incident Progression (Matching Image 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <NetworkTopology />
        </div>
        <div className="lg:col-span-4">
          <IncidentProgressionTimeline incidentId={cases[0] ? `CASE-${cases[0].id}` : "INC-2847"} />
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span className="font-bold text-white uppercase">Correlated Incident Ledger</span>
          <span>{cases.length} items</span>
        </div>

        {cases.map((c) => (
          <div
            key={c.id}
            className="bg-[#0E1420] border border-slate-800 p-4 rounded-xl hover:border-purple-800/50 transition shadow-md space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-purple-400 font-semibold bg-purple-950/40 px-2 py-0.5 rounded border border-purple-900/60">
                    CASE-{c.id}
                  </span>
                  <h3 className="font-bold text-sm text-white">{c.title}</h3>
                </div>
                {c.summary && <p className="text-xs text-slate-300 leading-relaxed font-sans mt-1">{c.summary}</p>}
              </div>

              <div className="flex items-center gap-2">
                {c.verdict && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                      c.verdict === "true_positive"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : c.verdict === "false_positive"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {c.verdict === "true_positive"
                      ? "Confirmed Threat"
                      : c.verdict === "false_positive"
                      ? "Benign Activity"
                      : "Review Required"}
                  </span>
                )}
                <span className="text-xs font-semibold font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase tracking-wider">
                  {c.status}
                </span>
              </div>
            </div>

            {/* Associated Alerts & Actions Counters */}
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/80">
              <span>{c.alerts?.length ?? 0} Associated Telemetry Items</span>
              <span>•</span>
              <span>{c.actions?.length ?? 0} Response Actions</span>
              <span>•</span>
              <span>Updated: {new Date(c.updated_at).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}

        {cases.length === 0 && !loading && (
          <div className="bg-[#0E1420] border border-slate-800 p-8 rounded-xl text-center text-slate-400 text-xs font-mono">
            No active incident cases formed. Cases are automatically assembled as related detections are triaged.
          </div>
        )}
      </div>
    </div>
  );
}

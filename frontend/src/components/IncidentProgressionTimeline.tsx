"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
  Lock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface TimelineStep {
  title: string;
  time: string;
  status: "completed" | "in_progress" | "pending";
  actionBadge: "Resolve" | "Monitoring" | "Deployed";
  detail: string;
}

const DEFAULT_TIMELINE: TimelineStep[] = [
  {
    title: "Detection",
    time: "02:14 UTC",
    status: "completed",
    actionBadge: "Resolve",
    detail: "Next-Gen SIEM & Sensor ML flagged malicious payload on DESKTOP-6AUDB3T",
  },
  {
    title: "Investigation Started",
    time: "02:15 UTC",
    status: "completed",
    actionBadge: "Monitoring",
    detail: "AI Agent correlated brute force authentications to host telemetry",
  },
  {
    title: "Threat Confirmed",
    time: "02:18 UTC",
    status: "completed",
    actionBadge: "Resolve",
    detail: "MITRE T1110.001 & T1204 mapped with high confidence (Severity 92)",
  },
  {
    title: "Containment Initiated",
    time: "02:22 UTC",
    status: "in_progress",
    actionBadge: "Deployed",
    detail: "RTR Network Isolation pending SOC analyst authorization",
  },
  {
    title: "Recovery in Progress",
    time: "Queued",
    status: "pending",
    actionBadge: "Resolve",
    detail: "Remediation script will wipe persistence keys and flush auth tokens",
  },
  {
    title: "Resolution",
    time: "Est. 12m",
    status: "pending",
    actionBadge: "Monitoring",
    detail: "Post-incident audit log update and SOC debrief sign-off",
  },
];

interface IncidentProgressionTimelineProps {
  incidentId?: string;
  onAuthorizeAction?: () => void;
}

export function IncidentProgressionTimeline({
  incidentId = "INC-2847",
  onAuthorizeAction,
}: IncidentProgressionTimelineProps) {
  const [steps] = useState<TimelineStep[]>(DEFAULT_TIMELINE);

  return (
    <div className="bg-[#0E1420] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Incident Progression
            </h3>
          </div>
          <div className="text-[11px] text-cyan-400 font-mono mt-0.5 font-semibold">
            {incidentId} — Lateral Movement & SIEM Brute Force
          </div>
        </div>

        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Stage 4 of 6
        </span>
      </div>

      {/* Vertical Progression Steps */}
      <div className="my-4 space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {steps.map((s, idx) => {
          const isDone = s.status === "completed";
          const isCurrent = s.status === "in_progress";

          return (
            <div key={idx} className="relative flex items-start gap-3 pl-1">
              {/* Node Marker */}
              <div
                className={`relative z-10 w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isDone
                    ? "bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                    : isCurrent
                    ? "bg-amber-500 text-black animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                    : "bg-slate-900 border border-slate-700 text-slate-600"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                ) : isCurrent ? (
                  <Clock className="w-2.5 h-2.5 stroke-[2.5]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-bold font-mono ${
                      isCurrent ? "text-amber-300" : isDone ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {s.title}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-500 font-mono">{s.time}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold border ${
                        s.actionBadge === "Deployed"
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                          : s.actionBadge === "Resolve"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                      }`}
                    >
                      {s.actionBadge}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{s.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Incident Action Trigger */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Active Pending Gate:</span>
          <span className="text-amber-400 font-bold">RTR Host Containment</span>
        </div>
        <button
          onClick={onAuthorizeAction}
          className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/40"
        >
          <Lock className="w-3.5 h-3.5 stroke-[2]" />
          <span>Authorize Containment Action</span>
        </button>
      </div>

      {/* Mini 24h Incident Volume Summary matching Image 1 */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          <span>Incident Volume (24h)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-cyan-400">● 3 New</span>
          <span className="text-emerald-400">● 12 Resolved</span>
          <span className="text-red-400">● 1 Escalated</span>
        </div>
      </div>
    </div>
  );
}

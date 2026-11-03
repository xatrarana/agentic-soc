"use client";

import { useEffect, useState } from "react";
import {
  Flame,
  ShieldAlert,
  Server,
  Activity,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers,
} from "lucide-react";
import { Alert, BriefingResponse, Stats, api } from "@/lib/api";
import { ThreatActivityChart } from "./ThreatActivityChart";
import { AiSecurityBriefing } from "./AiSecurityBriefing";
import { AlertsTable } from "./AlertsTable";

interface SocOverviewProps {
  stats: Stats | null;
  refreshKey: number;
  onRefreshNeeded: () => void;
  onSelectAlert: (alertId: number) => void;
  onNavigateToInvestigations: () => void;
}

export function SocOverview({
  stats,
  refreshKey,
  onRefreshNeeded,
  onSelectAlert,
  onNavigateToInvestigations,
}: SocOverviewProps) {
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);

  useEffect(() => {
    api.getBriefing().then(setBriefing).catch(console.error);
  }, [refreshKey]);

  const activeIncidents = stats?.total_incidents || 0;
  const totalAlerts = stats?.total_alerts || 0;
  const openAlerts = stats?.open_alerts || 0;

  const sevMap = (stats?.by_severity || []).reduce((acc, s) => {
    acc[s.key] = s.count;
    return acc;
  }, {} as Record<string, number>);

  const criticalDetections = sevMap["Critical"] || 0;
  const endpointsAtRisk = briefing?.endpoints_at_risk || [];
  const healthScore = briefing?.threat_score || 94;
  const threatLevel = briefing?.threat_level || "Normal";

  return (
    <div className="space-y-6">
      {/* Top Command Metrics Strip (Inspired by SentinelX & Analytics ref images) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Posture Score / Threat Level */}
        <div className="bg-[#0E1420] border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              Environment Posture
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                threatLevel === "Elevated" || threatLevel === "High"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              {threatLevel}
            </span>
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white tracking-tight">{healthScore}</span>
            <span className="text-xs text-slate-500 font-mono">/ 100 Health</span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
            <div
              style={{ width: `${healthScore}%` }}
              className={`h-full transition-all duration-500 ${
                healthScore < 70 ? "bg-red-500" : healthScore < 85 ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
          </div>
        </div>

        {/* Active Incident Cases */}
        <div className="bg-[#0E1420] border border-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              Active Cases
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">{activeIncidents}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Correlated Incidents</div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <ShieldAlert className="w-5 h-5 stroke-[1.75]" />
          </div>
        </div>

        {/* Critical Detections */}
        <div className="bg-[#0E1420] border border-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              Critical Threats
            </div>
            <div className="text-2xl font-bold font-mono text-red-400 mt-1">{criticalDetections}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Requires Immediate Review</div>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <Flame className="w-5 h-5 stroke-[1.75]" />
          </div>
        </div>

        {/* Endpoints At Risk */}
        <div className="bg-[#0E1420] border border-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              Endpoints At Risk
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
              {endpointsAtRisk.length || (openAlerts > 0 ? 1 : 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono truncate max-w-[120px]" title={endpointsAtRisk.join(", ")}>
              {endpointsAtRisk[0] || "Fleet Posture Stable"}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Server className="w-5 h-5 stroke-[1.75]" />
          </div>
        </div>

        {/* Total Ingested Signals */}
        <div className="bg-[#0E1420] border border-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              Ingested Signals
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">{totalAlerts}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-medium">CrowdStrike EDR & NG-SIEM</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 text-slate-300">
            <Cpu className="w-5 h-5 stroke-[1.75]" />
          </div>
        </div>
      </section>

      {/* Main 2-Column Operational Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Activity Chart & Detections Grid */}
        <div className="lg:col-span-2 space-y-6">
          {/* Threat Activity Trend Chart */}
          <ThreatActivityChart stats={stats} />

          {/* Detections Data Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 stroke-[1.75]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Recent Telemetry Detections
                </h3>
              </div>
              <button
                onClick={onNavigateToInvestigations}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition"
              >
                <span>Full Investigations Workspace</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <AlertsTable refreshKey={refreshKey} onRefreshNeeded={onRefreshNeeded} />
          </div>
        </div>

        {/* Right Column: AI Security Briefing & Citations */}
        <div className="lg:col-span-1 space-y-4">
          <AiSecurityBriefing refreshKey={refreshKey} onSelectAlert={onSelectAlert} />
        </div>
      </section>
    </div>
  );
}


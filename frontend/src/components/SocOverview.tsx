"use client";

import { useEffect, useState } from "react";
import {
  ShieldAlert,
  Server,
  Activity,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { BriefingResponse, Stats, api } from "@/lib/api";
import { ThreatActivityChart } from "./ThreatActivityChart";
import { AiSecurityBriefing } from "./AiSecurityBriefing";
import { AlertsTable } from "./AlertsTable";
import { NetworkTopology } from "./NetworkTopology";
import { SystemIntegrityGauge } from "./SystemIntegrityGauge";
import { IncidentProgressionTimeline } from "./IncidentProgressionTimeline";
import { ModuleCardsRow } from "./ModuleCardsRow";
import { NavSection } from "./Sidebar";

interface SocOverviewProps {
  stats: Stats | null;
  refreshKey: number;
  onRefreshNeeded: () => void;
  onSelectAlert: (alertId: number) => void;
  onNavigateToInvestigations: () => void;
  onNavigateSection?: (section: NavSection) => void;
  onOpenSettings?: () => void;
}

export function SocOverview({
  stats,
  refreshKey,
  onRefreshNeeded,
  onSelectAlert,
  onNavigateToInvestigations,
  onNavigateSection,
  onOpenSettings,
}: SocOverviewProps) {
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);

  useEffect(() => {
    api.getBriefing().then(setBriefing).catch(console.error);
  }, [refreshKey]);

  const activeIncidents = stats?.total_incidents ?? 0;
  const totalAlerts = stats?.total_alerts ?? 0;
  const openAlerts = stats?.open_alerts ?? 0;

  const sevMap = (stats?.by_severity || []).reduce((acc, s) => {
    acc[s.key] = s.count;
    return acc;
  }, {} as Record<string, number>);

  const criticalDetections = sevMap["Critical"] || 0;
  const highDetections = sevMap["High"] || 0;
  const uniqueHostsCount = stats?.top_hosts?.length ?? 0;
  const topHostName = stats?.top_hosts?.[0]?.key || "No host data";
  const healthScore = briefing?.threat_score ?? null;
  const threatLevel = briefing?.threat_level || "No Data";

  return (
    <div className="space-y-5">
      {/* 1. Top KPI Cards Strip (100% Real Telemetry Counts — Zero Hardcoded Numbers) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Threat Level */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">
              Current Threat Level
            </span>
            <AlertTriangle className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-semibold text-zinc-100">
              {totalAlerts > 0 ? threatLevel : "No Data"}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              {totalAlerts > 0 ? `${openAlerts} open / ${totalAlerts} total alerts` : "No alerts ingested"}
            </div>
          </div>
        </div>

        {/* Open Detections */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">
              Open Detections
            </span>
            <ShieldAlert className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-semibold text-zinc-100">
              {openAlerts}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              {totalAlerts > 0
                ? `${criticalDetections} Critical · ${highDetections} High`
                : "No open detections"}
            </div>
          </div>
        </div>

        {/* Affected Hosts */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">
              Hosts with Detections
            </span>
            <Server className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-semibold text-zinc-100">
              {uniqueHostsCount}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5 font-mono truncate">
              {uniqueHostsCount > 0 ? `Primary: ${topHostName}` : "No host data"}
            </div>
          </div>
        </div>

        {/* Total Ingested Signals & Incidents */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">
              Ingested Telemetry
            </span>
            <Activity className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-semibold text-zinc-100">
              {totalAlerts}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              {activeIncidents} correlated incident(s)
            </div>
          </div>
        </div>
      </section>

      {/* 2. System Status (4 cols) + Affected Entities Topology (8 cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-4 flex flex-col">
          <SystemIntegrityGauge
            score={healthScore}
            stats={stats}
            refreshKey={refreshKey}
            onOpenDiagnostics={onOpenSettings}
          />
        </div>

        <div className="lg:col-span-8 flex flex-col">
          <NetworkTopology
            refreshKey={refreshKey}
            onSelectHost={() => {
              if (onNavigateSection) onNavigateSection("investigations");
            }}
            onContainEndpoint={() => {
              if (onNavigateSection) onNavigateSection("automation");
            }}
          />
        </div>
      </section>

      {/* 3. Balanced 3-Column Row: Security Briefing + Severity Breakdown + Workflow Status */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-4 flex flex-col">
          <AiSecurityBriefing refreshKey={refreshKey} onSelectAlert={onSelectAlert} />
        </div>

        <div className="lg:col-span-4 flex flex-col">
          <ThreatActivityChart stats={stats} />
        </div>

        <div className="lg:col-span-4 flex flex-col">
          <IncidentProgressionTimeline
            stats={stats}
            refreshKey={refreshKey}
            onAuthorizeAction={() => {
              if (onNavigateSection) onNavigateSection("automation");
            }}
          />
        </div>
      </section>

      {/* 4. Full-Width Recent Telemetry Detections */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-zinc-100">
            Recent Telemetry Detections
          </h3>
          <button
            onClick={onNavigateToInvestigations}
            className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 font-medium transition"
          >
            <span>Open Investigations</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <AlertsTable refreshKey={refreshKey} onRefreshNeeded={onRefreshNeeded} />
      </section>

      {/* 5. 4 Core SOC Module Cards */}
      <section>
        <ModuleCardsRow
          onNavigate={(s) => {
            if (onNavigateSection) onNavigateSection(s);
            else if (s === "investigations") onNavigateToInvestigations();
          }}
        />
      </section>
    </div>
  );
}

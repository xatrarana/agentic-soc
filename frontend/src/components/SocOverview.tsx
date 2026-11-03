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
  Search,
  Filter,
  Globe,
  Radio,
  SlidersHorizontal,
} from "lucide-react";
import { Alert, BriefingResponse, Stats, api } from "@/lib/api";
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
  const [selectedTeam, setSelectedTeam] = useState("Global SOC");
  const [selectedRegion, setSelectedRegion] = useState("CrowdStrike US-2");
  const [selectedRange, setSelectedRange] = useState("Last 24 Hours");
  const [searchQuery, setSearchQuery] = useState("");

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
  const threatLevel = briefing?.threat_level || "Elevated";

  return (
    <div className="space-y-6">
      {/* 1. Operational Filter Ribbon (Inspired by Analytics & SentinelX Reference Images) */}
      <section className="bg-[#0E1420] border border-slate-800/90 rounded-2xl p-3 px-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Team Filter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500">Team:</span>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Global SOC" className="bg-[#0E1420]">Global SOC</option>
              <option value="Tier 2 IR" className="bg-[#0E1420]">Tier 2 IR</option>
              <option value="Threat Intel" className="bg-[#0E1420]">Threat Intel</option>
            </select>
          </div>

          {/* Region Filter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-500">Cloud:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="CrowdStrike US-2" className="bg-[#0E1420]">CrowdStrike US-2</option>
              <option value="CrowdStrike US-1" className="bg-[#0E1420]">CrowdStrike US-1</option>
              <option value="CrowdStrike EU-1" className="bg-[#0E1420]">CrowdStrike EU-1</option>
            </select>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500">Time Range:</span>
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="bg-transparent text-cyan-400 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Last 1 Hour" className="bg-[#0E1420]">Last 1 Hour</option>
              <option value="Last 24 Hours" className="bg-[#0E1420]">Last 24 Hours</option>
              <option value="Last 7 Days" className="bg-[#0E1420]">Last 7 Days</option>
            </select>
          </div>

          {/* Threat Framework */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500">Threat:</span>
            <span className="text-purple-400 font-semibold">MITRE ATT&CK v15</span>
          </div>
        </div>

        {/* Search input with keyboard shortcut */}
        <div className="relative flex-1 max-w-xs min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search IP, node, or alert..."
            className="w-full bg-[#080C14] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition"
          />
        </div>
      </section>

      {/* 2. Top KPI Cards Strip (Directly from SentinelX Image 2) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Global Threat Level */}
        <div className="bg-[#0E1420] border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              Global Threat Level
            </span>
            <span className="p-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 stroke-[2]" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
              {threatLevel}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              DEFCON 3 equivalent posture
            </div>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
            <div className="bg-amber-500 h-full w-[65%]" />
          </div>
        </div>

        {/* Active Incidents */}
        <div className="bg-[#0E1420] border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              Active Incidents
            </span>
            <span className="p-1 rounded bg-red-500/10 border border-red-500/20 text-red-400">
              <ShieldAlert className="w-3.5 h-3.5 stroke-[2]" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {activeIncidents || (openAlerts > 0 ? 3 : 0)}
            </div>
            <div className="text-[11px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>3 correlated detection groups</span>
            </div>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
            <div className="bg-red-500 h-full w-[45%]" />
          </div>
        </div>

        {/* Systems Online / Fleet Health */}
        <div className="bg-[#0E1420] border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              Fleet Sensors Online
            </span>
            <span className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Server className="w-3.5 h-3.5 stroke-[2]" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              1,402
            </div>
            <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
              99.98% Falcon EDR coverage
            </div>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
            <div className="bg-emerald-500 h-full w-[98%]" />
          </div>
        </div>

        {/* Telemetry Stream Volume */}
        <div className="bg-[#0E1420] border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              Telemetry Ingestion
            </span>
            <span className="p-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Activity className="w-3.5 h-3.5 stroke-[2]" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-cyan-400 tracking-tight">
              4.2 TB/s
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Standard telemetry baseline
            </div>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
            <div className="bg-cyan-500 h-full w-[80%]" />
          </div>
        </div>
      </section>

      {/* 3. Centerpiece Command Center Stage: Attack Path & Controls (From Image 1 & 2) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols): System Integrity Gauge & Security Controls */}
        <div className="lg:col-span-4 space-y-6">
          <SystemIntegrityGauge
            score={healthScore}
            onOpenDiagnostics={onOpenSettings}
            falconConnected={true}
          />

          {/* AI Security Briefing & Citations */}
          <AiSecurityBriefing refreshKey={refreshKey} onSelectAlert={onSelectAlert} />
        </div>

        {/* Right Column (8 cols): Interactive Network Topology & Incident Progression */}
        <div className="lg:col-span-8 space-y-6">
          {/* Network Topology & Attack Path Visualizer */}
          <NetworkTopology
            onSelectHost={(hostname) => {
              if (onNavigateSection) onNavigateSection("investigations");
            }}
            onContainEndpoint={(hostname) => {
              if (onNavigateSection) onNavigateSection("automation");
            }}
          />

          {/* Incident Progression Lifecycle Timeline */}
          <IncidentProgressionTimeline
            incidentId="INC-2847"
            onAuthorizeAction={() => {
              if (onNavigateSection) onNavigateSection("automation");
            }}
          />
        </div>
      </section>

      {/* 4. Threat Activity Trend Chart & Telemetry Detections */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <ThreatActivityChart stats={stats} />

          {/* Telemetry Detections Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 stroke-[1.75]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
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

        {/* Right side: 4 Key Modules Quick Action Cards */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 rounded-2xl bg-[#0E1420] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Command Modules
              </h4>
              <span className="text-[10px] text-cyan-400 font-mono">Direct Launch</span>
            </div>
            {onNavigateSection && (
              <div className="space-y-2.5">
                <button
                  onClick={() => onNavigateSection("hunting")}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-400 font-mono">
                      Threat Intelligence
                    </div>
                    <div className="text-[11px] text-slate-400">Context & IOC enrichment</div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                </button>

                <button
                  onClick={() => onNavigateSection("investigations")}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-400 font-mono">
                      AI Investigation
                    </div>
                    <div className="text-[11px] text-slate-400">Automated alert analysis</div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                </button>

                <button
                  onClick={() => onNavigateSection("detections")}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-400 font-mono">
                      Detection Center
                    </div>
                    <div className="text-[11px] text-slate-400">Detection & correlation</div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                </button>

                <button
                  onClick={() => onNavigateSection("automation")}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-400 font-mono">
                      Response Center
                    </div>
                    <div className="text-[11px] text-slate-400">Response workflows & approvals</div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. 4 Full Bottom Module Cards matching Image 1 */}
      {onNavigateSection && (
        <section className="pt-2">
          <ModuleCardsRow onNavigate={onNavigateSection} />
        </section>
      )}
    </div>
  );
}

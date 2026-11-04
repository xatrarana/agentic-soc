"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  ShieldAlert,
  FolderGit2,
  Activity,
  ScrollText,
  AlertTriangle,
  SlidersHorizontal,
  RefreshCw,
  FileSearch,
  Plug,
  Sliders,
  Crosshair,
} from "lucide-react";
import {
  Checkpoint,
  FalconHealth,
  Stats,
  api,
} from "@/lib/api";
import { Sidebar, NavSection } from "@/components/Sidebar";
import { SocOverview } from "@/components/SocOverview";
import { AlertsTable } from "@/components/AlertsTable";
import { AlertTriageDrawer } from "@/components/AlertTriageDrawer";
import { ApprovalQueue } from "@/components/ApprovalQueue";
import { CasesView } from "@/components/CasesView";
import { IncidentsView } from "@/components/IncidentsView";
import { AuditLogView } from "@/components/AuditLogView";
import { SettingsModal } from "@/components/SettingsModal";
import { ThreatHuntingView } from "@/components/ThreatHuntingView";
import { DetectionRulesView } from "@/components/DetectionRulesView";

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<FalconHealth | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [pendingActionCount, setPendingActionCount] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [ingesting, setIngesting] = useState(false);
  const [triaging, setTriaging] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);

  const refreshAll = useCallback(() => {
    api.getStats().then(setStats).catch(console.error);
    api.getFalconHealth().then(setHealth).catch(() => setHealth({ ok: false, mode: "offline" }));
    api.getIngestStatus().then(setCheckpoints).catch(console.error);
    api.getActions("pending_approval").then((acts) => setPendingActionCount(acts.length)).catch(console.error);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 15000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  const handleManualIngest = async () => {
    setIngesting(true);
    try {
      await api.runIngest();
      refreshAll();
    } catch (err) {
      alert(`Ingestion failed: ${err}`);
    } finally {
      setIngesting(false);
    }
  };

  const handleBatchTriage = async () => {
    setTriaging(true);
    try {
      const res = await api.triagePending(10);
      alert(`Analysis completed: ${res.triaged} telemetry items investigated.`);
      refreshAll();
    } catch (err) {
      alert(`Batch analysis failed: ${err}`);
    } finally {
      setTriaging(false);
    }
  };

  const criticalCount = (stats?.by_severity || []).find((s) => s.key === "Critical")?.count || 0;
  const hasConfigWarning = health && !health.ok;

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex font-sans antialiased selection:bg-cyan-500 selection:text-black">
      {/* 1. Persistent Left Navigation Rail (8 Target Modules) */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        pendingApprovalsCount={pendingActionCount}
        criticalAlertsCount={criticalCount}
        falconConnected={Boolean(health?.ok)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 2. Main Content Stage */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Operational Header */}
        <header className="border-b border-slate-800/80 bg-[#0B101B] px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
              {activeSection === "overview" && "SOC Command Center — Live Overview"}
              {activeSection === "investigations" && "AI Investigations & Evidence Triage"}
              {activeSection === "hunting" && "Threat Hunting & Query Workspace"}
              {activeSection === "incidents" && "Incident Case Management"}
              {activeSection === "detections" && "Detection Engineering & MITRE Rules"}
              {activeSection === "automation" && "Automation & Response Authorizations"}
              {activeSection === "integrations" && "Integrations & Data Sources"}
              {activeSection === "settings" && "Platform Settings & Audit Ledger"}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Actions */}
            <button
              onClick={handleBatchTriage}
              disabled={triaging}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-medium transition disabled:opacity-50"
            >
              <FileSearch className={`w-3.5 h-3.5 text-cyan-400 stroke-[1.75] ${triaging ? "animate-spin" : ""}`} />
              <span>{triaging ? "Analyzing..." : "Analyze Detections"}</span>
            </button>

            <button
              onClick={handleManualIngest}
              disabled={ingesting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold shadow-md shadow-cyan-950/40 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 stroke-[2] ${ingesting ? "animate-spin" : ""}`} />
              <span>{ingesting ? "Syncing..." : "Sync Telemetry"}</span>
            </button>
          </div>
        </header>

        {/* Warning Banner if scopes missing or Falcon disconnected */}
        {hasConfigWarning && (
          <div className="bg-amber-950/40 border-b border-amber-800/60 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 stroke-[2]" />
              <span>CrowdStrike Falcon connection requires attention or API scope verification.</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 underline font-semibold text-amber-300 hover:text-white"
            >
              <span>Open Diagnostics</span>
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* View Routing */}
        <main className="p-6 flex-1 max-w-7xl w-full mx-auto space-y-6">
          {activeSection === "overview" && (
            <SocOverview
              stats={stats}
              refreshKey={refreshKey}
              onRefreshNeeded={refreshAll}
              onSelectAlert={setSelectedAlertId}
              onNavigateToInvestigations={() => setActiveSection("investigations")}
            />
          )}

          {activeSection === "investigations" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#0E1420] border border-slate-800 shadow-md flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    AI Investigation & Telemetry Stream
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select any detection to inspect process lineage, command execution context, and evidence findings.
                  </p>
                </div>
              </div>
              <AlertsTable refreshKey={refreshKey} onRefreshNeeded={refreshAll} />
            </div>
          )}

          {activeSection === "hunting" && (
            <ThreatHuntingView
              onSelectAlert={setSelectedAlertId}
              onActionQueued={refreshAll}
            />
          )}

          {activeSection === "incidents" && <CasesView refreshKey={refreshKey} />}

          {activeSection === "detections" && <DetectionRulesView />}

          {activeSection === "automation" && (
            <ApprovalQueue refreshKey={refreshKey} onActionDecided={refreshAll} />
          )}

          {activeSection === "integrations" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#0E1420] border border-slate-800 shadow-md flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Integrations & Telemetry Sources
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live connection status, permissions, and synchronization freshness across connected platforms.
                  </p>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold transition flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Configure Sources</span>
                </button>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#0E1420] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">CrowdStrike Falcon US-2 Cloud</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                        health?.ok
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-red-950 text-red-400 border border-red-800"
                      }`}
                    >
                      {health?.ok ? "Live Telemetry Active" : "Disconnected"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Primary EDR & NG-SIEM telemetry source. Ingests alerts, incidents, host posture, and custom IOCs.
                  </p>
                  <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800">
                    Endpoint: https://api.us-2.crowdstrike.com
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0E1420] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">Anthropic Claude AI Triage Engine</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase bg-purple-950 text-purple-300 border border-purple-800">
                      Tier-3 Reasoning Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Autonomous investigation agent equipped with read-only CrowdStrike tools for evidence grounding and triage.
                  </p>
                  <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800">
                    Model: claude-3-5-sonnet
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "settings" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#0E1420] border border-slate-800 shadow-md flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    System Configuration & Audit
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Inspect immutable governance audit logs and manage tenant credentials.
                  </p>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Open API Credentials & Diagnostics</span>
                </button>
              </div>

              <AuditLogView refreshKey={refreshKey} />
            </div>
          )}
        </main>
      </div>

      {/* Global Alert Drawer (activated when clicking citations or rows) */}
      {selectedAlertId !== null && (
        <AlertTriageDrawer
          alertId={selectedAlertId}
          onClose={() => setSelectedAlertId(null)}
          onChanged={refreshAll}
        />
      )}

      {/* Settings & Diagnostic Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={refreshAll}
      />
    </div>
  );
}

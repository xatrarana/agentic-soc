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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans antialiased">
      {/* 1. Left Navigation Rail */}
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
        <header className="border-b border-zinc-800 bg-zinc-900 px-6 py-3 sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-zinc-100">
              {activeSection === "overview" && "Overview"}
              {activeSection === "investigations" && "Investigations & Triage"}
              {activeSection === "hunting" && "Threat Hunting"}
              {activeSection === "incidents" && "Incidents & Cases"}
              {activeSection === "detections" && "Detection Rules"}
              {activeSection === "automation" && "Response Approvals"}
              {activeSection === "integrations" && "Integrations"}
              {activeSection === "settings" && "Settings & Audit Log"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchTriage}
              disabled={triaging}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium transition disabled:opacity-50"
            >
              <FileSearch className={`w-3.5 h-3.5 text-zinc-400 ${triaging ? "animate-spin" : ""}`} />
              <span>{triaging ? "Analyzing..." : "Analyze Detections"}</span>
            </button>

            <button
              onClick={handleManualIngest}
              disabled={ingesting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${ingesting ? "animate-spin" : ""}`} />
              <span>{ingesting ? "Syncing..." : "Sync Telemetry"}</span>
            </button>
          </div>
        </header>

        {/* Warning Banner if Falcon disconnected */}
        {hasConfigWarning && (
          <div className="bg-amber-950/40 border-b border-amber-800/60 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>CrowdStrike Falcon connection requires configuration or API scope verification.</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 underline font-medium text-amber-300 hover:text-white"
            >
              <span>Open Diagnostics</span>
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* View Routing */}
        <main className="p-5 flex-1 w-full min-w-0 space-y-5">
          {activeSection === "overview" && (
            <SocOverview
              stats={stats}
              refreshKey={refreshKey}
              onRefreshNeeded={refreshAll}
              onSelectAlert={setSelectedAlertId}
              onNavigateToInvestigations={() => setActiveSection("investigations")}
              onNavigateSection={setActiveSection}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {activeSection === "investigations" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Detections & Investigation Stream
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Select any detection to inspect telemetry fields, process lineage, and triage findings.
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
              <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Integrations & Telemetry Sources
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Connection status and synchronization checkpoints for configured providers.
                  </p>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Configure Sources</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-zinc-100">CrowdStrike Falcon API</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        health?.ok
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-red-950 text-red-400 border border-red-800"
                      }`}
                    >
                      {health?.ok ? `Connected (${health.mode})` : "Disconnected"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Primary telemetry source for Alerts v2, Hosts, Custom IOCs, and Real Time Response.
                  </p>
                  <div className="text-xs font-mono text-zinc-500 pt-2 border-t border-zinc-800">
                    Checkpoints: {checkpoints.length > 0 ? checkpoints.map((c) => `${c.source}: ${c.last_fetched} fetched`).join(", ") : "No sync recorded"}
                  </div>
                </div>

                <div className="p-5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-zinc-100">Anthropic Claude Triage</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      Investigation Agent
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Read-only tool-use investigation loop for alert correlation and evidence summarization.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === "settings" && (
            <div className="space-y-5">
              <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Settings & Audit Log
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Manage CrowdStrike API credentials and inspect the append-only governance audit trail.
                  </p>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium transition flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>API Credentials & Diagnostics</span>
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

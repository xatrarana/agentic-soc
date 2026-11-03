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
} from "lucide-react";
import {
  Checkpoint,
  FalconHealth,
  Stats,
  api,
} from "@/lib/api";
import { Header } from "@/components/Header";
import { StatsCards } from "@/components/StatsCards";
import { AlertsTable } from "@/components/AlertsTable";
import { ApprovalQueue } from "@/components/ApprovalQueue";
import { CasesView } from "@/components/CasesView";
import { IncidentsView } from "@/components/IncidentsView";
import { AuditLogView } from "@/components/AuditLogView";
import { SettingsModal } from "@/components/SettingsModal";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<
    "alerts" | "approvals" | "cases" | "incidents" | "audit"
  >("alerts");
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<FalconHealth | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [pendingActionCount, setPendingActionCount] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [ingesting, setIngesting] = useState(false);
  const [triaging, setTriaging] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
      alert(`Triage completed: ${res.triaged} detections analyzed.`);
      refreshAll();
    } catch (err) {
      alert(`Batch triage failed: ${err}`);
    } finally {
      setTriaging(false);
    }
  };

  const hasConfigWarning = health && !health.ok;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        health={health}
        checkpoints={checkpoints}
        onIngest={handleManualIngest}
        ingesting={ingesting}
        onTriagePending={handleBatchTriage}
        triaging={triaging}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Disconnection or Permission Warning Banner */}
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
            <span>Open Diagnostic Center</span>
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* KPI Summary Tiles */}
        <StatsCards stats={stats} />

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 mb-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("alerts")}
            className={`flex items-center gap-2 pb-3 px-3.5 transition border-b-2 ${
              activeTab === "alerts"
                ? "border-red-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bell className="w-4 h-4 stroke-[1.75]" />
            <span>Detections & Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab("approvals")}
            className={`flex items-center gap-2 pb-3 px-3.5 transition border-b-2 relative ${
              activeTab === "approvals"
                ? "border-red-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400 stroke-[1.75]" />
            <span>Authorization Queue</span>
            {pendingActionCount > 0 && (
              <span className="bg-red-600 text-white px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold animate-pulse">
                {pendingActionCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("cases")}
            className={`flex items-center gap-2 pb-3 px-3.5 transition border-b-2 ${
              activeTab === "cases"
                ? "border-red-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FolderGit2 className="w-4 h-4 stroke-[1.75]" />
            <span>Incident Cases</span>
          </button>

          <button
            onClick={() => setActiveTab("incidents")}
            className={`flex items-center gap-2 pb-3 px-3.5 transition border-b-2 ${
              activeTab === "incidents"
                ? "border-red-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-4 h-4 stroke-[1.75]" />
            <span>Falcon Incidents</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 pb-3 px-3.5 transition border-b-2 ${
              activeTab === "audit"
                ? "border-red-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ScrollText className="w-4 h-4 stroke-[1.75]" />
            <span>Audit Ledger</span>
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === "alerts" && (
          <AlertsTable refreshKey={refreshKey} onRefreshNeeded={refreshAll} />
        )}
        {activeTab === "approvals" && (
          <ApprovalQueue refreshKey={refreshKey} onActionDecided={refreshAll} />
        )}
        {activeTab === "cases" && <CasesView refreshKey={refreshKey} />}
        {activeTab === "incidents" && <IncidentsView refreshKey={refreshKey} />}
        {activeTab === "audit" && <AuditLogView refreshKey={refreshKey} />}
      </main>

      {/* Settings & Diagnostic Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={refreshAll}
      />
    </div>
  );
}

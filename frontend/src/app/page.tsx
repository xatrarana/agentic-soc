"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  ShieldAlert,
  FolderGit2,
  Activity,
  ScrollText,
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
      alert(`AI Triage completed: ${res.triaged} alerts triaged.`);
      refreshAll();
    } catch (err) {
      alert(`Batch triage failed: ${err}`);
    } finally {
      setTriaging(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Top Navigation & Status Bar */}
      <Header
        health={health}
        checkpoints={checkpoints}
        onIngest={handleManualIngest}
        ingesting={ingesting}
        onTriagePending={handleBatchTriage}
        triaging={triaging}
      />

      {/* Main Command Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* KPI Summary Tiles */}
        <StatsCards stats={stats} />

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border-subtle mb-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("alerts")}
            className={`flex items-center gap-2 pb-3 px-3 transition border-b-2 ${
              activeTab === "alerts"
                ? "border-red-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Alerts & Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab("approvals")}
            className={`flex items-center gap-2 pb-3 px-3 transition border-b-2 relative ${
              activeTab === "approvals"
                ? "border-red-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Action Approvals (SOAR)</span>
            {pendingActionCount > 0 && (
              <span className="bg-red-600 text-white px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold animate-pulse">
                {pendingActionCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("cases")}
            className={`flex items-center gap-2 pb-3 px-3 transition border-b-2 ${
              activeTab === "cases"
                ? "border-red-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Investigative Cases</span>
          </button>

          <button
            onClick={() => setActiveTab("incidents")}
            className={`flex items-center gap-2 pb-3 px-3 transition border-b-2 ${
              activeTab === "incidents"
                ? "border-red-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Correlated Incidents</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 pb-3 px-3 transition border-b-2 ${
              activeTab === "audit"
                ? "border-red-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <ScrollText className="w-4 h-4" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* Tab Content Panels */}
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
    </div>
  );
}


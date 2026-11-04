"use client";

import { useEffect, useState } from "react";
import { Shield, Wrench } from "lucide-react";
import { Checkpoint, FalconHealth, Stats, api } from "@/lib/api";

interface SystemIntegrityGaugeProps {
  score?: number | null;
  stats?: Stats | null;
  refreshKey?: number;
  onOpenDiagnostics?: () => void;
}

export function SystemIntegrityGauge({
  score,
  stats,
  refreshKey = 0,
  onOpenDiagnostics,
}: SystemIntegrityGaugeProps) {
  const [health, setHealth] = useState<FalconHealth | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);

  useEffect(() => {
    api.getFalconHealth().then(setHealth).catch(() => setHealth({ ok: false, mode: "offline" }));
    api.getIngestStatus().then(setCheckpoints).catch(console.error);
  }, [refreshKey]);

  const totalAlerts = stats?.total_alerts ?? 0;
  const openAlerts = stats?.open_alerts ?? 0;
  const totalIncidents = stats?.total_incidents ?? 0;
  const alertCheckpoint = checkpoints.find((c) => c.source === "alerts");
  const hasScore = typeof score === "number" && score > 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-100">
            System & Ingestion Status
          </h3>
        </div>
        {onOpenDiagnostics && (
          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium transition"
          >
            <Wrench className="w-3 h-3" />
            <span>Diagnostics</span>
          </button>
        )}
      </div>

      {/* Real Database Counts */}
      <div className="grid grid-cols-3 gap-2.5 my-4 text-center">
        <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800">
          <div className="text-[11px] text-zinc-400">Total Alerts</div>
          <div className="text-base font-semibold text-zinc-100 mt-0.5">{totalAlerts}</div>
        </div>

        <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800">
          <div className="text-[11px] text-zinc-400">Open Alerts</div>
          <div className="text-base font-semibold text-zinc-100 mt-0.5">{openAlerts}</div>
        </div>

        <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800">
          <div className="text-[11px] text-zinc-400">Incidents</div>
          <div className="text-base font-semibold text-zinc-100 mt-0.5">{totalIncidents}</div>
        </div>
      </div>

      {/* Posture Score Readout (Real or No Data) */}
      <div className="p-4 rounded-md bg-zinc-950 border border-zinc-800 text-center my-1">
        {hasScore ? (
          <>
            <div className="text-2xl font-bold text-zinc-100">{score} / 100</div>
            <div className="text-xs text-zinc-400 mt-0.5">Calculated Posture Score (from active alerts)</div>
          </>
        ) : (
          <>
            <div className="text-sm font-medium text-zinc-400">No Posture Score Data</div>
            <div className="text-xs text-zinc-500 mt-0.5">No active detections in database</div>
          </>
        )}
      </div>

      {/* Real CrowdStrike Connection & Sync Telemetry */}
      <div className="mt-4 pt-3 border-t border-zinc-800 space-y-2 text-xs">
        <div className="flex items-center justify-between py-1">
          <span className="text-zinc-400">CrowdStrike API:</span>
          <span className={health?.ok ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
            {health ? (health.ok ? "Connected" : "Disconnected") : "Checking..."}
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-zinc-400">Connection Mode:</span>
          <span className="text-zinc-200 font-mono">{health?.mode || "No data"}</span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-zinc-400">Last Sync Run:</span>
          <span className="text-zinc-200 font-mono">
            {alertCheckpoint?.last_run_at
              ? new Date(alertCheckpoint.last_run_at).toLocaleTimeString()
              : "No sync recorded"}
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-zinc-400">Last Batch Fetched:</span>
          <span className="text-zinc-200 font-mono">
            {alertCheckpoint ? `${alertCheckpoint.last_fetched} (${alertCheckpoint.last_new} new)` : "No data"}
          </span>
        </div>
      </div>
    </div>
  );
}

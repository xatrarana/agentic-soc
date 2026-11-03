"use client";

import { Shield, RefreshCw, CheckCircle2, AlertTriangle, Radio, SlidersHorizontal, FileSearch } from "lucide-react";
import { Checkpoint, FalconHealth } from "@/lib/api";

interface HeaderProps {
  health: FalconHealth | null;
  checkpoints: Checkpoint[];
  onIngest: () => void;
  ingesting: boolean;
  onTriagePending: () => void;
  triaging: boolean;
  onOpenSettings: () => void;
}

export function Header({
  health,
  checkpoints,
  onIngest,
  ingesting,
  onTriagePending,
  triaging,
  onOpenSettings,
}: HeaderProps) {
  const alertsCp = checkpoints.find((c) => c.source === "alerts");
  const errors = checkpoints.filter((c) => c.last_error);

  const formatTime = (iso: string | null) => {
    if (!iso) return "Not synced";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <header className="border-b border-slate-800 bg-[#0E1420] px-6 py-3 sticky top-0 z-30 flex items-center justify-between shadow-lg">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="bg-red-500/10 border border-red-500/30 p-2 rounded-xl text-red-500 shadow-sm">
          <Shield className="w-5 h-5 stroke-[2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-white font-sans">AISOC</span>
            <span className="text-[10px] bg-slate-900 text-slate-300 border border-slate-800 px-2 py-0.5 rounded font-mono font-medium">
              SOAR Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Enterprise CrowdStrike Telemetry & Investigation Runtime</p>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Falcon Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            health?.ok
              ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
              : "bg-red-950/30 border-red-800/50 text-red-300"
          }`}
          title={health?.errors ? JSON.stringify(health.errors) : undefined}
        >
          {health?.ok ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 stroke-[2]" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 stroke-[2]" />
          )}
          <span>
            CrowdStrike: {health?.ok ? "Connected" : "Disconnected"}{" "}
            <span className="opacity-70 font-mono text-[11px]">({health?.mode ?? "unknown"})</span>
          </span>
        </div>

        {/* Polling Watermark */}
        {alertsCp && (
          <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse stroke-[2]" />
            <span className="font-mono text-[11px]">Last sync: {formatTime(alertsCp.last_run_at)}</span>
          </div>
        )}

        {/* Ingest Error Indicator */}
        {errors.length > 0 && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-950/30 border border-amber-800/50 text-amber-300 rounded-lg text-xs"
            title={errors.map((e) => `${e.source}: ${e.last_error}`).join("\n")}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 stroke-[2]" />
            <span>Sync Alert</span>
          </div>
        )}

        {/* Analyze Pending Button */}
        <button
          onClick={onTriagePending}
          disabled={triaging}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition disabled:opacity-50"
        >
          <FileSearch className={`w-3.5 h-3.5 text-cyan-400 stroke-[1.75] ${triaging ? "animate-spin" : ""}`} />
          <span>{triaging ? "Analyzing..." : "Analyze Pending"}</span>
        </button>

        {/* Sync Detections Button */}
        <button
          onClick={onIngest}
          disabled={ingesting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 stroke-[2] ${ingesting ? "animate-spin" : ""}`} />
          <span>{ingesting ? "Syncing..." : "Sync Detections"}</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          title="Open Platform Configuration & Connection Diagnostics"
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[1.75]" />
        </button>
      </div>
    </header>
  );
}

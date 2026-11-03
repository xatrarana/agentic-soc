"use client";

import { Shield, RefreshCw, CheckCircle2, AlertTriangle, Radio } from "lucide-react";
import { Checkpoint, FalconHealth } from "@/lib/api";

interface HeaderProps {
  health: FalconHealth | null;
  checkpoints: Checkpoint[];
  onIngest: () => void;
  ingesting: boolean;
  onTriagePending: () => void;
  triaging: boolean;
}

export function Header({
  health,
  checkpoints,
  onIngest,
  ingesting,
  onTriagePending,
  triaging,
}: HeaderProps) {
  const alertsCp = checkpoints.find((c) => c.source === "alerts");
  const errors = checkpoints.filter((c) => c.last_error);

  const formatTime = (iso: string | null) => {
    if (!iso) return "Never";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <header className="border-b border-border-subtle bg-surface px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-md">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="bg-red-500/10 border border-red-500/30 p-2 rounded-lg text-red-400">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-wider text-white">AISOC</span>
            <span className="text-xs bg-red-950/80 text-red-400 border border-red-800/60 px-2 py-0.5 rounded font-mono font-medium">
              SOAR
            </span>
          </div>
          <p className="text-xs text-gray-400">CrowdStrike Falcon Telemetry & Claude AI Triage</p>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-3">
        {/* Falcon Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border ${
            health?.ok
              ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
              : "bg-red-950/40 border-red-800/60 text-red-300"
          }`}
          title={health?.errors ? JSON.stringify(health.errors) : undefined}
        >
          {health?.ok ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          )}
          <span>
            Falcon: {health?.ok ? "Connected" : "Disconnected"}{" "}
            <span className="opacity-70 font-mono">({health?.mode ?? "..."})</span>
          </span>
        </div>

        {/* Polling Watermark */}
        {alertsCp && (
          <div className="text-xs text-gray-400 flex items-center gap-1.5 bg-canvas/60 px-2.5 py-1.5 rounded border border-border-subtle/50">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>Last poll: {formatTime(alertsCp.last_run_at)}</span>
          </div>
        )}

        {/* Ingest Error Warning */}
        {errors.length > 0 && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-950/40 border border-amber-800/60 text-amber-300 rounded text-xs"
            title={errors.map((e) => `${e.source}: ${e.last_error}`).join("\n")}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Ingest Error</span>
          </div>
        )}

        {/* Triage Pending AI Button */}
        <button
          onClick={onTriagePending}
          disabled={triaging}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-medium transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${triaging ? "animate-spin" : ""}`} />
          <span>{triaging ? "AI Triaging…" : "Triage Pending (AI)"}</span>
        </button>

        {/* Poll Now Button */}
        <button
          onClick={onIngest}
          disabled={ingesting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${ingesting ? "animate-spin" : ""}`} />
          <span>{ingesting ? "Polling…" : "Poll Falcon"}</span>
        </button>
      </div>
    </header>
  );
}


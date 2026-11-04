"use client";

import { useEffect, useState } from "react";
import { Server, Laptop, Cloud, Eye, Lock, Radio } from "lucide-react";
import { Alert, api } from "@/lib/api";

interface EntityNode {
  key: string;
  label: string;
  platform: string;
  localIp: string;
  deviceId: string | null;
  maxSeverity: number;
  alertCount: number;
  latestTitle: string;
}

interface NetworkTopologyProps {
  refreshKey?: number;
  onSelectHost?: (hostname: string) => void;
  onContainEndpoint?: (hostname: string) => void;
}

export function NetworkTopology({
  refreshKey = 0,
  onSelectHost,
  onContainEndpoint,
}: NetworkTopologyProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<EntityNode | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getAlerts({ limit: 100 })
      .then((res) => {
        setAlerts(res.items);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // Group real alerts by hostname or product
  const entities: EntityNode[] = Object.values(
    alerts.reduce((acc, a) => {
      const key = a.hostname || a.product || "Unassigned Entity";
      if (!acc[key]) {
        acc[key] = {
          key,
          label: key,
          platform: a.platform || a.product || "Unknown Platform",
          localIp: "Recorded in alert detail",
          deviceId: a.hostname ? a.falcon_id.split(":")[1] || null : null,
          maxSeverity: a.severity,
          alertCount: 1,
          latestTitle: a.title,
        };
      } else {
        acc[key].alertCount += 1;
        if (a.severity > acc[key].maxSeverity) {
          acc[key].maxSeverity = a.severity;
          acc[key].latestTitle = a.title;
        }
      }
      return acc;
    }, {} as Record<string, EntityNode>)
  );

  useEffect(() => {
    if (entities.length > 0 && !selectedEntity) {
      setSelectedEntity(entities[0]);
    } else if (entities.length === 0) {
      setSelectedEntity(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts.length]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-zinc-400" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Affected Entities & Telemetry Topology
            </h3>
            <p className="text-xs text-zinc-400">
              Entities derived directly from ingested CrowdStrike Falcon detections.
            </p>
          </div>
        </div>
        <span className="text-xs text-zinc-400 font-mono">
          {entities.length} {entities.length === 1 ? "entity" : "entities"} with detections
        </span>
      </div>

      {/* Body: Real Entities or Empty State */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading telemetry entities...</div>
      ) : entities.length === 0 ? (
        <div className="p-12 text-center space-y-1">
          <div className="text-sm font-medium text-zinc-300">No telemetry data available</div>
          <p className="text-xs text-zinc-500">
            No active hosts or detections found in the database. Click &quot;Sync Telemetry&quot; to pull live events.
          </p>
        </div>
      ) : (
        <div className="flex flex-col xl:flex-row items-stretch">
          {/* Left: Dynamic Entity Graph */}
          <div className="flex-1 p-5 bg-zinc-950 flex items-center justify-center min-h-[260px]">
            <div className="w-full max-w-2xl flex items-center justify-between gap-6">
              {/* Source: CrowdStrike Falcon Cloud */}
              <div className="flex flex-col items-center text-center shrink-0">
                <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-200">
                  <Cloud className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-zinc-200 mt-2">Falcon Telemetry</span>
                <span className="text-[11px] text-zinc-500 font-mono">{alerts.length} total signals</span>
              </div>

              {/* Connector Line */}
              <div className="flex-1 border-t border-dashed border-zinc-700 relative" />

              {/* Real Ingested Target Entities */}
              <div className="flex flex-col gap-3 shrink-0">
                {entities.map((ent) => {
                  const isSelected = selectedEntity?.key === ent.key;
                  const isHigh = ent.maxSeverity >= 70;
                  return (
                    <button
                      key={ent.key}
                      onClick={() => setSelectedEntity(ent)}
                      className={`text-left px-3.5 py-2.5 rounded-lg border transition flex items-center gap-3 min-w-[220px] ${
                        isSelected
                          ? "bg-zinc-900 border-zinc-500"
                          : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-md ${
                          isHigh
                            ? "bg-red-950/60 text-red-400 border border-red-800/60"
                            : "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {ent.key.toLowerCase().includes("siem") ? (
                          <Server className="w-4 h-4" />
                        ) : (
                          <Laptop className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-zinc-100 truncate font-mono">
                          {ent.label}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {ent.alertCount} {ent.alertCount === 1 ? "detection" : "detections"} · Max Sev {ent.maxSeverity}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Selected Real Entity Inspector */}
          {selectedEntity && (
            <div className="xl:w-72 shrink-0 p-4 bg-zinc-900 border-t xl:border-t-0 xl:border-l border-zinc-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="border-b border-zinc-800 pb-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-100 font-mono truncate">
                    {selectedEntity.label}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                    Sev {selectedEntity.maxSeverity}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Platform / Source:</span>
                    <span className="text-zinc-200 font-mono">{selectedEntity.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Active Detections:</span>
                    <span className="text-zinc-100 font-semibold font-mono">{selectedEntity.alertCount}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-zinc-400 block mb-1">Latest Signal:</span>
                    <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-[11px]">
                      {selectedEntity.latestTitle}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex gap-2">
                <button
                  onClick={() => onSelectHost?.(selectedEntity.label)}
                  className="flex-1 py-1.5 px-2.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium transition flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Alerts</span>
                </button>
                <button
                  onClick={() => onContainEndpoint?.(selectedEntity.label)}
                  className="py-1.5 px-2.5 rounded-md bg-red-950/60 hover:bg-red-900/60 text-red-200 border border-red-800/60 text-xs font-medium transition flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Actions</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer with Real Counts Only */}
      <div className="px-5 py-2.5 border-t border-zinc-800 bg-zinc-950 grid grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-zinc-500 block text-[11px]">Affected Entities</span>
          <span className="font-semibold text-zinc-200 font-mono">{entities.length}</span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[11px]">Ingested Detections</span>
          <span className="font-semibold text-zinc-200 font-mono">{alerts.length}</span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[11px]">Peak Severity</span>
          <span className="font-semibold text-zinc-200 font-mono">
            {entities.length > 0 ? Math.max(...entities.map((e) => e.maxSeverity)) : "No data"}
          </span>
        </div>
      </div>
    </div>
  );
}

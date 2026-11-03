"use client";

import { useState } from "react";
import {
  ShieldAlert,
  Server,
  Laptop,
  Database,
  Globe,
  Radio,
  Wifi,
  ExternalLink,
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";

export interface TopologyNode {
  id: string;
  label: string;
  sublabel: string;
  type: "internet" | "firewall" | "switch" | "endpoint" | "server" | "database";
  status: "normal" | "warning" | "compromised" | "target";
  ip: string;
  agentId?: string;
  os?: string;
  x: number;
  y: number;
  contained?: boolean;
  alertCount?: number;
}

const DEFAULT_NODES: TopologyNode[] = [
  {
    id: "internet",
    label: "Internet",
    sublabel: "Adversary Origin",
    type: "internet",
    status: "compromised",
    ip: "198.51.100.24",
    x: 80,
    y: 150,
  },
  {
    id: "firewall",
    label: "Firewall",
    sublabel: "Perimeter Edge",
    type: "firewall",
    status: "normal",
    ip: "10.0.0.1",
    x: 230,
    y: 150,
  },
  {
    id: "switch",
    label: "Core Switch",
    sublabel: "SOC VLAN 10",
    type: "switch",
    status: "normal",
    ip: "10.0.1.1",
    x: 380,
    y: 150,
  },
  {
    id: "ws-001",
    label: "DESKTOP-6AUDB3T",
    sublabel: "Falcon Sensor (Active)",
    type: "endpoint",
    status: "compromised",
    ip: "10.0.1.142",
    agentId: "aid:7b91c0e44b82",
    os: "Windows 11 Pro 23H2",
    x: 540,
    y: 80,
    alertCount: 1,
  },
  {
    id: "ws-002",
    label: "WS-002",
    sublabel: "Workstation (Corp)",
    type: "endpoint",
    status: "normal",
    ip: "10.0.1.145",
    agentId: "aid:2a41d9c10f33",
    os: "Windows 11 Pro",
    x: 690,
    y: 80,
    alertCount: 0,
  },
  {
    id: "fin-srv",
    label: "FIN-SRV-01",
    sublabel: "Financial App Tier",
    type: "server",
    status: "warning",
    ip: "10.0.2.50",
    agentId: "aid:4f128e90a218",
    os: "Windows Server 2022",
    x: 540,
    y: 220,
    alertCount: 2,
  },
  {
    id: "db-prod",
    label: "DB-Prod",
    sublabel: "Target High Value Asset",
    type: "database",
    status: "target",
    ip: "10.0.2.100",
    os: "PostgreSQL Cluster",
    x: 690,
    y: 220,
    alertCount: 0,
  },
];

interface NetworkTopologyProps {
  onSelectHost?: (hostname: string) => void;
  onContainEndpoint?: (hostname: string) => void;
}

export function NetworkTopology({ onSelectHost, onContainEndpoint }: NetworkTopologyProps) {
  const [nodes, setNodes] = useState<TopologyNode[]>(DEFAULT_NODES);
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(nodes[3]); // default DESKTOP-6AUDB3T
  const [highlightAttackPathOnly, setHighlightAttackPathOnly] = useState(false);

  const getNodeIcon = (node: TopologyNode) => {
    switch (node.type) {
      case "internet":
        return <Globe className="w-4 h-4" />;
      case "firewall":
        return <Lock className="w-4 h-4" />;
      case "switch":
        return <Wifi className="w-4 h-4" />;
      case "endpoint":
        return <Laptop className="w-4 h-4" />;
      case "server":
        return <Server className="w-4 h-4" />;
      case "database":
        return <Database className="w-4 h-4" />;
    }
  };

  const getNodeColor = (status: TopologyNode["status"]) => {
    switch (status) {
      case "compromised":
        return {
          bg: "bg-red-500/15 border-red-500/60 text-red-400",
          glow: "shadow-[0_0_15px_rgba(239,68,68,0.35)]",
          badge: "bg-red-500/20 text-red-300 border-red-500/40",
          label: "Infected / Breached",
        };
      case "target":
        return {
          bg: "bg-amber-500/15 border-amber-500/60 text-amber-400",
          glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          label: "Target Asset",
        };
      case "warning":
        return {
          bg: "bg-orange-500/15 border-orange-500/60 text-orange-400",
          glow: "shadow-[0_0_15px_rgba(249,115,22,0.3)]",
          badge: "bg-orange-500/20 text-orange-300 border-orange-500/40",
          label: "Brute Force Pivot",
        };
      default:
        return {
          bg: "bg-cyan-500/10 border-cyan-500/40 text-cyan-400",
          glow: "shadow-[0_0_12px_rgba(6,182,212,0.2)]",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          label: "Operational",
        };
    }
  };

  return (
    <div className="bg-[#0E1420] border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Topology Header */}
      <div className="px-5 py-3.5 border-b border-slate-800/80 bg-[#0B101B]/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Radio className="w-4 h-4 stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Network Topology & Threat Blast Radius
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
                Active Telemetry Trace
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live hop-by-hop lateral movement mapping based on CrowdStrike Falcon detections.
            </p>
          </div>
        </div>

        {/* Legend & Filter Controls */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-semibold">Attack Path</span>
            </span>
            <span className="inline-flex items-center gap-1.5 ml-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-cyan-300">Normal Flow</span>
            </span>
          </div>

          <button
            onClick={() => setHighlightAttackPathOnly(!highlightAttackPathOnly)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] transition ${
              highlightAttackPathOnly
                ? "bg-red-500/20 border-red-500/40 text-red-300 font-bold"
                : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600"
            }`}
          >
            {highlightAttackPathOnly ? "Showing Attack Path" : "Show All Paths"}
          </button>
        </div>
      </div>

      {/* Interactive Topology Canvas */}
      <div className="relative p-6 bg-[#080C14] min-h-[320px] flex items-center justify-center overflow-x-auto">
        <svg
          viewBox="0 0 780 300"
          className="w-full max-w-[780px] h-[300px] select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="normalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="attackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.9" />
            </linearGradient>
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines background */}
          <g stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4">
            <line x1="0" y1="50" x2="780" y2="50" />
            <line x1="0" y1="150" x2="780" y2="150" />
            <line x1="0" y1="250" x2="780" y2="250" />
            <line x1="200" y1="0" x2="200" y2="300" />
            <line x1="400" y1="0" x2="400" y2="300" />
            <line x1="600" y1="0" x2="600" y2="300" />
          </g>

          {/* Normal Connection Wires */}
          {!highlightAttackPathOnly && (
            <g fill="none" strokeWidth="2" stroke="url(#normalGrad)" opacity="0.6">
              {/* Internet to Firewall */}
              <path d="M 80 150 L 230 150" />
              {/* Firewall to Switch */}
              <path d="M 230 150 L 380 150" />
              {/* Switch to WS-002 */}
              <path d="M 380 150 C 460 150, 460 80, 540 80 L 690 80" />
            </g>
          )}

          {/* Attack Path Wires (Glow & High Contrast) */}
          <g fill="none" strokeWidth="3" stroke="url(#attackGrad)" filter="url(#glowEffect)">
            {/* Internet -> Firewall -> Switch */}
            <path d="M 80 150 L 230 150 L 380 150" strokeDasharray="6 4" className="animate-[dash_1s_linear_infinite]" />
            {/* Switch -> WS-001 (Compromised Machine) */}
            <path d="M 380 150 C 450 150, 470 80, 540 80" strokeDasharray="6 4" />
            {/* Lateral movement from Switch/WS-001 -> FIN-SRV */}
            <path d="M 380 150 C 450 150, 470 220, 540 220" strokeDasharray="6 4" />
            {/* FIN-SRV -> DB-Prod (Target Asset) */}
            <path d="M 540 220 L 690 220" strokeDasharray="6 4" />
          </g>

          {/* Nodes Rendering */}
          {nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const colors = getNodeColor(node.status);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer transition-transform duration-200 hover:scale-110"
                onClick={() => setSelectedNode(node)}
              >
                {/* Node Outer Halo for Alerts / Compromise */}
                {node.status === "compromised" && (
                  <circle r="26" fill="rgba(239, 68, 68, 0.15)" className="animate-ping" opacity="0.75" />
                )}
                {node.status === "warning" && (
                  <circle r="24" fill="rgba(249, 115, 22, 0.15)" className="animate-pulse" />
                )}

                {/* Main Node Circle */}
                <circle
                  r="20"
                  fill="#0B101B"
                  stroke={isSelected ? "#38bdf8" : node.status === "compromised" ? "#ef4444" : node.status === "warning" ? "#f97316" : "#06b6d4"}
                  strokeWidth={isSelected ? "3" : "2"}
                  className="filter drop-shadow-md"
                />

                {/* Inner Icon representation */}
                <circle
                  r="13"
                  fill={node.status === "compromised" ? "#ef4444" : node.status === "warning" ? "#f97316" : "#06b6d4"}
                  fillOpacity="0.2"
                />

                {/* Status Dot */}
                <circle
                  cx="14"
                  cy="-14"
                  r="5"
                  fill={node.status === "compromised" ? "#ef4444" : node.status === "warning" ? "#f97316" : "#10b981"}
                  stroke="#080C14"
                  strokeWidth="1.5"
                />

                {/* Node Label Below */}
                <text
                  y="36"
                  textAnchor="middle"
                  fill={isSelected ? "#ffffff" : "#94a3b8"}
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {node.label}
                </text>

                {/* Node Sublabel */}
                <text
                  y="48"
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {node.ip}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Node Telemetry Floating Inspector */}
        {selectedNode && (
          <div className="absolute right-4 top-4 w-72 p-4 rounded-xl bg-[#0B101B]/95 border border-slate-700/80 shadow-2xl backdrop-blur-md space-y-3 z-10 font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-slate-800 text-cyan-400">
                  {getNodeIcon(selectedNode)}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white font-mono truncate max-w-[150px]">
                    {selectedNode.label}
                  </h4>
                  <div className="text-[10px] text-slate-400 font-mono">{selectedNode.ip}</div>
                </div>
              </div>
              <span
                className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${
                  getNodeColor(selectedNode.status).badge
                }`}
              >
                {getNodeColor(selectedNode.status).label}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between text-slate-400">
                <span>OS / Platform:</span>
                <span className="text-slate-200">{selectedNode.os || "Network Appliance"}</span>
              </div>
              {selectedNode.agentId && (
                <div className="flex justify-between text-slate-400">
                  <span>Falcon Agent AID:</span>
                  <span className="text-cyan-400 truncate max-w-[130px]">{selectedNode.agentId}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Associated Alerts:</span>
                <span
                  className={
                    (selectedNode.alertCount || 0) > 0 ? "text-red-400 font-bold" : "text-emerald-400"
                  }
                >
                  {selectedNode.alertCount || 0} active
                </span>
              </div>
            </div>

            {/* Quick Action Button */}
            {selectedNode.type === "endpoint" || selectedNode.type === "server" ? (
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => onSelectHost?.(selectedNode.label)}
                  className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold transition flex items-center justify-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>Inspect Detections</span>
                </button>
                {selectedNode.status === "compromised" && (
                  <button
                    onClick={() => onContainEndpoint?.(selectedNode.label)}
                    className="py-1 px-2 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/50 text-[10px] font-bold transition flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Isolate</span>
                  </button>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Bottom KPI Bar matching Image 1 */}
      <div className="px-5 py-3 border-t border-slate-800/80 bg-[#0B101B]/90 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Active Blast Radius</span>
          <span className="text-sm font-bold text-red-400">2 Endpoints Impacted</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Lateral Vector</span>
          <span className="text-sm font-bold text-amber-400">Brute Force & ML Binary</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Target Asset Protection</span>
          <span className="text-sm font-bold text-emerald-400">DB-Prod Segregated</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Network Containment</span>
          <span className="text-sm font-bold text-cyan-400">Falcon RTR Standby</span>
        </div>
      </div>
    </div>
  );
}


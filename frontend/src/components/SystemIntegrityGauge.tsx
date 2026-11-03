"use client";

import { useState } from "react";
import { Cpu, HardDrive, Activity, CheckCircle2, Shield, Wrench, RefreshCw } from "lucide-react";

interface SystemIntegrityGaugeProps {
  score?: number;
  onOpenDiagnostics?: () => void;
  falconConnected?: boolean;
}

export function SystemIntegrityGauge({
  score = 94,
  onOpenDiagnostics,
  falconConnected = true,
}: SystemIntegrityGaugeProps) {
  const [runningDiag, setRunningDiag] = useState(false);

  // SVG semi-circular gauge calculations:
  // Center (100, 100), Radius = 70.
  // Semi-circle from angle 180° (left) to 0° (right).
  // Arc length = PI * R = 3.14159 * 70 = 219.9
  const radius = 68;
  const circumference = Math.PI * radius; // half circle perimeter
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const handleRunDiagnostics = () => {
    setRunningDiag(true);
    setTimeout(() => {
      setRunningDiag(false);
      onOpenDiagnostics?.();
    }, 400);
  };

  return (
    <div className="bg-[#0E1420] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400 stroke-[1.75]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
            System Integrity & Controls
          </h3>
        </div>
        <button
          onClick={handleRunDiagnostics}
          disabled={runningDiag}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-800/60 text-[10px] font-mono font-semibold transition"
        >
          <Wrench className={`w-3 h-3 ${runningDiag ? "animate-spin" : ""}`} />
          <span>Diagnostics</span>
        </button>
      </div>

      {/* Resource meters (Memory, Processor, Storage) matching Image 2 */}
      <div className="grid grid-cols-3 gap-3 my-4 text-center">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase font-mono font-medium">Memory</div>
          <div className="text-sm font-bold text-white font-mono mt-0.5">72%</div>
          <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
            <div className="bg-cyan-500 h-full w-[72%]" />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase font-mono font-medium">Processor</div>
          <div className="text-sm font-bold text-white font-mono mt-0.5">41%</div>
          <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full w-[41%]" />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase font-mono font-medium">Storage</div>
          <div className="text-sm font-bold text-white font-mono mt-0.5">68%</div>
          <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
            <div className="bg-amber-500 h-full w-[68%]" />
          </div>
        </div>
      </div>

      {/* Semi-circular Neon SVG Dial matching Image 2 */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg viewBox="0 0 200 115" className="w-48 overflow-visible">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="70%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <filter id="gaugeGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background arc track */}
          <path
            d="M 25 100 A 75 75 0 0 1 175 100"
            fill="none"
            stroke="#1e293b"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Colored progress arc */}
          <path
            d="M 25 100 A 75 75 0 0 1 175 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter="url(#gaugeGlow)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score readout */}
        <div className="absolute bottom-1 text-center">
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight">{score}%</div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
            Overall Integrity Score
          </div>
        </div>
      </div>

      {/* Lower Security Controls Matrix matching Image 2 */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-[11px] font-mono">
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <span className="text-slate-400">WAF:</span>
          <span className="text-emerald-400 font-bold">Active</span>
        </div>
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <span className="text-slate-400">EDR:</span>
          <span className={falconConnected ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
            {falconConnected ? "Connected" : "Offline"}
          </span>
        </div>
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <span className="text-slate-400">IPS:</span>
          <span className="text-emerald-400 font-bold">Enabled</span>
        </div>
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <span className="text-slate-400">SSL:</span>
          <span className="text-emerald-400 font-bold">Valid</span>
        </div>
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <span className="text-slate-400">MFA:</span>
          <span className="text-emerald-400 font-bold">Required</span>
        </div>
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <span className="text-slate-400">VPN:</span>
          <span className="text-emerald-400 font-bold">Secure</span>
        </div>
      </div>
    </div>
  );
}


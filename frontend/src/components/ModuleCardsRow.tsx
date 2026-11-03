"use client";

import { Shield, FileSearch, Sliders, Zap, ArrowUpRight } from "lucide-react";
import { NavSection } from "./Sidebar";

interface ModuleCardsRowProps {
  onNavigate: (section: NavSection) => void;
}

export function ModuleCardsRow({ onNavigate }: ModuleCardsRowProps) {
  const modules = [
    {
      id: "hunting" as NavSection,
      title: "Threat Intelligence",
      description: "Threat actor context, IOC enrichment, and Falcon intelligence indicators.",
      icon: Shield,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20 group-hover:border-blue-500/50",
      accent: "group-hover:text-blue-300",
    },
    {
      id: "investigations" as NavSection,
      title: "AI Investigation",
      description: "Grounded telemetry analysis, process execution lineage, and triage evidence.",
      icon: FileSearch,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 group-hover:border-cyan-500/50",
      accent: "group-hover:text-cyan-300",
    },
    {
      id: "detections" as NavSection,
      title: "Detection Center",
      description: "Next-Gen SIEM & EDR correlation rules mapped to MITRE ATT&CK techniques.",
      icon: Sliders,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20 group-hover:border-purple-500/50",
      accent: "group-hover:text-purple-300",
    },
    {
      id: "automation" as NavSection,
      title: "Response Center",
      description: "Human-in-the-loop playbooks, host containment gates, and audit ledger.",
      icon: Zap,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/50",
      accent: "group-hover:text-amber-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {modules.map((m) => {
        const Icon = m.icon;
        return (
          <button
            key={m.id}
            onClick={() => onNavigate(m.id)}
            className="group text-left p-4 rounded-2xl bg-[#0E1420] border border-slate-800 hover:border-slate-700 hover:bg-[#121927] transition-all duration-200 shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl border transition ${m.color}`}>
                  <Icon className="w-5 h-5 stroke-[1.75]" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <h4 className={`text-sm font-bold text-white mt-3 font-mono ${m.accent}`}>
                {m.title}
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {m.description}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="text-slate-400">Open Module</span>
              <span className="text-cyan-400 font-semibold group-hover:underline">Launch →</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}


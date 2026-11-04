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
      title: "Threat Hunting",
      description: "Query telemetry and stage custom IOC prevention rules.",
      icon: Shield,
    },
    {
      id: "investigations" as NavSection,
      title: "Investigations",
      description: "Inspect alert telemetry, process lineage, and triage findings.",
      icon: FileSearch,
    },
    {
      id: "detections" as NavSection,
      title: "Detection Rules",
      description: "View active detection rules derived from ingested alerts.",
      icon: Sliders,
    },
    {
      id: "automation" as NavSection,
      title: "Response Approvals",
      description: "Review and authorize pending containment and IOC actions.",
      icon: Zap,
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
            className="group text-left p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 transition" />
              </div>
              <h4 className="text-sm font-semibold text-zinc-100 mt-3">
                {m.title}
              </h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {m.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import {
  LayoutDashboard,
  Sparkles,
  Crosshair,
  ShieldAlert,
  Sliders,
  Zap,
  Plug,
  SlidersHorizontal,
  Shield,
  Layers,
  ChevronRight,
  Database,
  Radio,
} from "lucide-react";

export type NavSection =
  | "overview"
  | "investigations"
  | "hunting"
  | "incidents"
  | "detections"
  | "automation"
  | "integrations"
  | "settings";

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  pendingApprovalsCount: number;
  criticalAlertsCount: number;
  falconConnected: boolean;
  onOpenSettings: () => void;
}

export function Sidebar({
  activeSection,
  onSelectSection,
  pendingApprovalsCount,
  criticalAlertsCount,
  falconConnected,
  onOpenSettings,
}: SidebarProps) {
  const navItems: {
    id: NavSection;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: "overview",
      label: "SOC Overview",
      sublabel: "Command center & briefing",
      icon: LayoutDashboard,
    },
    {
      id: "investigations",
      label: "AI Investigations",
      sublabel: "Evidence & timeline",
      icon: Sparkles,
      badge: criticalAlertsCount > 0 ? criticalAlertsCount : undefined,
      badgeColor: "bg-red-500/20 text-red-400 border border-red-500/30",
    },
    {
      id: "hunting",
      label: "Threat Hunting",
      sublabel: "NL-to-CQL query engine",
      icon: Crosshair,
    },
    {
      id: "incidents",
      label: "Incidents",
      sublabel: "Case lifecycle & notes",
      icon: ShieldAlert,
    },
    {
      id: "detections",
      label: "Detection Engineering",
      sublabel: "Rules & MITRE coverage",
      icon: Sliders,
    },
    {
      id: "automation",
      label: "Automation / SOAR",
      sublabel: "Authorizations & playbooks",
      icon: Zap,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse",
    },
    {
      id: "integrations",
      label: "Integrations Hub",
      sublabel: "Falcon & LogScale status",
      icon: Plug,
    },
    {
      id: "settings",
      label: "Settings & Audit",
      sublabel: "Ledger & configuration",
      icon: SlidersHorizontal,
    },
  ];

  return (
    <aside className="w-64 bg-[#0B101B] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none shadow-xl">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-slate-800/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-sm shadow-cyan-950">
              <Shield className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white font-sans">AISOC</span>
                <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.2 rounded font-mono font-semibold">
                  IN-HOUSE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">SecOps & SOAR Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Navigation Rail
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                  isActive
                    ? "bg-slate-900 border border-cyan-500/40 text-white shadow-md shadow-cyan-950/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg transition ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300"
                        : "text-slate-500 group-hover:text-slate-300 group-hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[1.75]" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`text-xs font-semibold tracking-tight truncate ${
                        isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate font-normal">
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                      item.badgeColor ?? "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Tenant & Environment Health Badge */}
      <div className="p-3 border-t border-slate-800/70 bg-[#080C14] space-y-2">
        <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Radio
              className={`w-3.5 h-3.5 stroke-[2] ${
                falconConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"
              }`}
            />
            <div>
              <div className="text-[11px] font-semibold text-slate-200">
                {falconConnected ? "Falcon US-2 Live" : "Falcon Offline"}
              </div>
              <div className="text-[9px] text-slate-500 font-mono">Tenant Connected</div>
            </div>
          </div>

          <button
            onClick={onOpenSettings}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Configure connection settings"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 stroke-[1.75]" />
          </button>
        </div>
      </div>
    </aside>
  );
}


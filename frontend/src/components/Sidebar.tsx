"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  FileSearch,
  Crosshair,
  ShieldAlert,
  Sliders,
  Zap,
  Plug,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
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
  const [collapsed, setCollapsed] = useState(false);

  const navItems: {
    id: NavSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      id: "investigations",
      label: "Investigations",
      icon: FileSearch,
      badge: criticalAlertsCount > 0 ? criticalAlertsCount : undefined,
      badgeColor: "bg-red-500/20 text-red-400 border border-red-500/30",
    },
    {
      id: "hunting",
      label: "Threat Hunting",
      icon: Crosshair,
    },
    {
      id: "incidents",
      label: "Incidents",
      icon: ShieldAlert,
    },
    {
      id: "detections",
      label: "Detection Rules",
      icon: Sliders,
    },
    {
      id: "automation",
      label: "Automation",
      icon: Zap,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: Plug,
    },
    {
      id: "settings",
      label: "Settings & Audit",
      icon: SlidersHorizontal,
    },
  ];

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-60"
      } bg-[#0B101B] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none shadow-xl transition-all duration-200`}
    >
      {/* Brand Header */}
      <div>
        <div className="p-3.5 border-b border-slate-800/70 flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center justify-between w-full">
              <span className="font-bold text-base tracking-tight text-white font-sans truncate">
                Vektor
              </span>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4 stroke-[1.75]" />
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                onClick={() => setCollapsed(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4 stroke-[1.75]" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  collapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2"
                } rounded-xl text-left transition-all duration-150 group ${
                  isActive
                    ? "bg-slate-900 border border-cyan-500/40 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-1 rounded-md transition ${
                      isActive
                        ? "text-cyan-400"
                        : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[1.75]" />
                  </div>
                  {!collapsed && (
                    <span
                      className={`text-xs font-medium tracking-tight truncate ${
                        isActive ? "text-white font-semibold" : "text-slate-300 group-hover:text-white"
                      }`}
                    >
                      {item.label}
                    </span>
                  )}
                </div>

                {!collapsed && item.badge !== undefined && (
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

      {/* Bottom Tenant Connection Status */}
      <div className="p-2.5 border-t border-slate-800/70 bg-[#080C14]">
        {!collapsed ? (
          <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Radio
                className={`w-3 h-3 stroke-[2] shrink-0 ${
                  falconConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"
                }`}
              />
              <span className="text-[11px] font-medium text-slate-300 truncate">
                {falconConnected ? "CrowdStrike Live" : "Offline"}
              </span>
            </div>

            <button
              onClick={onOpenSettings}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Settings"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[1.75]" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenSettings}
            className="w-full flex justify-center p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Settings"
          >
            <SlidersHorizontal className="w-4 h-4 stroke-[1.75]" />
          </button>
        )}
      </div>
    </aside>
  );
}

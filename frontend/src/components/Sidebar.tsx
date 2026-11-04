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
        collapsed ? "w-16" : "w-56"
      } bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between shrink-0 select-none transition-all duration-200`}
    >
      {/* Brand Header */}
      <div>
        <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-sm tracking-tight text-zinc-100 font-sans truncate">
                Vektor
              </span>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                onClick={() => setCollapsed(false)}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  collapsed ? "justify-center px-2 py-2" : "justify-between px-2.5 py-2"
                } rounded-md text-left transition group ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`transition ${
                      isActive ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {!collapsed && (
                    <span
                      className={`text-xs truncate ${
                        isActive ? "text-zinc-100 font-medium" : "text-zinc-400 group-hover:text-zinc-200"
                      }`}
                    >
                      {item.label}
                    </span>
                  )}
                </div>

                {!collapsed && item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-medium ${
                      item.badgeColor ?? "bg-zinc-800 text-zinc-300"
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
      <div className="p-2.5 border-t border-zinc-800 bg-zinc-950">
        {!collapsed ? (
          <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Radio
                className={`w-3 h-3 shrink-0 ${
                  falconConnected ? "text-emerald-400" : "text-amber-400"
                }`}
              />
              <span className="text-xs font-medium text-zinc-300 truncate">
                {falconConnected ? "CrowdStrike Live" : "Offline"}
              </span>
            </div>

            <button
              onClick={onOpenSettings}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"
              title="Settings"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenSettings}
            className="w-full flex justify-center p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"
            title="Settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

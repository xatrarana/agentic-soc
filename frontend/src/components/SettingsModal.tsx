"use client";

import { useEffect, useState } from "react";
import {
  X,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  KeyRound,
  Globe,
  Trash2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { DiagnosticResult, FalconSettings, api } from "@/lib/api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const REGION_PRESETS = [
  { label: "US-2 (api.us-2.crowdstrike.com)", url: "https://api.us-2.crowdstrike.com" },
  { label: "US-1 (api.crowdstrike.com)", url: "https://api.crowdstrike.com" },
  { label: "EU-1 (api.eu-1.crowdstrike.com)", url: "https://api.eu-1.crowdstrike.com" },
  { label: "US-GOV-1 (api.laggar.gcw.crowdstrike.com)", url: "https://api.laggar.gcw.crowdstrike.com" },
];

export function SettingsModal({ isOpen, onClose, onSaved }: SettingsModalProps) {
  const [settings, setSettings] = useState<FalconSettings | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api.us-2.crowdstrike.com");
  const [isMock, setIsMock] = useState(false);
  const [saving, setSaving] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [purging, setPurging] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (isOpen) {
      api
        .getSettings()
        .then((s) => {
          setSettings(s);
          setBaseUrl(s.base_url || "https://api.us-2.crowdstrike.com");
          setIsMock(s.mode === "mock");
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) {
      setMessage({ text: "Client ID and Client Secret are required.", type: "error" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.saveSettings({
        client_id: clientId,
        client_secret: clientSecret,
        base_url: baseUrl,
        falcon_mock: isMock,
      });
      setMessage({
        text: res.ok
          ? "Credentials updated successfully. OAuth2 authenticated."
          : "Credentials saved, but authentication verification returned warnings.",
        type: res.ok ? "success" : "error",
      });
      onSaved();
    } catch (err) {
      setMessage({ text: `Failed updating credentials: ${err}`, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleRunDiagnostic = async () => {
    setDiagnosing(true);
    setMessage(null);
    try {
      const res = await api.runDiagnostics();
      setDiagnostic(res);
    } catch (err) {
      setMessage({ text: `Diagnostic execution failed: ${err}`, type: "error" });
    } finally {
      setDiagnosing(false);
    }
  };

  const handlePurgeMockData = async () => {
    if (!confirm("This will permanently remove historical and mock alerts to start with clean live telemetry. Continue?")) {
      return;
    }
    setPurging(true);
    try {
      await api.purgeData();
      setMessage({ text: "Database purged successfully. Ready for clean live ingestion.", type: "success" });
      onSaved();
    } catch (err) {
      setMessage({ text: `Failed purging data: ${err}`, type: "error" });
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0E1420] border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <Sliders className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">Platform Configuration</h2>
              <p className="text-xs text-slate-400">CrowdStrike Falcon API connection & diagnostic telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5 stroke-[1.75]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {message && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                  : "bg-red-950/40 border-red-800 text-red-300"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Current Status Overview */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs">
            <div>
              <div className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Active Client Key</div>
              <div className="font-mono text-slate-200 mt-0.5">{settings?.client_id_masked || "Checking..."}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Cloud Target</div>
              <div className="font-mono text-slate-200 mt-0.5">{settings?.base_url || "—"}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Mode</div>
              <span
                className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  settings?.mode === "live"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                {settings?.mode || "Unknown"}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="text-xs font-semibold text-slate-300 tracking-wider uppercase flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-red-400 stroke-[1.75]" />
              <span>Update CrowdStrike API Credentials</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Falcon Client ID</label>
                <input
                  type="text"
                  placeholder="Paste your 32-character Client ID"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Falcon Client Secret</label>
                <input
                  type="password"
                  placeholder="Paste your Client Secret"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Falcon Cloud Region</span>
                  </label>
                  <select
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500"
                  >
                    {REGION_PRESETS.map((p) => (
                      <option key={p.url} value={p.url}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Ingestion Mode</label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="mode"
                        checked={!isMock}
                        onChange={() => setIsMock(false)}
                        className="text-red-500 focus:ring-0"
                      />
                      <span className="font-medium text-slate-200">Live Tenant Ingestion</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="mode"
                        checked={isMock}
                        onChange={() => setIsMock(true)}
                        className="text-red-500 focus:ring-0"
                      />
                      <span className="font-medium text-slate-400">Mock Sandbox</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleRunDiagnostic}
                disabled={diagnosing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${diagnosing ? "animate-spin" : ""}`} />
                <span>{diagnosing ? "Probing Tenant..." : "Test Connection & Scopes"}</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Credentials"}
              </button>
            </div>
          </form>

          {/* Diagnostic Results */}
          {diagnostic && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 stroke-[1.75]" />
                  <span>Tenant Scope Verification Report</span>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    diagnostic.connected
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : "bg-red-950 text-red-400 border border-red-800"
                  }`}
                >
                  {diagnostic.connected ? "Connection Healthy" : "Action Required"}
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {diagnostic.scopes.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-[#0E1420] border border-slate-800/80 text-xs"
                  >
                    {s.status === "ok" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : s.status === "failed" ? (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{s.name}</span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {s.scope_required}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{s.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Database Maintenance / Purge */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-300">Cleanse Database</div>
              <div className="text-[11px] text-slate-500">Purge previous mock alerts and reset ingest checkpoints</div>
            </div>
            <button
              type="button"
              onClick={handlePurgeMockData}
              disabled={purging}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/60 text-xs font-medium transition disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>{purging ? "Purging..." : "Purge Mock Data"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


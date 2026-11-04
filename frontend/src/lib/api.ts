export interface Alert {
  id: number;
  falcon_id: string;
  title: string;
  description: string | null;
  severity: number;
  severity_name: string;
  status: string;
  falcon_status: string | null;
  product: string | null;
  tactic: string | null;
  tactic_id: string | null;
  technique: string | null;
  technique_id: string | null;
  device_id: string | null;
  hostname: string | null;
  platform: string | null;
  local_ip: string | null;
  external_ip: string | null;
  user_name: string | null;
  filename: string | null;
  cmdline: string | null;
  sha256: string | null;
  falcon_created_at: string | null;
  ingested_at: string;
  ai_verdict: "true_positive" | "false_positive" | "needs_review" | null;
  ai_confidence: number | null;
  ai_summary: string | null;
  case_id: number | null;
}

export interface AlertDetail extends Alert {
  raw: Record<string, unknown>;
}

export interface Incident {
  id: number;
  falcon_id: string;
  name: string;
  description: string | null;
  fine_score: number;
  falcon_status: string | null;
  state: string | null;
  hostnames: string[];
  device_ids: string[];
  tactics: string[];
  techniques: string[];
  start: string | null;
  end: string | null;
  modified_at: string | null;
}

export interface Action {
  id: number;
  case_id: number | null;
  alert_id: number | null;
  action_type: string;
  params: Record<string, unknown>;
  risk_tier: "safe" | "destructive";
  status: "pending_approval" | "approved" | "rejected" | "executed" | "failed";
  reason: string | null;
  proposed_by: string;
  decided_by: string | null;
  created_at: string;
  decided_at: string | null;
  executed_at: string | null;
  error: string | null;
}

export interface Case {
  id: number;
  title: string;
  status: string;
  severity: number;
  verdict: string | null;
  confidence: number | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
  alerts: Alert[];
  actions: Action[];
}

export interface CountItem {
  key: string;
  count: number;
}

export interface Stats {
  total_alerts: number;
  open_alerts: number;
  total_incidents: number;
  by_severity: CountItem[];
  by_status: CountItem[];
  top_hosts: CountItem[];
  top_techniques: CountItem[];
}

export interface FalconHealth {
  ok: boolean;
  mode: string;
  errors?: unknown;
}

export interface Checkpoint {
  source: string;
  last_timestamp: string | null;
  last_run_at: string | null;
  last_fetched: number;
  last_new: number;
  last_error: string | null;
}

export interface AuditEntry {
  id: number;
  ts: string;
  actor: string;
  event: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
}

export interface ScopeCheckResult {
  name: string;
  scope_required: string;
  status: "ok" | "failed" | "unsupported";
  message: string;
}

export interface DiagnosticResult {
  connected: boolean;
  mode: string;
  base_url: string;
  client_id_masked: string;
  scopes: ScopeCheckResult[];
}

export interface CitationItem {
  alert_id: number;
  title: string;
  severity: number;
  hostname: string | null;
}

export interface BriefingResponse {
  threat_level: "Elevated" | "High" | "Critical" | "Guarded" | "Normal" | "Low" | "No Data" | string;
  threat_score: number;
  time_window: string;
  source_summary: string;
  executive_summary: string;
  key_findings: string[];
  citations: CitationItem[];
  endpoints_at_risk: string[];
  recommended_focus: string;
}

export interface FalconSettings {
  configured: boolean;
  mode: string;
  client_id_masked: string;
  base_url: string;
  anthropic_configured: boolean;
  anthropic_model: string;
}

export interface AlertChatResponse {
  answer: string;
  observed_facts: string[];
  inferred_analysis: string;
  recommended_next_step: string;
}

export interface HuntResultRow {
  id: number;
  timestamp: string;
  hostname: string;
  user_name: string;
  title: string;
  severity: number;
  technique: string;
  indicator: string;
}

export interface HuntQueryResponse {
  generated_fql: string;
  explanation: string;
  total_matches: number;
  results: HuntResultRow[];
}

export interface DetectionRuleItem {
  id: string;
  name: string;
  source: string;
  mitre_tactic: string;
  mitre_technique_id: string;
  mitre_technique: string;
  severity: number;
  status: string;
  query_logic: string;
  hit_count: number;
  false_positive_rate: string;
}

export interface RuleTestResponse {
  evaluated_events: number;
  matched_count: number;
  matches: { id: number; title: string; hostname: string; severity: number }[];
  assessment: string;
}

export const ALERT_STATUSES = [
  "new",
  "triaging",
  "triaged",
  "in_progress",
  "closed",
  "false_positive",
] as const;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${errorBody}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getBriefing: () => request<BriefingResponse>("/api/briefing"),
  getStats: () => request<Stats>("/api/stats"),
  getFalconHealth: () => request<FalconHealth>("/health/falcon"),
  getIngestStatus: () => request<Checkpoint[]>("/api/ingest/status"),
  runIngest: () => request<Record<string, unknown>>("/api/ingest/run", { method: "POST" }),
  getAlerts: (params: {
    q?: string;
    status?: string;
    min_severity?: number;
    hostname?: string;
    limit?: number;
    offset?: number;
  }) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
    return request<{ items: Alert[]; total: number }>(`/api/alerts?${qs}`);
  },
  getAlert: (id: number) => request<AlertDetail>(`/api/alerts/${id}`),
  updateAlertStatus: (id: number, status: string) =>
    request<AlertDetail>(`/api/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  triageAlert: (id: number) =>
    request<AlertDetail>(`/api/alerts/${id}/triage`, { method: "POST" }),
  triagePending: (limit: number = 10) =>
    request<{ triaged: number }>(`/api/alerts/triage-pending?limit=${limit}`, { method: "POST" }),
  getCases: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return request<Case[]>(`/api/cases${qs}`);
  },
  getCase: (id: number) => request<Case>(`/api/cases/${id}`),
  getActions: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return request<Action[]>(`/api/actions${qs}`);
  },
  decideAction: (id: number, decision: "approved" | "rejected", comment?: string) =>
    request<Action>(`/api/actions/${id}/decide`, {
      method: "POST",
      body: JSON.stringify({ decision, decided_by: "analyst-admin", comment }),
    }),
  getIncidents: () => request<{ items: Incident[]; total: number }>("/api/incidents?limit=100"),
  getAuditLog: (limit: number = 50) => request<AuditEntry[]>(`/api/audit?limit=${limit}`),
  purgeData: () => request<{ status: string; message: string }>("/api/purge-data", { method: "POST" }),
  getSettings: () => request<FalconSettings>("/api/settings/falcon"),
  saveSettings: (body: {
    client_id: string;
    client_secret: string;
    base_url: string;
    falcon_mock: boolean;
  }) =>
    request<{ status: string; ok: boolean; mode: string; base_url: string }>("/api/settings/falcon", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  runDiagnostics: () => request<DiagnosticResult>("/api/settings/falcon/test", { method: "POST" }),
  chatAlert: (alertId: number, question: string) =>
    request<AlertChatResponse>(`/api/alerts/${alertId}/chat`, {
      method: "POST",
      body: JSON.stringify({ question }),
    }),
  runThreatHunt: (prompt: string, time_range: string = "24h") =>
    request<HuntQueryResponse>("/api/hunting/query", {
      method: "POST",
      body: JSON.stringify({ prompt, time_range }),
    }),
  pushCustomIoc: (indicator_type: string, value: string, reason?: string) =>
    request<{ status: string; action_id: number; message: string }>("/api/hunting/ioc", {
      method: "POST",
      body: JSON.stringify({ indicator_type, value, reason }),
    }),
  getDetectionRules: () => request<DetectionRuleItem[]>("/api/detections/rules"),
  testDetectionRule: (query_logic: string) =>
    request<RuleTestResponse>("/api/detections/test", {
      method: "POST",
      body: JSON.stringify({ query_logic }),
    }),
  addCaseNote: (caseId: number, author: string, note: string, status?: string) =>
    request<{ status: string; case_id: number; summary: string }>(`/api/cases/${caseId}/notes`, {
      method: "POST",
      body: JSON.stringify({ author, note, status }),
    }),
};


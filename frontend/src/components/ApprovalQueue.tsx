"use client";

import { useEffect, useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Hash,
  Clock,
  Radio,
} from "lucide-react";
import { Action, api } from "@/lib/api";

interface ApprovalQueueProps {
  refreshKey: number;
  onActionDecided: () => void;
}

export function ApprovalQueue({ refreshKey, onActionDecided }: ApprovalQueueProps) {
  const [actions, setActions] = useState<Action[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("pending_approval");
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState<string>("");
  const [rejectModalActionId, setRejectModalActionId] = useState<number | null>(null);

  const fetchActions = () => {
    setLoading(true);
    api
      .getActions(filterStatus || undefined)
      .then(setActions)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchActions();
  }, [filterStatus, refreshKey]);

  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      await api.decideAction(id, "approved");
      fetchActions();
      onActionDecided();
    } catch (err) {
      alert(`Approval execution failed: ${err}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessingId(id);
    try {
      await api.decideAction(id, "rejected", rejectComment);
      setRejectModalActionId(null);
      setRejectComment("");
      fetchActions();
      onActionDecided();
    } catch (err) {
      alert(`Rejection failed: ${err}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls & Filter Tabs */}
      <div className="flex items-center justify-between bg-surface border border-border-subtle p-3 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            Human-in-the-Loop SOAR Governance
          </h2>
        </div>

        <div className="flex items-center gap-1.5 bg-canvas p-1 rounded-lg border border-border-subtle/50 text-xs">
          {[
            { key: "pending_approval", label: "Pending Approval" },
            { key: "executed", label: "Executed" },
            { key: "rejected", label: "Rejected" },
            { key: "", label: "All Actions" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1 rounded font-medium transition ${
                filterStatus === tab.key
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions List */}
      <div className="space-y-3">
        {actions.map((act) => (
          <div
            key={act.id}
            className={`border rounded-xl p-4 transition shadow-sm ${
              act.status === "pending_approval"
                ? "bg-red-950/20 border-red-800/60"
                : act.status === "executed"
                ? "bg-surface border-border-subtle"
                : "bg-surface/60 border-border-subtle"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left Column: Action Details */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                      act.risk_tier === "destructive"
                        ? "bg-red-600/30 text-red-300 border border-red-500/40"
                        : "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                    }`}
                  >
                    {act.risk_tier} action
                  </span>

                  <span className="font-mono text-sm font-bold text-white">
                    {act.action_type.replace("_", " ").toUpperCase()}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      act.status === "pending_approval"
                        ? "bg-amber-950 text-amber-400 border border-amber-800 animate-pulse"
                        : act.status === "executed"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {act.status.replace("_", " ")}
                  </span>
                </div>

                {/* Justification Reason */}
                <p className="text-xs text-gray-200 bg-canvas/40 p-2.5 rounded-lg border border-border-subtle/50">
                  <span className="text-gray-400 font-semibold mr-1.5">Rationale:</span>
                  {act.reason || "No rationale provided."}
                </p>

                {/* Parameters */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-400">
                  {Boolean(act.params?.hostname) && (
                    <span className="flex items-center gap-1 text-cyan-300">
                      <Server className="w-3.5 h-3.5" />
                      Host: {String(act.params.hostname)}
                    </span>
                  )}
                  {Boolean(act.params?.device_id) && (
                    <span className="text-gray-400">AID: {String(act.params.device_id)}</span>
                  )}
                  {Boolean(act.params?.value) && (
                    <span className="flex items-center gap-1 text-purple-300">
                      <Hash className="w-3.5 h-3.5" />
                      Indicator: {String(act.params.value)}
                    </span>
                  )}
                  <span className="text-gray-500">Proposed by: {act.proposed_by}</span>
                  {Boolean(act.decided_by) && (
                    <span className="text-gray-400">Decided by: {act.decided_by}</span>
                  )}
                </div>

                {act.error && (
                  <div className="text-xs text-red-400 bg-red-950/40 p-2 rounded border border-red-900">
                    Error: {act.error}
                  </div>
                )}
              </div>

              {/* Right Column: Approval / Rejection Buttons */}
              {act.status === "pending_approval" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRejectModalActionId(act.id)}
                    disabled={processingId === act.id}
                    className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold border border-gray-700 transition disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(act.id)}
                    disabled={processingId === act.id}
                    className="px-3.5 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
                  >
                    {processingId === act.id ? "Executing…" : "Approve & Execute"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {actions.length === 0 && !loading && (
          <div className="bg-surface border border-border-subtle p-8 rounded-xl text-center text-gray-400 text-xs">
            No SOAR response actions in state &apos;{filterStatus || "all"}&apos;.
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalActionId !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border-subtle rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-sm">Reject Response Action</h3>
            <p className="text-xs text-gray-400">
              Provide an optional justification for rejecting this automated response recommendation.
            </p>
            <textarea
              placeholder="e.g. Legitimate administrative scheduled task confirmed with DevOps..."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              className="w-full h-24 bg-canvas border border-border-subtle rounded-lg p-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalActionId(null)}
                className="px-3 py-1.5 rounded bg-gray-800 text-gray-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectModalActionId)}
                className="px-3.5 py-1.5 rounded bg-red-600 text-white text-xs font-semibold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


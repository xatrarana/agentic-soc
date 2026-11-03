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
      <div className="flex items-center justify-between bg-[#0E1420] border border-slate-800 p-3 rounded-xl shadow-md">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400 stroke-[1.75]" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            Response Action Authorizations
          </h2>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          {[
            { key: "pending_approval", label: "Pending Authorization" },
            { key: "executed", label: "Executed" },
            { key: "rejected", label: "Declined" },
            { key: "", label: "All Actions" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1 rounded font-medium transition ${
                filterStatus === tab.key
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
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
            className={`border rounded-xl p-4 transition shadow-md ${
              act.status === "pending_approval"
                ? "bg-red-950/20 border-red-800/60"
                : act.status === "executed"
                ? "bg-[#0E1420] border-slate-800"
                : "bg-[#0E1420]/60 border-slate-800"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left Column: Action Details */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      act.risk_tier === "destructive"
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}
                  >
                    {act.risk_tier} action
                  </span>

                  <span className="font-mono text-xs font-bold text-white">
                    {act.action_type.replace("_", " ").toUpperCase()}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      act.status === "pending_approval"
                        ? "bg-amber-950 text-amber-400 border border-amber-800"
                        : act.status === "executed"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {act.status.replace("_", " ")}
                  </span>
                </div>

                {/* Justification Reason */}
                <p className="text-xs text-slate-200 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-semibold mr-1.5">Technical Justification:</span>
                  {act.reason || "Automatic containment recommendation based on telemetry correlation."}
                </p>

                {/* Parameters */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                  {Boolean(act.params?.hostname) && (
                    <span className="flex items-center gap-1 text-cyan-300">
                      <Server className="w-3.5 h-3.5 stroke-[1.75]" />
                      Target: {String(act.params.hostname)}
                    </span>
                  )}
                  {Boolean(act.params?.device_id) && (
                    <span className="text-slate-400">AID: {String(act.params.device_id)}</span>
                  )}
                  {Boolean(act.params?.value) && (
                    <span className="flex items-center gap-1 text-purple-300">
                      <Hash className="w-3.5 h-3.5 stroke-[1.75]" />
                      IOC: {String(act.params.value)}
                    </span>
                  )}
                  <span className="text-slate-500">Origin: {act.proposed_by}</span>
                  {Boolean(act.decided_by) && (
                    <span className="text-slate-400">Authorized by: {act.decided_by}</span>
                  )}
                </div>

                {act.error && (
                  <div className="text-xs text-red-400 bg-red-950/40 p-2 rounded border border-red-900">
                    Execution Error: {act.error}
                  </div>
                )}
              </div>

              {/* Right Column: Approval / Rejection Buttons */}
              {act.status === "pending_approval" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRejectModalActionId(act.id)}
                    disabled={processingId === act.id}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleApprove(act.id)}
                    disabled={processingId === act.id}
                    className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
                  >
                    {processingId === act.id ? "Executing..." : "Authorize & Execute"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {actions.length === 0 && !loading && (
          <div className="bg-[#0E1420] border border-slate-800 p-8 rounded-xl text-center text-slate-400 text-xs">
            No response actions currently awaiting authorization.
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalActionId !== null && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0E1420] border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-sm">Decline Response Action</h3>
            <p className="text-xs text-slate-400">
              Provide justification for declining this containment recommendation.
            </p>
            <textarea
              placeholder="e.g. Scheduled administrative maintenance confirmed with system owner..."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalActionId(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectModalActionId)}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

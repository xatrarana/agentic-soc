"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Server, Hash } from "lucide-react";
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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-100">
            Response Action Authorizations
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-md border border-zinc-800 text-xs">
          {[
            { key: "pending_approval", label: "Pending Approval" },
            { key: "executed", label: "Executed" },
            { key: "rejected", label: "Declined" },
            { key: "", label: "All Actions" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1 rounded font-medium transition ${
                filterStatus === tab.key
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
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
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      act.risk_tier === "destructive"
                        ? "bg-red-500/15 text-red-400 border border-red-500/30"
                        : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                    }`}
                  >
                    {act.risk_tier}
                  </span>

                  <span className="font-mono text-xs font-semibold text-zinc-100">
                    {act.action_type.replace("_", " ")}
                  </span>

                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {act.status.replace("_", " ")}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 bg-zinc-950 p-2.5 rounded-md border border-zinc-800">
                  <span className="text-zinc-400 font-medium mr-1.5">Reason:</span>
                  {act.reason || "No reason recorded."}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400">
                  {Boolean(act.params?.hostname) && (
                    <span className="flex items-center gap-1 text-zinc-300">
                      <Server className="w-3.5 h-3.5" />
                      Host: {String(act.params.hostname)}
                    </span>
                  )}
                  {Boolean(act.params?.device_id) && (
                    <span>AID: {String(act.params.device_id)}</span>
                  )}
                  {Boolean(act.params?.value) && (
                    <span className="flex items-center gap-1 text-zinc-300">
                      <Hash className="w-3.5 h-3.5" />
                      IOC: {String(act.params.value)}
                    </span>
                  )}
                  <span>Proposed by: {act.proposed_by}</span>
                  {Boolean(act.decided_by) && (
                    <span>Decided by: {act.decided_by}</span>
                  )}
                </div>

                {act.error && (
                  <div className="text-xs text-red-400 bg-red-950/40 p-2 rounded border border-red-900">
                    Error: {act.error}
                  </div>
                )}
              </div>

              {act.status === "pending_approval" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRejectModalActionId(act.id)}
                    disabled={processingId === act.id}
                    className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleApprove(act.id)}
                    disabled={processingId === act.id}
                    className="px-3.5 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition disabled:opacity-50"
                  >
                    {processingId === act.id ? "Executing..." : "Approve & Execute"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {actions.length === 0 && !loading && (
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg text-center text-zinc-500 text-xs">
            No actions found for this filter.
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalActionId !== null && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="font-semibold text-zinc-100 text-sm">Decline Response Action</h3>
            <p className="text-xs text-zinc-400">
              Provide a reason for declining this action.
            </p>
            <textarea
              placeholder="Enter reason..."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-md p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalActionId(null)}
                className="px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectModalActionId)}
                className="px-3.5 py-1.5 rounded-md bg-zinc-100 text-zinc-900 text-xs font-semibold"
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

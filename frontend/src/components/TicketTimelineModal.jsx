import { useState, useEffect } from "react";
import { X, Clock, ShieldCheck, Camera, UserCheck } from "lucide-react";
import axiosClient from "../api/axiosClient";

export default function TicketTimelineModal({ issue, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!issue) return;
    axiosClient
      .get(`/public/issues/${issue.id}/logs`)
      .then((res) => setLogs(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [issue]);

  if (!issue) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                {issue.ticketCode}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                {issue.category}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                {issue.duplicateCount} Merged Citizen Reports
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1.5">{issue.title}</h2>
            <p className="text-sm text-slate-600 mt-1">{issue.description}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <div>
              <div className="text-slate-500">Assigned Engineer</div>
              <div className="font-bold text-slate-900">
                {issue.assignedTo ? issue.assignedTo.name : "Pending Dept Assignment"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <div>
              <div className="text-slate-500">SLA Deadline</div>
              <div className="font-bold text-slate-900">
                {issue.slaDeadline ? new Date(issue.slaDeadline).toLocaleString() : "Standard 48h"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-slate-500">Current Status</div>
              <div className="font-bold text-slate-900">{issue.status}</div>
            </div>
          </div>
        </div>

        {/* Before vs After Resolution Proof Comparison */}
        {(issue.beforeImageUrl || issue.afterImageUrl) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="text-xs font-bold uppercase text-red-700 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" /> Before (Citizen Evidence)
              </div>
              {issue.beforeImageUrl ? (
                <img src={issue.beforeImageUrl} alt="Before" className="w-full h-44 object-cover rounded-lg" />
              ) : (
                <div className="h-44 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">
                  No initial photo uploaded
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="text-xs font-bold uppercase text-emerald-700 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" /> After (Field Engineer Proof)
              </div>
              {issue.afterImageUrl ? (
                <img src={issue.afterImageUrl} alt="After" className="w-full h-44 object-cover rounded-lg" />
              ) : (
                <div className="h-44 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">
                  Awaiting field completion proof
                </div>
              )}
            </div>
          </div>
        )}

        {/* Immutable Audit Log Timeline */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800">Official Accountability Audit Trail</h3>
          {loading ? (
            <p className="text-xs text-slate-500">Loading audit history...</p>
          ) : (
            <div className="space-y-2.5 border-l-2 border-blue-200 ml-2 pl-4">
              {logs.map((log) => (
                <div key={log.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {log.oldStatus} → {log.newStatus}
                    </span>
                    <span className="text-slate-400">
                      {new Date(log.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-700">{log.remarks}</div>
                  <div className="text-[11px] text-blue-700 font-medium">
                    Actor: {log.actor?.name} ({log.actor?.role})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

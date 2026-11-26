import { useState, useEffect } from "react";
import { FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import axiosClient from "../api/axiosClient";

export default function MyReportsPage({ currentUser }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const userId = currentUser?.userId || 1;
        const res = await axiosClient.get(`/issues/my-reports?userId=${userId}`);
        setReports(res.data);
      } catch (err) {
        console.error("Failed to load citizen reports:", err);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [currentUser]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" /> My Submitted Grievances
        </h1>
        <p className="text-sm text-slate-600">
          Track how your individual complaints map to deduplicated municipal master tickets and live resolution status.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading your reports...</div>
      ) : reports.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
          No complaints submitted under this account yet. Submit an issue on the Citizen Report map!
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div
              key={r.reportId}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span>Submission #{r.reportId}</span>
                  <span>•</span>
                  <span className="text-blue-600">Linked to Master Ticket #{r.masterIssueId}</span>
                  <span>•</span>
                  <span>Lexical Match: {(r.similarityScore * 100).toFixed(1)}%</span>
                </div>
                <div className="font-bold text-slate-900 text-base">{r.masterTitle}</div>
                <div className="text-sm text-slate-600">Your note: "{r.rawDescription}"</div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  {r.totalDuplicates} Citizen Upvotes
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    r.status === "RESOLVED"
                      ? "bg-emerald-100 text-emerald-800"
                      : r.status === "IN_PROGRESS"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-200 text-slate-800"
                  }`}
                >
                  {r.status === "RESOLVED" ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : r.status === "IN_PROGRESS" ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

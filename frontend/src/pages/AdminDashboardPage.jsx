import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { ShieldAlert, Layers, RefreshCw, Database } from "lucide-react";
import axiosClient from "../api/axiosClient";

export default function AdminDashboardPage() {
  const [issues, setIssues] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [issuesRes, analyticsRes] = await Promise.all([
        axiosClient.get("/admin/issues"),
        axiosClient.get("/admin/analytics"),
      ]);
      setIssues(issuesRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const res = await axiosClient.post("/admin/seed-demo");
      alert(`Seeded ${res.data.createdMasterTickets} unique master tickets & merged ${res.data.mergedDuplicates} duplicates!`);
      loadDashboardData();
    } catch (err) {
      alert("Failed to seed demo data.");
    } finally {
      setSeeding(false);
    }
  };

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      await axiosClient.patch(`/admin/issues/${issueId}/status`, {
        newStatus,
        remarks: `Status updated to ${newStatus} by Municipal Officer`,
      });
      loadDashboardData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const workloadChartData = analytics
    ? [
        { name: "Raw Citizen Reports", count: analytics.totalRawComplaints, color: "#94a3b8" },
        { name: "Unique Master Tickets", count: analytics.uniqueMasterIssues, color: "#2563eb" },
        { name: "Duplicates Eliminated", count: analytics.duplicatesEliminated, color: "#10b981" },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Municipal Priority Triage & Research Analytics</h1>
          <p className="text-sm text-slate-600">
            Deduplicated master tickets ranked by community severity score and hazard weight.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSeedDemo}
            disabled={seeding}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <Database className="w-4 h-4" /> {seeding ? "Seeding..." : "Seed Demo Data"}
          </button>
          <button
            onClick={loadDashboardData}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold uppercase text-slate-500">Raw Incoming Reports</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{analytics.totalRawComplaints}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold uppercase text-blue-600">Actionable Master Tickets</div>
            <div className="text-3xl font-bold text-blue-700 mt-1">{analytics.uniqueMasterIssues}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold uppercase text-emerald-600">Duplicates Clustered</div>
            <div className="text-3xl font-bold text-emerald-700 mt-1">{analytics.duplicatesEliminated}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold uppercase text-amber-600">Workload Reduction Rate</div>
            <div className="text-3xl font-bold text-amber-600 mt-1">{analytics.deduplicationRatePercent}%</div>
          </div>
        </div>
      )}

      {analytics && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" /> Ticket Volume Reduction Benchmark (Raw vs. Deduplicated)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadChartData} layout="vertical" margin={{ left: 30, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {workloadChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-600" />
          <h2 className="text-base font-bold text-slate-800">Priority-Ranked Master Issues</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-600">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Issue & Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Duplicates</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">#{issue.id}</td>
                  <td className="py-3 px-4 max-w-md">
                    <div className="font-semibold text-slate-900">{issue.title}</div>
                    <div className="text-xs text-slate-500 line-clamp-2">{issue.description}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      GPS: {issue.latitude}, {issue.longitude}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {issue.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      {issue.duplicateCount} report(s)
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                      {issue.severityScore}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        issue.status === "RESOLVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : issue.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-200 text-slate-800"
                      }`}
                    >
                      {issue.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={issue.status}
                      onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs bg-white"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { ShieldAlert, Database, Users, Layers, UserPlus, Download, Building2 } from "lucide-react";
import axiosClient from "../api/axiosClient";

export default function SuperAdminPage() {
  const [analytics, setAnalytics] = useState(null);
  const [scorecards, setScorecards] = useState([]);
  const [users, setUsers] = useState([]);
  const [seeding, setSeeding] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "DEPT_OFFICER",
    department: "ROADS",
  });

  const loadData = async () => {
    const [anaRes, scRes, usrRes] = await Promise.all([
      axiosClient.get("/admin/analytics"),
      axiosClient.get("/admin/ward-scorecards"),
      axiosClient.get("/admin/users"),
    ]);
    setAnalytics(anaRes.data);
    setScorecards(scRes.data);
    setUsers(usrRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCsv = async () => {
    const res = await axiosClient.get("/admin/export/csv", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", "civic-grievance-rti-audit.csv");
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await axiosClient.post("/admin/seed-demo");
      alert(`Seeded ${res.data.createdMasterTickets} unique tickets & merged ${res.data.mergedDuplicates} duplicates!`);
      loadData();
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post("/admin/users", staffForm);
      setStaffForm({ name: "", email: "", password: "", role: "DEPT_OFFICER", department: "ROADS" });
      loadData();
      alert("Staff account provisioned successfully!");
    } catch (err) {
      alert("Failed to create staff account (email may already exist).");
    }
  };

  const chartData = analytics
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
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-600" /> Municipal Commissioner Executive Console
          </h1>
          <p className="text-sm text-slate-600">
            Ward-level SLA compliance scorecards, deduplication telemetry, RTI compliance exports, and staff provisioning.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export RTI Audit CSV
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
          >
            <Database className="w-4 h-4" /> {seeding ? "Seeding..." : "Seed Multi-Dept Demo Data"}
          </button>
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="text-xs font-bold uppercase text-slate-500">Raw Reports</div>
            <div className="text-3xl font-bold mt-1">{analytics.totalRawComplaints}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="text-xs font-bold uppercase text-blue-600">Master Tickets</div>
            <div className="text-3xl font-bold text-blue-700 mt-1">{analytics.uniqueMasterIssues}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="text-xs font-bold uppercase text-emerald-600">Duplicates Clustered</div>
            <div className="text-3xl font-bold text-emerald-700 mt-1">{analytics.duplicatesEliminated}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="text-xs font-bold uppercase text-amber-600">Workload Saved</div>
            <div className="text-3xl font-bold text-amber-600 mt-1">{analytics.deduplicationRatePercent}%</div>
          </div>
        </div>
      )}

      {/* Ward Governance & SLA Scorecard */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 font-bold text-slate-800 text-sm flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-600" /> Municipal Ward SLA & Resolution Scorecards
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-600">
                <th className="py-3 px-4">Ward</th>
                <th className="py-3 px-4">Administrative Zone</th>
                <th className="py-3 px-4">Active / Total</th>
                <th className="py-3 px-4">Resolved</th>
                <th className="py-3 px-4">SLA Breaches</th>
                <th className="py-3 px-4">Resolution Rate</th>
                <th className="py-3 px-4">Citizen Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {scorecards.map((w) => (
                <tr key={w.wardCode} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-mono text-xs font-bold text-indigo-700">{w.wardCode}</div>
                    <div className="font-semibold text-slate-900">{w.wardName}</div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">{w.zoneName}</td>
                  <td className="py-3 px-4 font-bold">{w.totalTickets}</td>
                  <td className="py-3 px-4 font-bold text-emerald-700">{w.resolvedTickets}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${w.slaBreached > 0 ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"}`}>
                      {w.slaBreached}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-blue-700">{w.resolutionRate}%</td>
                  <td className="py-3 px-4 text-xs font-bold text-amber-600">
                    {w.avgCitizenRating > 0 ? `${w.avgCitizenRating} / 5 ★` : "No ratings yet"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {analytics && (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" /> City-Wide Ticket Reduction Chart
          </h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 30, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Provision New Department Officer or Field Engineer */}
      <form onSubmit={handleCreateStaff} className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" /> Onboard Department Officer / Field Engineer
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            required
            placeholder="Full Name"
            value={staffForm.name}
            onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="email"
            required
            placeholder="Official Email"
            value={staffForm.email}
            onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            required
            placeholder="Initial Password"
            value={staffForm.password}
            onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={staffForm.role}
            onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="DEPT_OFFICER">DEPT_OFFICER</option>
            <option value="FIELD_ENGINEER">FIELD_ENGINEER</option>
          </select>
          <select
            value={staffForm.department}
            onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ROADS">ROADS</option>
            <option value="WATER">WATER</option>
            <option value="ELECTRICITY">ELECTRICITY</option>
            <option value="SANITATION">SANITATION</option>
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold"
        >
          Provision Account
        </button>
      </form>

      {/* Active Municipal Staff & Role Roster */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 font-bold text-slate-800 text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" /> Registered Officers, Field Engineers & Citizens
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-600">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-2.5 px-4 font-semibold">{u.name}</td>
                  <td className="py-2.5 px-4 font-mono text-xs text-slate-600">{u.email}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">{u.role}</span>
                  </td>
                  <td className="py-2.5 px-4 text-xs font-semibold text-slate-700">{u.department}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

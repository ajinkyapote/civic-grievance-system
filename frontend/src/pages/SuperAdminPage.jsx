import { useState, useEffect } from "react";
import {
  ShieldAlert, Download, Zap, UserPlus, MapPin, PlusCircle,
  Database, CheckCircle2, Users, Building2, Sparkles
} from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useLang } from "../context/LanguageContext";
import PageHeader from "../components/PageHeader";

const INDIA_WARD_PRESETS = [
  { label: "Pune (Kothrud)", wardCode: "PUN-W01", wardName: "Kothrud Central Ward", zoneName: "Pune West Zone", centerLatitude: 18.5074, centerLongitude: 73.8077 },
  { label: "Mumbai (Andheri)", wardCode: "MUM-KW", wardName: "Andheri West K-Ward", zoneName: "Mumbai Western Suburbs", centerLatitude: 19.1136, centerLongitude: 72.8697 },
  { label: "Bengaluru (Indiranagar)", wardCode: "BLR-W80", wardName: "Indiranagar Ward 80", zoneName: "BBMP East Zone", centerLatitude: 12.9784, centerLongitude: 77.6408 },
  { label: "Delhi (Connaught Place)", wardCode: "DEL-ND1", wardName: "Connaught Place Circle", zoneName: "New Delhi Municipal Council", centerLatitude: 28.6315, centerLongitude: 77.2167 },
  { label: "Chennai (T. Nagar)", wardCode: "CHN-Z10", wardName: "T. Nagar Commercial Ward", zoneName: "Greater Chennai Zone 10", centerLatitude: 13.0418, centerLongitude: 80.2341 },
];

export default function SuperAdminPage() {
  const { t } = useLang();
  const [analytics, setAnalytics] = useState(null);
  const [scorecards, setScorecards] = useState([]);
  const [insights, setInsights] = useState([]);
  const [users, setUsers] = useState([]);
  const [wards, setWards] = useState([]);
  const [auditLedger, setAuditLedger] = useState({ chainValid: true, blocks: [] });
  const [liveEvents, setLiveEvents] = useState([]);
  const [banner, setBanner] = useState("");

  const [wardForm, setWardForm] = useState({
    wardCode: "",
    wardName: "",
    zoneName: "",
    centerLatitude: "",
    centerLongitude: "",
  });

  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "FIELD_ENGINEER",
    department: "ROADS",
  });

  const loadAll = async () => {
    const [anaRes, scRes, usrRes, insRes, wardRes, ledgerRes] = await Promise.all([
      axiosClient.get("/admin/analytics"),
      axiosClient.get("/admin/ward-scorecards"),
      axiosClient.get("/admin/users"),
      axiosClient.get("/admin/predictive-insights"),
      axiosClient.get("/public/wards"),
      axiosClient.get("/public/audit-ledger"),
    ]);
    setAnalytics(anaRes.data);
    setScorecards(scRes.data);
    setUsers(usrRes.data);
    setInsights(insRes.data);
    setWards(wardRes.data);
    setAuditLedger(ledgerRes.data);
  };

  useEffect(() => {
    loadAll();
    const es = new EventSource("http://localhost:8080/api/public/stream");
    es.onmessage = (e) => {
      setLiveEvents((prev) => [{ time: new Date().toLocaleTimeString(), data: e.data }, ...prev.slice(0, 5)]);
    };
    es.addEventListener("WARD_ADDED", (e) => {
      setLiveEvents((prev) => [{ time: new Date().toLocaleTimeString(), data: "WARD_ADDED: " + e.data }, ...prev.slice(0, 5)]);
      loadAll();
    });
    es.addEventListener("AUTO_DISPATCH", (e) => {
      setLiveEvents((prev) => [{ time: new Date().toLocaleTimeString(), data: "AUTO_DISPATCH: " + e.data }, ...prev.slice(0, 5)]);
      loadAll();
    });
    return () => es.close();
  }, []);

  const notify = (msg) => {
    setBanner(msg);
    setTimeout(() => setBanner(""), 5000);
  };

  const handleCreateWard = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post("/admin/wards", {
        ...wardForm,
        centerLatitude: parseFloat(wardForm.centerLatitude),
        centerLongitude: parseFloat(wardForm.centerLongitude),
      });
      setWardForm({ wardCode: "", wardName: "", zoneName: "", centerLatitude: "", centerLongitude: "" });
      notify(`Ward ${wardForm.wardCode} (${wardForm.wardName}) registered for live geo-fencing.`);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create ward");
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post("/admin/users", staffForm);
      setStaffForm({ name: "", email: "", password: "", role: "FIELD_ENGINEER", department: "ROADS" });
      notify(`Staff account created for ${staffForm.name} (${staffForm.role}).`);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create staff user");
    }
  };

  const handleAutoDispatch = async () => {
    const res = await axiosClient.post("/admin/auto-dispatch");
    notify(`AI Load-Balanced Scheduler dispatched ${res.data.dispatchedCount} open ticket(s) to field crews.`);
    loadAll();
  };

  const handleSeedDemo = async () => {
    const res = await axiosClient.post("/admin/seed-demo");
    notify(`Seeded ${res.data.createdMasterTickets} master tickets and merged ${res.data.mergedDuplicates} spatial-lexical duplicates.`);
    loadAll();
  };

  const handleExportCsv = async () => {
    const res = await axiosClient.get("/admin/export/csv", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "civic-grievance-rti-audit.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div>
      <PageHeader
        badge="Executive ICCC Governance"
        icon={ShieldAlert}
        title={t.adminDeskTitle}
        subtitle="Manage Pan-India municipal wards, onboard field & department personnel, trigger AI auto-dispatch, and audit SLA compliance."
        actions={
          <>
            <button
              onClick={handleAutoDispatch}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Zap className="w-4 h-4" /> AI Auto-Dispatch
            </button>
            <button
              onClick={handleSeedDemo}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Database className="w-4 h-4" /> Seed Demo Data
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Download className="w-4 h-4" /> Export RTI CSV
            </button>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {banner && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {banner}
          </div>
        )}

        {/* Executive KPI Summary */}
        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Raw Reports</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1.5">{analytics.totalRawComplaints}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Unique Master Tickets</div>
              <div className="text-3xl font-extrabold text-blue-700 mt-1.5">{analytics.uniqueMasterIssues}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Duplicates Eliminated</div>
              <div className="text-3xl font-extrabold text-amber-600 mt-1.5">{analytics.duplicatesEliminated}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">AI Compression Efficiency</div>
              <div className="text-3xl font-extrabold text-emerald-700 mt-1.5">{analytics.deduplicationRatePercent}%</div>
            </div>
          </div>
        )}

        {/* Dual Master-Data Builders: Add Municipal Ward (Pan-India) + Add Staff Account */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Add Ward Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" /> Register Municipal Ward (Pan-India)
              </h2>
              <span className="text-xs font-semibold text-slate-500">{wards.length} active wards</span>
            </div>

            {/* Quick Pan-India City Presets */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> 1-Click City Ward Presets
              </div>
              <div className="flex flex-wrap gap-1.5">
                {INDIA_WARD_PRESETS.map((p) => (
                  <button
                    key={p.wardCode}
                    type="button"
                    onClick={() =>
                      setWardForm({
                        wardCode: p.wardCode,
                        wardName: p.wardName,
                        zoneName: p.zoneName,
                        centerLatitude: String(p.centerLatitude),
                        centerLongitude: String(p.centerLongitude),
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-semibold transition"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateWard} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Code</label>
                  <input
                    required
                    placeholder="e.g., PUN-W01"
                    value={wardForm.wardCode}
                    onChange={(e) => setWardForm({ ...wardForm, wardCode: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City / Zone Name</label>
                  <input
                    required
                    placeholder="e.g., Pune West Zone"
                    value={wardForm.zoneName}
                    onChange={(e) => setWardForm({ ...wardForm, zoneName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Name</label>
                <input
                  required
                  placeholder="e.g., Kothrud Central Ward"
                  value={wardForm.wardName}
                  onChange={(e) => setWardForm({ ...wardForm, wardName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Center Latitude</label>
                  <input
                    required
                    type="number"
                    step="any"
                    placeholder="18.5074"
                    value={wardForm.centerLatitude}
                    onChange={(e) => setWardForm({ ...wardForm, centerLatitude: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Center Longitude</label>
                  <input
                    required
                    type="number"
                    step="any"
                    placeholder="73.8077"
                    value={wardForm.centerLongitude}
                    onChange={(e) => setWardForm({ ...wardForm, centerLongitude: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <PlusCircle className="w-4 h-4" /> Save & Activate Geo-Fenced Ward
              </button>
            </form>
          </div>

          {/* 2. Create Staff Account Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" /> Onboard Municipal Personnel
              </h2>
              <span className="text-xs font-semibold text-slate-500">{users.length} total accounts</span>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Officer / Engineer Name</label>
                  <input
                    required
                    placeholder="e.g., Priya Kulkarni"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                  <input
                    required
                    type="email"
                    placeholder="priya.roads@civic.gov.in"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password</label>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">System Role</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
                  >
                    <option value="FIELD_ENGINEER">Field Engineer</option>
                    <option value="DEPT_OFFICER">Department Officer</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={staffForm.department}
                    onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
                  >
                    <option value="ROADS">Roads</option>
                    <option value="WATER">Water</option>
                    <option value="ELECTRICITY">Electricity</option>
                    <option value="SANITATION">Sanitation</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Users className="w-4 h-4" /> Provision Staff Credentials
              </button>
            </form>

            {/* Active Staff Directory Mini-List */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Active Staff Directory</div>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 text-xs">
                {users
                  .filter((u) => u.role !== "CITIZEN")
                  .map((u) => (
                    <div key={u.id} className="py-1.5 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-slate-800">{u.name}</span>
                        <span className="text-slate-400 ml-1.5">({u.email})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-700">
                        {u.role} {u.department ? `• ${u.department}` : ""}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Predictive Preventive Maintenance Advisory */}
        {insights.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" /> Predictive Ward Infrastructure & Preventive Budget Advisory
              </h2>
              <span className="text-xs text-slate-500">Generated from Spatial-Lexical Cluster Density</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((ins) => (
                <div key={ins.wardCode} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-indigo-700">{ins.wardCode} • {ins.wardName}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      ins.riskLevel === "HIGH_INFRASTRUCTURE_STRESS"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {ins.riskLevel.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700">
                    Primary Bottleneck: <span className="text-slate-900">{ins.primaryStressDept}</span> ({ins.citizenImpactVolume} citizen reports)
                  </div>
                  <div className="text-xs text-slate-600">{ins.recommendedAction}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ward Governance & SLA Scorecard Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-700" /> Ward Governance & SLA Performance Scorecards
            </h2>
            <span className="text-xs text-slate-500">Real-time cross-city telemetry</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Ward Code</th>
                  <th className="px-6 py-3.5">Ward & City Zone</th>
                  <th className="px-6 py-3.5">Active Dockets</th>
                  <th className="px-6 py-3.5">Resolved</th>
                  <th className="px-6 py-3.5">SLA Breaches</th>
                  <th className="px-6 py-3.5">Resolution Rate</th>
                  <th className="px-6 py-3.5">Citizen CSAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scorecards.map((s) => (
                  <tr key={s.wardCode} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-3.5 font-mono font-bold text-blue-700">{s.wardCode}</td>
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-slate-900">{s.wardName}</div>
                      <div className="text-[11px] text-slate-500">{s.zoneName}</div>
                    </td>
                    <td className="px-6 py-3.5 font-semibold">{s.totalTickets}</td>
                    <td className="px-6 py-3.5 font-semibold text-emerald-700">{s.resolvedTickets}</td>
                    <td className="px-6 py-3.5 font-semibold text-red-600">{s.slaBreached}</td>
                    <td className="px-6 py-3.5 font-bold">{s.resolutionRate}%</td>
                    <td className="px-6 py-3.5 font-semibold text-amber-600">
                      {s.avgCitizenRating > 0 ? `${s.avgCitizenRating} / 5.0 ★` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Cryptographic SHA-256 Audit Chain & Live SSE Command Stream */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tamper-Evident SHA-256 Audit Ledger & Live SSE Telemetry
              </h2>
              <p className="text-xs text-slate-500">
                Cryptographically chained governance events for RTI verification & real-time ICCC streaming
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              auditLedger.chainValid ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
            }`}>
              {auditLedger.chainValid ? "SHA-256 Chain Integrity Verified ✓" : "Hash Mismatch Detected"}
            </span>
          </div>

          {liveEvents.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs space-y-1">
              <div className="text-[10px] uppercase text-slate-400">Live SSE Stream Events</div>
              {liveEvents.map((ev, i) => (
                <div key={i} className="truncate">[{ev.time}] {ev.data}</div>
              ))}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Block #</th>
                  <th className="px-4 py-2.5">Ticket / Ward</th>
                  <th className="px-4 py-2.5">Governance Action</th>
                  <th className="px-4 py-2.5">Actor</th>
                  <th className="px-4 py-2.5">SHA-256 Block Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {(auditLedger.blocks || []).slice(0, 6).map((b) => (
                  <tr key={b.index} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-bold text-slate-700">#{b.index}</td>
                    <td className="px-4 py-2 text-blue-700 font-bold">{b.ticketCode}</td>
                    <td className="px-4 py-2 text-slate-800">{b.action}</td>
                    <td className="px-4 py-2 text-slate-600">{b.actor}</td>
                    <td className="px-4 py-2 text-emerald-700">{b.currentHash?.slice(0, 24)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

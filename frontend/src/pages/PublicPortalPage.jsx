import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Globe, Eye, Filter, ThumbsUp, MapPin, Search, Cpu, UserCheck, CheckCircle2 } from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import IssueMap from "../components/IssueMap";
import TicketTimelineModal from "../components/TicketTimelineModal";
import SlaBadge from "../components/SlaBadge";

export default function PublicPortalPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [issues, setIssues] = useState([]);
  const [wards, setWards] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [wardFilter, setWardFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("ticket") || "");
  const [selectedIssue, setSelectedIssue] = useState(null);

  const loadData = async () => {
    const [issRes, wardRes] = await Promise.all([
      axiosClient.get("/public/issues"),
      axiosClient.get("/public/wards"),
    ]);
    setIssues(issRes.data);
    setWards(wardRes.data);

    const targetTicket = searchParams.get("ticket");
    if (targetTicket) {
      const found = issRes.data.find(
        (i) => i.ticketCode?.toLowerCase() === targetTicket.toLowerCase() || String(i.id) === targetTicket
      );
      if (found) setSelectedIssue(found);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpvote = async (issueId) => {
    if (!user) {
      alert("Sign in as a Citizen (via Role Login) to confirm/upvote an existing civic issue.");
      return;
    }
    try {
      const res = await axiosClient.post(`/citizen/issues/${issueId}/upvote`);
      alert(res.data.message);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Could not upvote issue");
    }
  };

  const filtered = issues.filter((i) => {
    const catOk = categoryFilter === "ALL" || i.category === categoryFilter;
    const wardOk = wardFilter === "ALL" || i.ward?.wardCode === wardFilter;
    const q = searchQuery.trim().toLowerCase();
    const searchOk =
      !q ||
      i.ticketCode?.toLowerCase().includes(q) ||
      i.title?.toLowerCase().includes(q) ||
      i.ward?.wardName?.toLowerCase().includes(q);
    return catOk && wardOk && searchOk;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Visual System Architecture Strip — Understandable at a Glance */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-blue-50/60">
          <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-900">1. Geo-Fenced Reporting</div>
            <div className="text-slate-600">Citizens pin GPS hazards; auto-assigned to municipal Wards.</div>
          </div>
        </div>
        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-amber-50/60">
          <Cpu className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-900">2. Spatial-Lexical AI Clustering</div>
            <div className="text-slate-600">Haversine (≤50m) + Cosine (≥0.65) merges duplicates & boosts priority.</div>
          </div>
        </div>
        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-indigo-50/60">
          <UserCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-900">3. Dept & Crew Dispatch</div>
            <div className="text-slate-600">Department officers assign top-priority tickets to field engineers.</div>
          </div>
        </div>
        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-emerald-50/60">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-900">4. Before/After Proof & SLA</div>
            <div className="text-slate-600">Field engineers upload repair proof; citizens verify & rate closure.</div>
          </div>
        </div>
      </div>

      {/* Header & Search / Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" /> Public Civic Transparency & Ward Command Portal
          </h1>
          <p className="text-sm text-slate-600">
            Inspect live deduplicated tickets, SLA countdown timers, and Before/After resolution evidence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search CIV-2026-... or landmark"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-sm bg-white w-56"
            />
          </div>

          <Filter className="w-4 h-4 text-slate-500 ml-1" />
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white"
          >
            <option value="ALL">All Municipal Wards</option>
            {wards.map((w) => (
              <option key={w.id} value={w.wardCode}>{w.wardCode} — {w.wardName}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white"
          >
            <option value="ALL">All Departments</option>
            <option value="ROADS">Roads</option>
            <option value="WATER">Water</option>
            <option value="ELECTRICITY">Electricity</option>
            <option value="SANITATION">Sanitation</option>
          </select>
        </div>
      </div>

      <IssueMap issues={filtered} onSelectIssue={setSelectedIssue} height="410px" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((issue) => (
          <div key={issue.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-blue-700">{issue.ticketCode}</span>
                <SlaBadge slaDeadline={issue.slaDeadline} status={issue.status} />
              </div>
              {issue.ward && (
                <div className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {issue.ward.wardCode} • {issue.ward.wardName}
                </div>
              )}
              <h3 className="font-bold text-slate-900">{issue.title}</h3>
              <p className="text-xs text-slate-600 line-clamp-2">{issue.description}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => handleUpvote(issue.id)}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold flex items-center gap-1 transition"
              >
                <ThumbsUp className="w-3.5 h-3.5" /> Support ({issue.duplicateCount})
              </button>
              <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">{issue.status}</span>
              <button
                onClick={() => setSelectedIssue(issue)}
                className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Audit & Proof
              </button>
            </div>
          </div>
        ))}
      </div>

      <TicketTimelineModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
    </div>
  );
}

import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Globe, Eye, Filter, ThumbsUp, MapPin, Search, Cpu, UserCheck, CheckCircle2, Inbox, ArrowUpRight } from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import PageHeader from "../components/PageHeader";
import IssueMap from "../components/IssueMap";
import TicketTimelineModal from "../components/TicketTimelineModal";
import SlaBadge from "../components/SlaBadge";

const STATUS_BADGE = {
  OPEN: "bg-red-50 text-red-700 border-red-200",
  REOPENED: "bg-red-50 text-red-700 border-red-200",
  ASSIGNED: "bg-amber-50 text-amber-800 border-amber-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function PublicPortalPage() {
  const { user } = useAuth();
  const { t } = useLang();
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
      alert("Please sign in as a Citizen to confirm/upvote an existing civic issue.");
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
    <div>
      <PageHeader
        badge={t.badge}
        icon={Globe}
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <Link
            to={user?.role === "CITIZEN" ? "/citizen" : "/login"}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            {t.reportBtn} <ArrowUpRight className="w-4 h-4" />
          </Link>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Aligned 4-Column KPI Command Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.kpiReports}</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">
              {issues.reduce((acc, i) => acc + (i.duplicateCount || 1), 0)}
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">{t.kpiMaster}</div>
            <div className="text-3xl font-extrabold text-blue-700 mt-2">{issues.length}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600">{t.kpiCrews}</div>
            <div className="text-3xl font-extrabold text-amber-600 mt-2">
              {issues.filter((i) => i.status === "ASSIGNED" || i.status === "IN_PROGRESS").length}
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">{t.kpiResolved}</div>
            <div className="text-3xl font-extrabold text-emerald-700 mt-2">
              {issues.filter((i) => i.status === "RESOLVED" || i.status === "CLOSED").length}
            </div>
          </div>
        </div>

        {/* 4-Step Pipeline Architecture Strip */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900">1. Geo-Fenced Routing</div>
              <div className="text-slate-500 mt-0.5 leading-relaxed">GPS coordinates auto-assign governing municipal wards.</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Cpu className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900">2. Spatial-Lexical AI</div>
              <div className="text-slate-500 mt-0.5 leading-relaxed">Haversine (≤50m) + TF-IDF (≥0.65) merges duplicates.</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <UserCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900">3. Priority Crew Dispatch</div>
              <div className="text-slate-500 mt-0.5 leading-relaxed">Officers dispatch top-severity tickets to field engineers.</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900">4. Photographic SLA Audit</div>
              <div className="text-slate-500 mt-0.5 leading-relaxed">Before/after proof verified by citizens before closure.</div>
            </div>
          </div>
        </div>

        {/* Geospatial Map & Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">{t.mapTitle}</h2>
              <p className="text-xs text-slate-500">{t.mapSub}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium bg-white"
              >
                <option value="ALL">{t.allWards}</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.wardCode}>{w.wardCode} — {w.wardName}</option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium bg-white"
              >
                <option value="ALL">{t.allDepts}</option>
                <option value="ROADS">{t.deptRoads}</option>
                <option value="WATER">{t.deptWater}</option>
                <option value="ELECTRICITY">{t.deptElec}</option>
                <option value="SANITATION">{t.deptSanitation}</option>
              </select>
            </div>
          </div>

          <IssueMap issues={filtered} onSelectIssue={setSelectedIssue} height="420px" />
        </div>

        {/* Ticket Directory Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-14 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{t.emptyTitle}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {t.emptySub}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((issue) => (
              <div key={issue.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                      {issue.ticketCode}
                    </span>
                    <SlaBadge slaDeadline={issue.slaDeadline} status={issue.status} />
                  </div>

                  {issue.ward && (
                    <div className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" /> {issue.ward.wardCode} • {issue.ward.wardName}
                    </div>
                  )}

                  <h3 className="font-bold text-slate-900 text-base leading-snug">{issue.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{issue.description}</p>
                </div>

                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleUpvote(issue.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold flex items-center gap-1 transition"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> {t.supportBtn} ({issue.duplicateCount})
                  </button>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_BADGE[issue.status] || "bg-slate-100 text-slate-700"}`}>
                    {issue.status}
                  </span>
                  <button
                    onClick={() => setSelectedIssue(issue)}
                    className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> {t.auditBtn}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TicketTimelineModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
    </div>
  );
}

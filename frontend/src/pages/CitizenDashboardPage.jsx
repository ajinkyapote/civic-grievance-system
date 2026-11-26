import { useState, useEffect } from "react";
import { Send, GitMerge, CheckCircle2, ImagePlus, Star, RotateCcw, Sparkles, QrCode } from "lucide-react";
import axiosClient from "../api/axiosClient";
import IssueMap from "../components/IssueMap";
import TicketReceiptModal from "../components/TicketReceiptModal";

const CATEGORIES = ["ROADS", "WATER", "ELECTRICITY", "SANITATION", "OTHER"];

export default function CitizenDashboardPage() {
  const [location, setLocation] = useState({ lat: 19.0178, lng: 73.0991 });
  const [publicIssues, setPublicIssues] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", category: "ROADS", imageUrl: "" });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  const loadAll = async () => {
    const [pubRes, myRes] = await Promise.all([
      axiosClient.get("/public/issues"),
      axiosClient.get("/citizen/my-reports"),
    ]);
    setPublicIssues(pubRes.data);
    setMyReports(myRes.data);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axiosClient.post("/citizen/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((p) => ({ ...p, imageUrl: res.data.imageUrl }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await axiosClient.post("/citizen/report", {
        ...form,
        latitude: location.lat,
        longitude: location.lng,
      });
      setResult(res.data);
      setForm({ title: "", description: "", category: form.category, imageUrl: "" });
      loadAll();
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (masterIssueId, satisfied) => {
    const feedback = prompt(
      satisfied ? "Optional feedback on the resolution:" : "Why are you reopening this ticket?"
    );
    if (feedback === null) return;
    await axiosClient.post(`/citizen/issues/${masterIssueId}/verify`, {
      satisfied,
      rating: satisfied ? 5 : 1,
      feedback,
    });
    loadAll();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Citizen Grievance Portal</h1>
        <p className="text-sm text-slate-600">
          Pinpoint an issue on the map. Our Spatial-Lexical AI automatically checks nearby tickets and explains why it merged or created a new docket.
        </p>
      </div>

      {/* Explainable AI Clustering & Priority Result Card */}
      {result && (
        <div className={`p-5 rounded-2xl border shadow-sm space-y-3 ${result.action === "MERGED" ? "bg-amber-50 border-amber-300 text-amber-950" : "bg-emerald-50 border-emerald-300 text-emerald-950"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {result.action === "MERGED" ? <GitMerge className="w-6 h-6 text-amber-600" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
              <div>
                <div className="font-bold text-base">{result.message}</div>
                <div className="text-xs opacity-80">Geo-Fenced Ward: <strong>{result.wardName}</strong></div>
              </div>
            </div>

            <button
              onClick={() => setReceiptData(result)}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800"
            >
              <QrCode className="w-3.5 h-3.5" /> Official QR Receipt
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-white/80 p-3 rounded-xl border border-black/10 text-xs">
            <div>
              <div className="text-slate-500">Haversine Distance</div>
              <div className="font-bold text-slate-900">{result.distanceMeters} m (Gate: ≤ 50m)</div>
            </div>
            <div>
              <div className="text-slate-500">Cosine Lexical Match</div>
              <div className="font-bold text-slate-900">{(result.similarityScore * 100).toFixed(1)}% (Gate: ≥ 65%)</div>
            </div>
            <div>
              <div className="text-slate-500">Community Cluster Size</div>
              <div className="font-bold text-slate-900">{result.totalDuplicates} Citizen Report(s)</div>
            </div>
            <div>
              <div className="text-slate-500">Computed Severity Score</div>
              <div className="font-bold text-red-700">{result.updatedSeverityScore}</div>
            </div>
          </div>

          <div className="text-xs space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-semibold">Matched Lexical Tokens:</span>
              {result.matchedKeywords?.map((kw) => (
                <span key={kw} className="px-2 py-0.5 rounded bg-white border border-black/10 font-mono text-[11px]">
                  {kw}
                </span>
              ))}
            </div>
            <div className="text-[11px] text-slate-700 font-mono">
              Priority Formula: {result.priorityFormulaBreakdown}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IssueMap selectedLocation={location} onSelectLocation={setLocation} issues={publicIssues} />

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department / Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Selected GPS</label>
              <div className="px-3 py-2 rounded-lg bg-slate-100 text-xs font-mono text-slate-700">
                {location.lat}, {location.lng}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Deep pothole near Station Road"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <ImagePlus className="w-4 h-4 text-blue-600" /> Upload Before Photo
            </label>
            <input type="file" accept="image/*" onChange={handleUpload} className="text-xs" />
            {uploading && <span className="text-xs text-blue-600 ml-2">Uploading...</span>}
          </div>

          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> {submitting ? "Running Spatial-Lexical Clustering..." : "Submit Grievance"}
          </button>
        </form>
      </div>

      {/* Citizen My Reports & Verification Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">My Submitted Tickets & Resolution Verification</h2>
        <div className="space-y-3">
          {myReports.map((r) => (
            <div key={r.reportId} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="font-mono text-blue-700">{r.ticketCode}</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded">{r.status}</span>
                  <span className="text-indigo-700">{r.wardName}</span>
                  <span className="text-slate-500">• Engineer: {r.assignedEngineer}</span>
                </div>
                <div className="font-bold text-slate-900">{r.masterTitle}</div>
                <div className="text-xs text-slate-600">Your submission: "{r.rawDescription}"</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReceiptData(r)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" /> QR Slip
                </button>
                {r.status === "RESOLVED" && (
                  <>
                    <button
                      onClick={() => handleVerify(r.masterIssueId, true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Star className="w-3.5 h-3.5" /> Verify & Close (5★)
                    </button>
                    <button
                      onClick={() => handleVerify(r.masterIssueId, false)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reopen
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <TicketReceiptModal receipt={receiptData} onClose={() => setReceiptData(null)} />
    </div>
  );
}

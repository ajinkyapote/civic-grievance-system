import { useState, useEffect } from "react";
import { Send, GitMerge, CheckCircle2, ImagePlus, Star, RotateCcw, Sparkles, QrCode, MapPin, ShieldCheck, Wand2, Crosshair } from "lucide-react";
import axiosClient from "../api/axiosClient";
import IssueMap from "../components/IssueMap";
import TicketReceiptModal from "../components/TicketReceiptModal";

const CATEGORIES = ["ROADS", "WATER", "ELECTRICITY", "SANITATION", "OTHER"];

const TEST_PRESETS = [
  {
    label: "1. Report New Pothole (Station Rd)",
    category: "ROADS",
    lat: 19.0178,
    lng: 73.0991,
    title: "Deep pothole near Station Road",
    description: "Large dangerous pothole on main road outside railway station causing traffic slowdown",
  },
  {
    label: "2. Test Duplicate Merge (18m away)",
    category: "ROADS",
    lat: 19.01792,
    lng: 73.09921,
    title: "Dangerous pit outside railway station",
    description: "Deep pothole on station road damaging two-wheelers near entrance",
  },
];

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

  const detectCurrentGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
      },
      () => alert("Unable to fetch device GPS. Please allow location permission or click on the map.")
    );
  };

  const applyPreset = (preset) => {
    setLocation({ lat: preset.lat, lng: preset.lng });
    setForm({
      title: preset.title,
      description: preset.description,
      category: preset.category,
      imageUrl: "",
    });
  };

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Citizen Grievance Portal</h1>
          <p className="text-sm text-slate-600">
            Step 1: Click the map to drop a pin. Step 2: Describe the issue. Our AI checks for duplicates within 50m automatically.
          </p>
        </div>

        {/* 1-Click Demo / Evaluation Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Wand2 className="w-3.5 h-3.5 text-indigo-600" /> Quick Fill:
          </span>
          {TEST_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-semibold transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plain-English + Technical AI Decision Card */}
      {result && (
        <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${result.action === "MERGED" ? "bg-amber-50 border-amber-300 text-amber-950" : "bg-emerald-50 border-emerald-300 text-emerald-950"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {result.action === "MERGED" ? (
                <div className="p-2.5 rounded-xl bg-amber-200/70 text-amber-800"><GitMerge className="w-6 h-6" /></div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-200/70 text-emerald-800"><CheckCircle2 className="w-6 h-6" /></div>
              )}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider opacity-75">
                  {result.action === "MERGED" ? "Duplicate Detected & Linked" : "Unique Civic Issue Registered"}
                </div>
                <div className="font-bold text-lg">{result.message}</div>
                <div className="text-xs">Assigned Jurisdiction: <strong>{result.wardName}</strong></div>
              </div>
            </div>

            <button
              onClick={() => setReceiptData(result)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 shadow-sm"
            >
              <QrCode className="w-4 h-4" /> Download / Print QR Receipt
            </button>
          </div>

          {/* 3-Step Visual Decision Gate */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-black/10 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-slate-500 uppercase text-[10px]">Gate 1 • GPS Proximity Check</div>
              <div className="text-sm font-bold text-slate-900">
                {result.action === "MERGED" ? `${result.distanceMeters} meters from existing pin` : "No nearby duplicate within 50m"}
              </div>
              <div className="text-slate-600">Rule: Must be ≤ 50m apart (Haversine)</div>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-slate-500 uppercase text-[10px]">Gate 2 • Text Meaning Match</div>
              <div className="text-sm font-bold text-slate-900">
                {(result.similarityScore * 100).toFixed(1)}% Description Similarity
              </div>
              <div className="text-slate-600">Rule: Must be ≥ 65% similar (Cosine NLP)</div>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-slate-500 uppercase text-[10px]">Gate 3 • Municipal Priority Score</div>
              <div className="text-sm font-bold text-red-700">
                Score: {result.updatedSeverityScore} ({result.totalDuplicates} Citizen Report{result.totalDuplicates > 1 ? "s" : ""})
              </div>
              <div className="text-slate-600">Higher score = dispatched first</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-semibold">Key Words Analyzed:</span>
              {result.matchedKeywords?.map((kw) => (
                <span key={kw} className="px-2 py-0.5 rounded-md bg-white border border-black/10 font-mono text-[11px]">
                  {kw}
                </span>
              ))}
            </div>
            <div className="text-[11px] text-slate-700 font-medium">{result.priorityFormulaBreakdown}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" /> Click map to move pin (Blue circle = 50m duplicate zone)
            </div>
            <button
              type="button"
              onClick={detectCurrentGps}
              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1"
            >
              <Crosshair className="w-3.5 h-3.5" /> Use My Live GPS
            </button>
          </div>
          <IssueMap selectedLocation={location} onSelectLocation={setLocation} issues={publicIssues} />
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Grievance Submission Form</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">1. Select Department</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">2. Pinned Coordinates</label>
              <div className="px-3 py-2 rounded-lg bg-slate-100 text-xs font-mono text-slate-700">
                {location.lat}, {location.lng}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">3. Issue Headline</label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">4. Detailed Problem Description</label>
            <textarea
              rows={3}
              required
              placeholder="Describe the exact problem and nearby landmark..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <ImagePlus className="w-4 h-4 text-blue-600" /> 5. Attach Photo Evidence (Optional)
            </label>
            <input type="file" accept="image/*" capture="environment" onChange={handleUpload} className="text-xs" />
            {uploading && <span className="text-xs text-blue-600 ml-2">Uploading...</span>}
          </div>

          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            <Send className="w-4 h-4" /> {submitting ? "Checking for Duplicates & Submitting..." : "Submit Civic Grievance"}
          </button>
        </form>
      </div>

      {/* Citizen My Reports & Verification Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> My Submitted Grievances & Verification
          </h2>
          <span className="text-xs text-slate-500">{myReports.length} ticket(s) filed</span>
        </div>

        {myReports.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-sm text-slate-500">
            You haven't filed any grievances yet. Use the form above or click a <strong>Quick Fill</strong> preset!
          </div>
        ) : (
          <div className="space-y-3">
            {myReports.map((r) => (
              <div key={r.reportId} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="font-mono text-blue-700">{r.ticketCode}</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded">{r.status}</span>
                    <span className="text-indigo-700">{r.wardName}</span>
                    <span className="text-slate-500">• Assigned Crew: {r.assignedEngineer}</span>
                  </div>
                  <div className="font-bold text-slate-900">{r.masterTitle}</div>
                  <div className="text-xs text-slate-600">Your note: "{r.rawDescription}"</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReceiptData(r)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" /> QR Receipt
                  </button>
                  {r.status === "RESOLVED" && (
                    <>
                      <button
                        onClick={() => handleVerify(r.masterIssueId, true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5" /> Confirm & Close (5★)
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
        )}
      </div>

      <TicketReceiptModal receipt={receiptData} onClose={() => setReceiptData(null)} />
    </div>
  );
}

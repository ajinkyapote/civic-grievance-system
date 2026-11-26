import { useState, useEffect } from "react";
import { MapPin, Send, CheckCircle2, GitMerge, AlertTriangle, ImagePlus } from "lucide-react";
import axiosClient from "../api/axiosClient";
import IssueMap from "../components/IssueMap";

const CATEGORIES = ["ROADS", "WATER", "ELECTRICITY", "SANITATION", "OTHER"];

export default function CitizenReportPage({ currentUser }) {
  const [location, setLocation] = useState({ lat: 19.0178, lng: 73.0991 });
  const [nearbyIssues, setNearbyIssues] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "ROADS",
    imageUrl: "",
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const fetchNearby = async (lat, lng) => {
    try {
      const res = await axiosClient.get(`/issues/nearby?lat=${lat}&lng=${lng}&radius=1000`);
      setNearbyIssues(res.data);
    } catch (err) {
      console.error("Failed to fetch nearby issues:", err);
    }
  };

  useEffect(() => {
    fetchNearby(location.lat, location.lng);
  }, [location]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axiosClient.post("/issues/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((prev) => ({ ...prev, imageUrl: res.data.imageUrl }));
    } catch (err) {
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      const payload = {
        ...form,
        latitude: location.lat,
        longitude: location.lng,
        userId: currentUser?.userId || null,
      };
      const res = await axiosClient.post("/issues/report", payload);
      setResult(res.data);
      setForm({ title: "", description: "", category: form.category, imageUrl: "" });
      fetchNearby(location.lat, location.lng);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit grievance. Is Spring Boot running?");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Report a Civic Grievance</h1>
        <p className="text-sm text-slate-600">
          Click on the map to pinpoint the issue. Our Geo-Spatial & Lexical Engine automatically clusters duplicate reports within 50m.
        </p>
      </div>

      {result && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            result.action === "MERGED"
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-emerald-50 border-emerald-300 text-emerald-900"
          }`}
        >
          {result.action === "MERGED" ? (
            <GitMerge className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div className="text-sm space-y-1">
            <div className="font-bold text-base">{result.message}</div>
            <div className="flex flex-wrap gap-4 text-xs font-medium">
              <span>Master Ticket: <strong>#{result.masterIssueId}</strong></span>
              <span>Haversine Distance: <strong>{result.distanceMeters} m</strong></span>
              <span>Cosine Similarity: <strong>{(result.similarityScore * 100).toFixed(1)}%</strong></span>
              <span>Total Upvotes/Duplicates: <strong>{result.totalDuplicates}</strong></span>
              <span>Severity Score: <strong>{result.updatedSeverityScore}</strong></span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" /> Pin Location (Blue circle = 50m cluster radius)
            </span>
            <span className="font-mono text-xs bg-slate-100 px-2.5 py-1 rounded text-slate-700">
              {location.lat}, {location.lng}
            </span>
          </div>
          <IssueMap
            selectedLocation={location}
            onSelectLocation={setLocation}
            nearbyIssues={nearbyIssues}
          />
          <p className="text-xs text-slate-500">
            Showing {nearbyIssues.length} active master ticket(s) within 1 km of selected pin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Issue Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Short Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Deep pothole near Station Road"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Detailed Description</label>
            <textarea
              rows={3}
              required
              placeholder="Describe the exact issue, landmark, and hazard level..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <ImagePlus className="w-4 h-4 text-slate-500" /> Evidence Photo (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploading && <p className="text-xs text-blue-600 mt-1">Uploading photo...</p>}
            {form.imageUrl && (
              <img src={form.imageUrl} alt="Preview" className="mt-2 h-24 rounded-lg object-cover border border-slate-200" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={location.lat}
                onChange={(e) => setLocation({ ...location, lat: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={location.lng}
                onChange={(e) => setLocation({ ...location, lng: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono bg-slate-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? "Running Spatial-Lexical Check..." : "Submit Grievance"}
          </button>
        </form>
      </div>
    </div>
  );
}

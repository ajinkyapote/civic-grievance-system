import { useState, useEffect } from "react";
import { Wrench, CheckCircle2, Camera } from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

export default function FieldEngineerPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [proofUrls, setProofUrls] = useState({});
  const [remarks, setRemarks] = useState({});

  const loadTasks = async () => {
    const res = await axiosClient.get("/ops/field/tasks");
    setTasks(res.data);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleProofUpload = async (taskId, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await axiosClient.post("/ops/field/upload-proof", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setProofUrls((prev) => ({ ...prev, [taskId]: res.data.proofImageUrl }));
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    await axiosClient.patch(`/ops/field/tasks/${taskId}/status`, {
      newStatus,
      remarks: remarks[taskId] || `Marked ${newStatus} on-site by ${user.name}`,
      proofImageUrl: proofUrls[taskId] || null,
    });
    loadTasks();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="w-6 h-6 text-amber-600" /> Field Engineer Work Orders ({user?.name})
        </h1>
        <p className="text-sm text-slate-600">
          Execute assigned repairs on-site, upload after-resolution photographic proof, and mark tickets resolved.
        </p>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-sm text-slate-500">
            No work orders assigned to you yet. Log in as a Department Officer to assign tickets!
          </div>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-700">{t.ticketCode}</span>
                  <h3 className="text-lg font-bold text-slate-900">{t.title}</h3>
                  <p className="text-xs text-slate-600">{t.description}</p>
                  <p className="text-xs font-mono text-slate-500 mt-1">GPS: {t.latitude}, {t.longitude}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  {t.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Field Engineer Notes</label>
                  <input
                    type="text"
                    placeholder="e.g., Pothole filled with hot-mix asphalt and leveled"
                    value={remarks[t.id] || ""}
                    onChange={(e) => setRemarks({ ...remarks, [t.id]: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" /> Upload After-Fix Proof Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleProofUpload(t.id, e.target.files?.[0])}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus(t.id, "IN_PROGRESS")}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
                >
                  Start Work (IN_PROGRESS)
                </button>
                <button
                  onClick={() => handleUpdateStatus(t.id, "RESOLVED")}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" /> Complete & Submit Proof (RESOLVED)
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

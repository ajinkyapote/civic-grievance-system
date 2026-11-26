import { Clock, AlertOctagon, CheckCircle2 } from "lucide-react";

export default function SlaBadge({ slaDeadline, status }) {
  if (status === "RESOLVED" || status === "CLOSED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> SLA Met
      </span>
    );
  }

  if (!slaDeadline) return null;

  const diffMs = new Date(slaDeadline).getTime() - Date.now();
  const absHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
  const absMins = Math.floor((Math.abs(diffMs) / (1000 * 60)) % 60);

  if (diffMs < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
        <AlertOctagon className="w-3 h-3" /> OVERDUE ({absHours}h {absMins}m)
      </span>
    );
  }

  const isUrgent = absHours < 4;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
        isUrgent
          ? "bg-amber-100 text-amber-900 border-amber-300"
          : "bg-blue-50 text-blue-800 border-blue-200"
      }`}
    >
      <Clock className="w-3 h-3" /> SLA: {absHours}h {absMins}m left
    </span>
  );
}

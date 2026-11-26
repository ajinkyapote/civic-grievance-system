import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const loadAlerts = async () => {
      if (!user) return;
      try {
        const res = await axiosClient.get("/public/issues");
        const issues = res.data || [];
        let alerts = [];

        if (user.role === "CITIZEN") {
          alerts = issues
            .filter((i) => i.status === "RESOLVED")
            .map((i) => ({
              id: i.id,
              code: i.ticketCode,
              title: `${i.ticketCode} Resolved — Verify & Rate`,
              sub: i.title,
              type: "resolved",
              link: "/citizen",
            }));
        } else if (user.role === "DEPT_OFFICER") {
          alerts = issues
            .filter((i) => i.category === user.department && (i.status === "OPEN" || i.status === "REOPENED"))
            .map((i) => ({
              id: i.id,
              code: i.ticketCode,
              title: `Dispatch Needed: ${i.ticketCode}`,
              sub: i.title,
              type: "warning",
              link: "/department",
            }));
        } else if (user.role === "FIELD_ENGINEER") {
          alerts = issues
            .filter((i) => i.assignedTo?.email === user.email && (i.status === "ASSIGNED" || i.status === "IN_PROGRESS"))
            .map((i) => ({
              id: i.id,
              code: i.ticketCode,
              title: `Active Work Order: ${i.ticketCode}`,
              sub: i.title,
              type: "active",
              link: "/field",
            }));
        } else if (user.role === "SUPER_ADMIN") {
          alerts = issues
            .filter((i) => i.escalationLevel === "L3_CRITICAL_BREACH" || i.status === "OPEN")
            .slice(0, 6)
            .map((i) => ({
              id: i.id,
              code: i.ticketCode,
              title: `${i.ticketCode} (${i.category})`,
              sub: i.title,
              type: i.escalationLevel === "L3_CRITICAL_BREACH" ? "warning" : "active",
              link: "/admin",
            }));
        }

        setItems(alerts);
      } catch {
        setItems([]);
      }
    };

    loadAlerts();
    const timer = setInterval(loadAlerts, 15000);
    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Action Alerts</span>
            <span className="text-[11px] font-semibold text-blue-600">{items.length} pending</span>
          </div>

          {items.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No pending action items right now.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate(item.link);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition flex items-start gap-2.5"
                >
                  {item.type === "resolved" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : item.type === "warning" ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{item.title}</div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">{item.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

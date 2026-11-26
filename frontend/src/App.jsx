import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { Globe, MapPin, Briefcase, Wrench, ShieldAlert, FlaskConical, LogIn, LogOut, Bell } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicPortalPage from "./pages/PublicPortalPage";
import LoginPage from "./pages/LoginPage";
import CitizenDashboardPage from "./pages/CitizenDashboardPage";
import DepartmentOfficerPage from "./pages/DepartmentOfficerPage";
import FieldEngineerPage from "./pages/FieldEngineerPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import BenchmarkPage from "./pages/BenchmarkPage";
import axiosClient from "./api/axiosClient";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [openNotif, setOpenNotif] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const fetchNotifs = () => {
      axiosClient.get("/notifications").then((res) => setNotifications(res.data)).catch(() => {});
    };
    fetchNotifs();
    const timer = setInterval(fetchNotifs, 15000);
    return () => clearInterval(timer);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-slate-900 text-white px-6 py-3.5 shadow-md relative z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="font-bold text-base tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          CivicGov Enterprise — Smart Grievance Command
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <NavLink to="/" className={({ isActive }) => `px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium ${isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
            <Globe className="w-4 h-4" /> Public Transparency
          </NavLink>

          {user?.role === "CITIZEN" && (
            <NavLink to="/citizen" className={({ isActive }) => `px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium ${isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
              <MapPin className="w-4 h-4" /> My Citizen Portal
            </NavLink>
          )}

          {user?.role === "DEPT_OFFICER" && (
            <NavLink to="/department" className={({ isActive }) => `px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium ${isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
              <Briefcase className="w-4 h-4" /> {user.department} Desk
            </NavLink>
          )}

          {user?.role === "FIELD_ENGINEER" && (
            <NavLink to="/field" className={({ isActive }) => `px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium ${isActive ? "bg-amber-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
              <Wrench className="w-4 h-4" /> Field Tasks
            </NavLink>
          )}

          {user?.role === "SUPER_ADMIN" && (
            <NavLink to="/admin" className={({ isActive }) => `px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium ${isActive ? "bg-red-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
              <ShieldAlert className="w-4 h-4" /> Commissioner Admin
            </NavLink>
          )}

          <NavLink to="/benchmark" className={({ isActive }) => `px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium ${isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
            <FlaskConical className="w-4 h-4" /> Research Benchmark
          </NavLink>

          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700 relative">
              <button
                onClick={() => setOpenNotif(!openNotif)}
                className="relative p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="Role Alerts"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-bold rounded-full">
                    {notifications.length}
                  </span>
                )}
              </button>

              {openNotif && (
                <div className="absolute right-0 top-10 w-80 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 p-3 space-y-2 z-50">
                  <div className="text-xs font-bold uppercase text-slate-500 px-1">
                    Live Action Alerts ({notifications.length})
                  </div>
                  {notifications.length === 0 ? (
                    <div className="text-xs text-slate-400 p-2">No pending alerts for your role.</div>
                  ) : (
                    notifications.map((n, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setOpenNotif(false);
                          navigate(n.link);
                        }}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 border border-slate-100 space-y-0.5"
                      >
                        <div className="text-xs font-bold text-blue-700">{n.title}</div>
                        <div className="text-[11px] text-slate-600 line-clamp-2">{n.detail}</div>
                      </button>
                    ))
                  )}
                </div>
              )}

              <span className="text-xs text-slate-300">
                {user.name} <strong className="text-blue-400">[{user.role}]</strong>
              </span>
              <button onClick={handleLogout} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="ml-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5">
              <LogIn className="w-4 h-4" /> Role Login
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <Navbar />
          <Routes>
            <Route path="/" element={<PublicPortalPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/benchmark" element={<BenchmarkPage />} />
            <Route path="/citizen" element={<ProtectedRoute allowedRoles={["CITIZEN", "SUPER_ADMIN"]}><CitizenDashboardPage /></ProtectedRoute>} />
            <Route path="/department" element={<ProtectedRoute allowedRoles={["DEPT_OFFICER", "SUPER_ADMIN"]}><DepartmentOfficerPage /></ProtectedRoute>} />
            <Route path="/field" element={<ProtectedRoute allowedRoles={["FIELD_ENGINEER", "SUPER_ADMIN"]}><FieldEngineerPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]}><SuperAdminPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

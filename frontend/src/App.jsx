import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import {
  ShieldCheck, LogOut, Globe, BarChart3, Languages, LayoutDashboard,
  LogIn, Send, Truck, HardHat, ShieldAlert, ExternalLink
} from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider, useLang } from "./context/LanguageContext";
import NotificationBell from "./components/NotificationBell";
import LoginPage from "./pages/LoginPage";
import PublicPortalPage from "./pages/PublicPortalPage";
import CitizenDashboardPage from "./pages/CitizenDashboardPage";
import DepartmentOfficerPage from "./pages/DepartmentOfficerPage";
import FieldEngineerPage from "./pages/FieldEngineerPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import BenchmarkPage from "./pages/BenchmarkPage";

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function NavItem({ to, icon: Icon, children }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-300 hover:text-white hover:bg-slate-800"
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {children}
    </Link>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const { lang, setLang, t, languages } = useLang();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Identity */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="leading-none">
            <div className="font-extrabold text-sm tracking-tight text-white">
              CivicGov <span className="text-blue-400">ICCC</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5 hidden sm:block">
              {t.brandSub}
            </div>
          </div>
        </Link>

        {/* Primary Role-Aware Navigation */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
          <NavItem to="/" icon={Globe}>{t.navPublic}</NavItem>

          {user?.role === "CITIZEN" && (
            <NavItem to="/citizen" icon={Send}>{t.navWorkspace}</NavItem>
          )}
          {user?.role === "DEPT_OFFICER" && (
            <NavItem to="/department" icon={Truck}>{t.navWorkspace}</NavItem>
          )}
          {user?.role === "FIELD_ENGINEER" && (
            <NavItem to="/field" icon={HardHat}>{t.navWorkspace}</NavItem>
          )}

          {user?.role === "SUPER_ADMIN" && (
            <>
              <NavItem to="/admin" icon={ShieldAlert}>Commissioner</NavItem>
              <NavItem to="/citizen" icon={Send}>Citizen</NavItem>
              <NavItem to="/department" icon={Truck}>Dept Dispatch</NavItem>
              <NavItem to="/field" icon={HardHat}>Field Ops</NavItem>
            </>
          )}

          <NavItem to="/benchmark" icon={BarChart3}>{t.navBenchmark}</NavItem>

          <a
            href="http://localhost:8080/swagger-ui.html"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1 transition"
          >
            API Docs <ExternalLink className="w-3 h-3" />
          </a>
        </nav>

        {/* Right Controls: 8-Language Selector + Notifications + Auth */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg bg-slate-800 border border-slate-700 px-2 py-1">
            <Languages className="w-3.5 h-3.5 text-blue-400 mr-1.5 shrink-0" />
            <select
              aria-label="Select Language"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.native} ({l.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <NotificationBell />
              <div className="hidden xl:flex flex-col items-end leading-tight">
                <span className="text-xs font-bold text-white">{user.name}</span>
                <span className="text-[10px] font-mono text-emerald-400">{user.role}</span>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-lg bg-slate-800 hover:bg-red-600/90 text-slate-300 hover:text-white transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <LogIn className="w-3.5 h-3.5" /> {t.navLogin}
            </Link>
          )}
        </div>
      </div>

      {/* Mobile / Tablet Quick-Nav Strip */}
      <div className="lg:hidden border-t border-slate-800 px-4 py-2 flex items-center gap-1.5 overflow-x-auto bg-slate-900">
        <NavItem to="/" icon={Globe}>{t.navPublic}</NavItem>
        {user?.role === "CITIZEN" && <NavItem to="/citizen" icon={Send}>{t.navWorkspace}</NavItem>}
        {user?.role === "DEPT_OFFICER" && <NavItem to="/department" icon={Truck}>{t.navWorkspace}</NavItem>}
        {user?.role === "FIELD_ENGINEER" && <NavItem to="/field" icon={HardHat}>{t.navWorkspace}</NavItem>}
        {user?.role === "SUPER_ADMIN" && (
          <>
            <NavItem to="/admin" icon={ShieldAlert}>Commissioner</NavItem>
            <NavItem to="/citizen" icon={Send}>Citizen</NavItem>
            <NavItem to="/department" icon={Truck}>Dispatch</NavItem>
            <NavItem to="/field" icon={HardHat}>Field</NavItem>
          </>
        )}
        <NavItem to="/benchmark" icon={BarChart3}>{t.navBenchmark}</NavItem>
      </div>
    </header>
  );
}

function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-500">
      {t.footerText}
    </footer>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<PublicPortalPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/benchmark" element={<BenchmarkPage />} />
                <Route
                  path="/citizen"
                  element={
                    <ProtectedRoute allowedRoles={["CITIZEN", "SUPER_ADMIN"]}>
                      <CitizenDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/department"
                  element={
                    <ProtectedRoute allowedRoles={["DEPT_OFFICER", "SUPER_ADMIN"]}>
                      <DepartmentOfficerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/field"
                  element={
                    <ProtectedRoute allowedRoles={["FIELD_ENGINEER", "SUPER_ADMIN"]}>
                      <FieldEngineerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                      <SuperAdminPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

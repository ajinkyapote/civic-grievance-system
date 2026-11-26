import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, KeyRound, UserPlus, Eye, EyeOff, Lock, Mail, User, ArrowRight } from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const redirectByRole = (role) => {
    if (role === "CITIZEN") navigate("/citizen");
    else if (role === "DEPT_OFFICER") navigate("/department");
    else if (role === "FIELD_ENGINEER") navigate("/field");
    else if (role === "SUPER_ADMIN") navigate("/admin");
    else navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const res = await axiosClient.post(endpoint, form);
      login(res.data);
      redirectByRole(res.data.role);
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed. Verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-116px)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-100 to-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="bg-slate-900 px-8 py-6 text-white">
          <div className="flex items-center gap-2.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> {t.loginGateway}
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            {isRegister ? t.registerTitle : t.loginTitle}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isRegister
              ? "Register to submit geo-tagged grievances, track SLA timelines, and verify resolutions."
              : "Role-based access for Citizens, Department Officers, Field Engineers & Commissioners."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.nameLabel}</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.emailLabel}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.passwordLabel}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            {isRegister ? <UserPlus className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
            {loading ? "Authenticating..." : isRegister ? t.createAccountBtn : t.signInBtn}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
            {isRegister ? "Already have an account?" : "Need a citizen portal account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-blue-600 font-bold hover:underline"
            >
              {isRegister ? t.signInBtn : "Register Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

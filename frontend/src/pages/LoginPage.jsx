import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, KeyRound, UserPlus } from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

const DEMO_ACCOUNTS = [
  { label: "Citizen (Rahul)", email: "citizen@civic.gov.in", pass: "citizen123", role: "CITIZEN", redirect: "/citizen" },
  { label: "Roads Dept Officer", email: "roads.officer@civic.gov.in", pass: "officer123", role: "DEPT_OFFICER", redirect: "/department" },
  { label: "Water Dept Officer", email: "water.officer@civic.gov.in", pass: "officer123", role: "DEPT_OFFICER", redirect: "/department" },
  { label: "Field Engineer (Ramesh)", email: "ramesh.roads@civic.gov.in", pass: "field123", role: "FIELD_ENGINEER", redirect: "/field" },
  { label: "Super Admin (Commissioner)", email: "admin@civic.gov.in", pass: "admin123", role: "SUPER_ADMIN", redirect: "/admin" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
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
    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const res = await axiosClient.post(endpoint, form);
      login(res.data);
      redirectByRole(res.data.role);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    }
  };

  const quickFillAndLogin = async (acc) => {
    try {
      const res = await axiosClient.post("/auth/login", { email: acc.email, password: acc.pass });
      login(res.data);
      navigate(acc.redirect);
    } catch (err) {
      setError("Demo login failed. Make sure Spring Boot backend is running.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-4">
      {/* Left: Login / Register Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold">{isRegister ? "Citizen Registration" : "Role-Based Portal Login"}</h1>
        </div>
        <p className="text-xs text-slate-500">
          Stateless JWT Authentication with Department & Role Access Control.
        </p>

        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium">{error}</div>}

        {isRegister && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Official / Citizen Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
        >
          {isRegister ? <UserPlus className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
          {isRegister ? "Register Citizen Account" : "Sign In"}
        </button>

        <div className="text-center text-xs text-slate-600 pt-1">
          {isRegister ? "Already have an account?" : "New citizen?"}{" "}
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-600 font-semibold hover:underline"
          >
            {isRegister ? "Sign In" : "Create Citizen Account"}
          </button>
        </div>
      </form>

      {/* Right: One-Click Role Switcher for Demo & Testing */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-3">
        <h2 className="text-base font-bold">Instant Role Login (Seeded Accounts)</h2>
        <p className="text-xs text-slate-400">
          Click any role below to sign in immediately with a real JWT token and inspect role-scoped permissions:
        </p>
        <div className="space-y-2 pt-1">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              onClick={() => quickFillAndLogin(acc)}
              className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-semibold text-white">{acc.label}</div>
                <div className="text-[11px] font-mono text-slate-400">{acc.email}</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                {acc.role}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Mail, Lock, ArrowRight } from "lucide-react";

import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api().post("/auth/login", { email, password });
      setSession(data.access_token, null);
      const me = await api().get("/auth/me");
      setSession(data.access_token, me.data);
      navigate("/tickets");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: "var(--bg-primary)" }}>
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20"
             style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-15"
             style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }} />
      </div>

      <div className="glass-card p-8 w-full max-w-md relative animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
            <LayoutDashboard size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Support CRM
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Internal Support Platform
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5"
                   style={{ color: "var(--text-secondary)" }}>
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
                placeholder="admin@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5"
                   style={{ color: "var(--text-secondary)" }}>
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm px-3 py-2 rounded-lg"
                 style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-2.5"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Sign in <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        <p className="text-xs mt-6 text-center" style={{ color: "var(--text-muted)" }}>
          Default credentials: <code className="px-1 py-0.5 rounded text-xs"
          style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
            admin@company.com</code> / <code className="px-1 py-0.5 rounded text-xs"
          style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
            password123</code>
        </p>
      </div>
    </div>
  );
}

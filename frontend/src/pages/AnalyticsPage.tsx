import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, BookOpen, Ticket, Clock, CheckCircle2, XCircle } from "lucide-react";

import { api } from "../lib/api";

interface DashboardData {
  tickets: {
    total: number;
    open: number;
    pending: number;
    resolved: number;
    closed: number;
  };
  priority_breakdown: Record<string, number>;
  contacts_total: number;
  users_total: number;
  articles_total: number;
  agent_workload: Record<string, number>;
}

interface AuditEntry {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  timestamp?: string;
}

export default function AnalyticsPage() {
  const { data: dash, isLoading } = useQuery<DashboardData>({
    queryKey: ["analytics-dashboard"],
    queryFn: async () => (await api().get("/analytics/dashboard")).data,
    refetchInterval: 15_000,
  });

  const { data: activity = [] } = useQuery<AuditEntry[]>({
    queryKey: ["analytics-activity"],
    queryFn: async () => (await api().get("/analytics/recent-activity?limit=15")).data,
    refetchInterval: 15_000,
  });

  if (isLoading || !dash) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 size={28} style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Analytics Dashboard
          </h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="glass-card p-5"
              style={{ borderLeft: "3px solid var(--border-color)" }}
            >
              <div
                className="rounded"
                style={{
                  height: "0.875rem",
                  width: "60%",
                  marginBottom: "0.75rem",
                  background: "var(--bg-elevated)",
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
              <div
                className="rounded"
                style={{
                  height: "1.75rem",
                  width: "40%",
                  background: "var(--bg-elevated)",
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="glass-card p-6">
              <div
                className="rounded"
                style={{
                  height: "1rem",
                  width: "50%",
                  marginBottom: "1rem",
                  background: "var(--bg-elevated)",
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div
                    key={j}
                    className="rounded"
                    style={{
                      height: "1.25rem",
                      background: "var(--bg-elevated)",
                      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>
    );
  }

  const t = dash.tickets;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 size={28} style={{ color: "var(--accent)" }} />
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Analytics Dashboard
        </h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tickets" value={t.total} color="var(--accent)" icon={<Ticket size={18} />} />
        <StatCard label="Open" value={t.open} color="var(--accent)" icon={<Clock size={18} />} />
        <StatCard label="Pending" value={t.pending} color="var(--warning)" icon={<TrendingUp size={18} />} />
        <StatCard label="Resolved" value={t.resolved} color="var(--success)" icon={<CheckCircle2 size={18} />} />
        <StatCard label="Closed" value={t.closed} color="var(--text-muted)" icon={<XCircle size={18} />} />
        <StatCard label="Contacts" value={dash.contacts_total} color="var(--accent)" icon={<Users size={18} />} />
        <StatCard label="Users" value={dash.users_total} color="var(--success)" icon={<Users size={18} />} />
        <StatCard label="KB Articles" value={dash.articles_total} color="var(--warning)" icon={<BookOpen size={18} />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ticket status breakdown */}
        <div className="glass-card p-6">
          <h2 className="font-medium mb-4" style={{ color: "var(--text-primary)" }}>
            Tickets by Status
          </h2>
          <BarChart
            data={[
              { label: "Open", value: t.open, gradient: "linear-gradient(90deg, #3b82f6, #60a5fa)" },
              { label: "Pending", value: t.pending, gradient: "linear-gradient(90deg, #f59e0b, #fbbf24)" },
              { label: "Resolved", value: t.resolved, gradient: "linear-gradient(90deg, #10b981, #34d399)" },
              { label: "Closed", value: t.closed, gradient: "linear-gradient(90deg, #64748b, #94a3b8)" },
            ]}
          />
        </div>

        {/* Priority breakdown */}
        <div className="glass-card p-6">
          <h2 className="font-medium mb-4" style={{ color: "var(--text-primary)" }}>
            Tickets by Priority
          </h2>
          <BarChart
            data={[
              { label: "Low", value: dash.priority_breakdown.low ?? 0, gradient: "linear-gradient(90deg, #64748b, #94a3b8)" },
              { label: "Medium", value: dash.priority_breakdown.medium ?? 0, gradient: "linear-gradient(90deg, #3b82f6, #60a5fa)" },
              { label: "High", value: dash.priority_breakdown.high ?? 0, gradient: "linear-gradient(90deg, #f59e0b, #fbbf24)" },
              { label: "Urgent", value: dash.priority_breakdown.urgent ?? 0, gradient: "linear-gradient(90deg, #ef4444, #f87171)" },
            ]}
          />
        </div>
      </div>

      {/* Recent activity */}
      <div className="glass-card p-6">
        <h2 className="font-medium mb-4" style={{ color: "var(--text-primary)" }}>
          Recent Activity
        </h2>
        {activity.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No activity yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>User ID</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <code
                        className="text-xs"
                        style={{
                          padding: "0.125rem 0.375rem",
                          borderRadius: "0.25rem",
                          background: "var(--bg-elevated)",
                          color: "var(--accent)",
                        }}
                      >
                        {a.action}
                      </code>
                    </td>
                    <td>{a.entity_type}</td>
                    <td style={{ color: "var(--text-muted)" }}>{a.entity_id ?? "-"}</td>
                    <td style={{ color: "var(--text-muted)" }}>{a.user_id ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="glass-card p-5"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</p>
        {icon && <span style={{ color }}>{icon}</span>}
      </div>
      <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

function BarChart({
  data,
}: {
  data: { label: string; value: number; gradient: string }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span
            className="text-xs text-right"
            style={{ width: "4rem", color: "var(--text-secondary)" }}
          >
            {d.label}
          </span>
          <div
            className="flex-1 overflow-hidden"
            style={{
              height: "1.5rem",
              borderRadius: "0.375rem",
              background: "var(--bg-elevated)",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(d.value / max) * 100}%`,
                background: d.gradient,
                borderRadius: "0.375rem",
                transition: "all 0.3s ease",
              }}
            />
          </div>
          <span
            className="text-xs text-right font-medium"
            style={{ width: "2rem", color: "var(--text-muted)" }}
          >
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

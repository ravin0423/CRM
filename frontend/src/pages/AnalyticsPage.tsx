import { useQuery } from "@tanstack/react-query";

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

  if (isLoading || !dash) return <p>Loading dashboard...</p>;

  const t = dash.tickets;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tickets" value={t.total} />
        <StatCard label="Open" value={t.open} color="blue" />
        <StatCard label="Pending" value={t.pending} color="amber" />
        <StatCard label="Resolved" value={t.resolved} color="green" />
        <StatCard label="Closed" value={t.closed} color="slate" />
        <StatCard label="Contacts" value={dash.contacts_total} />
        <StatCard label="Users" value={dash.users_total} />
        <StatCard label="KB Articles" value={dash.articles_total} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ticket status breakdown */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-medium mb-3">Tickets by Status</h2>
          <BarChart
            data={[
              { label: "Open", value: t.open, color: "bg-blue-500" },
              { label: "Pending", value: t.pending, color: "bg-amber-500" },
              { label: "Resolved", value: t.resolved, color: "bg-green-500" },
              { label: "Closed", value: t.closed, color: "bg-slate-400" },
            ]}
          />
        </div>

        {/* Priority breakdown */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-medium mb-3">Tickets by Priority</h2>
          <BarChart
            data={[
              { label: "Low", value: dash.priority_breakdown.low ?? 0, color: "bg-slate-400" },
              { label: "Medium", value: dash.priority_breakdown.medium ?? 0, color: "bg-blue-400" },
              { label: "High", value: dash.priority_breakdown.high ?? 0, color: "bg-amber-500" },
              { label: "Urgent", value: dash.priority_breakdown.urgent ?? 0, color: "bg-red-500" },
            ]}
          />
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-medium mb-3">Recent Activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-slate-500">No activity yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-2 py-1.5">Action</th>
                <th className="px-2 py-1.5">Entity</th>
                <th className="px-2 py-1.5">Entity ID</th>
                <th className="px-2 py-1.5">User ID</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-2 py-1.5 font-mono text-xs">{a.action}</td>
                  <td className="px-2 py-1.5">{a.entity_type}</td>
                  <td className="px-2 py-1.5 text-slate-500">{a.entity_id ?? "-"}</td>
                  <td className="px-2 py-1.5 text-slate-500">{a.user_id ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "slate",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600",
    amber: "text-amber-600",
    green: "text-green-600",
    red: "text-red-600",
    slate: "text-slate-700",
  };
  return (
    <div className="bg-white rounded shadow p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color] ?? "text-slate-700"}`}>{value}</p>
    </div>
  );
}

function BarChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2">
          <span className="w-16 text-xs text-slate-600 text-right">{d.label}</span>
          <div className="flex-1 bg-slate-100 rounded h-5 overflow-hidden">
            <div
              className={`h-full ${d.color} rounded transition-all duration-300`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-xs text-slate-500 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

import { runtimeConfig } from "../../lib/runtime-config";

interface HealthPayload {
  status: string;
  version: string;
  components: Record<string, string>;
}

export default function HealthTab() {
  const { data, isLoading } = useQuery<HealthPayload>({
    queryKey: ["health"],
    queryFn: async () => {
      // The /health endpoint is at the root, not under /api/v1.
      const base = runtimeConfig().apiBaseUrl.replace(/\/api\/v1\/?$/, "");
      const res = await fetch(`${base}/health`);
      return res.json();
    },
    refetchInterval: 5000,
  });

  if (isLoading) return <p style={{ color: "var(--text-muted)" }}>Loading…</p>;

  const isOk = data?.status === "ok";

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        System Health
      </h2>

      <div className="glass-card p-4 flex items-center gap-3">
        {isOk ? (
          <CheckCircle2 size={24} style={{ color: "var(--success)" }} />
        ) : (
          <AlertCircle size={24} style={{ color: "var(--warning)" }} />
        )}
        <div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Overall status</p>
          <p
            className="text-lg font-semibold capitalize"
            style={{ color: isOk ? "var(--success)" : "var(--warning)" }}
          >
            {data?.status}
          </p>
        </div>
      </div>

      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Backend version: <span style={{ color: "var(--text-primary)" }}>{data?.version}</span>
      </p>

      <div className="glass-card p-4">
        <h3 className="font-medium mb-3" style={{ color: "var(--text-primary)" }}>
          Components
        </h3>
        <ul className="text-sm space-y-2">
          {data?.components &&
            Object.entries(data.components).map(([k, v]) => {
              const up = v === "up";
              return (
                <li key={k} className="flex items-center gap-2">
                  {up ? (
                    <CheckCircle2 size={14} style={{ color: "var(--success)" }} />
                  ) : (
                    <XCircle size={14} style={{ color: "var(--danger)" }} />
                  )}
                  <span style={{ color: "var(--text-primary)" }}>{k}</span>
                  <span style={{ color: up ? "var(--success)" : "var(--danger)" }}>
                    {up ? "up" : "down"}
                  </span>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}

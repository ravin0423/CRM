import { useQuery } from "@tanstack/react-query";

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

  if (isLoading) return <p>Loading…</p>;

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">System Health</h2>
      <p>
        Overall status:{" "}
        <span className={data?.status === "ok" ? "text-green-600" : "text-amber-600"}>
          {data?.status}
        </span>
      </p>
      <p className="text-sm text-slate-500">Backend version: {data?.version}</p>
      <ul className="text-sm space-y-1">
        {data?.components &&
          Object.entries(data.components).map(([k, v]) => (
            <li key={k}>
              {k}:{" "}
              <span className={v === "up" ? "text-green-600" : "text-red-600"}>
                {v === "up" ? "✓ up" : "✗ down"}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}

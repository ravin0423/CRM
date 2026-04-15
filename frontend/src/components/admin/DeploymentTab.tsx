import { useQuery } from "@tanstack/react-query";

import { runtimeConfig } from "../../lib/runtime-config";

interface HealthPayload {
  status: string;
  version: string;
  components: Record<string, string>;
}

export default function DeploymentTab() {
  const { data: health } = useQuery<HealthPayload>({
    queryKey: ["health"],
    queryFn: async () => {
      const base = runtimeConfig().apiBaseUrl.replace(/\/api\/v1\/?$/, "");
      return (await fetch(`${base}/health`)).json();
    },
    refetchInterval: 10_000,
  });

  const env = detectEnvironment();

  return (
    <div className="space-y-5 max-w-2xl animate-fade-in">
      <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        Deployment
      </h2>

      <section className="space-y-2">
        <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>Environment</h3>
        <div className="table-wrapper">
          <table className="text-sm w-full">
            <tbody>
              <Row label="Mode" value={env.mode} />
              <Row label="API Base URL" value={runtimeConfig().apiBaseUrl} />
              <Row label="Backend Version" value={health?.version ?? "..."} />
              <Row label="Backend Status" value={health?.status ?? "..."} />
              <Row label="Frontend Version" value={runtimeConfig().version} />
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>Component Status</h3>
        {health?.components ? (
          <ul className="text-sm space-y-1.5">
            {Object.entries(health.components).map(([name, status]) => (
              <li key={name} className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: status === "up" ? "var(--success)" : "var(--danger)" }}
                />
                <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                  {name}
                </span>
                <span style={{ color: "var(--text-muted)" }}>{status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>AWS Deployment</h3>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          The AWS Terraform scaffold is available in <code>deploy/aws/</code>. Copy
          <code> terraform.tfvars.example</code> to <code>terraform.tfvars</code>, fill
          in your credentials, and run <code>terraform plan</code> followed by
          <code> terraform apply</code>.
        </p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          See <code>deploy/aws/README.md</code> for the full bootstrap checklist and
          estimated monthly costs.
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
      <td className="py-1.5 pr-4" style={{ color: "var(--text-muted)" }}>{label}</td>
      <td className="py-1.5 font-mono text-sm" style={{ color: "var(--text-primary)" }}>{value}</td>
    </tr>
  );
}

function detectEnvironment() {
  const url = runtimeConfig().apiBaseUrl;
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    return { mode: "Local (development)" };
  }
  if (url.includes("amazonaws.com") || url.includes(".aws.")) {
    return { mode: "AWS" };
  }
  return { mode: "Custom" };
}

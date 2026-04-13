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
    <div className="space-y-5 max-w-2xl">
      <h2 className="text-xl font-semibold">Deployment</h2>

      <section className="space-y-2">
        <h3 className="font-medium">Environment</h3>
        <table className="text-sm w-full">
          <tbody>
            <Row label="Mode" value={env.mode} />
            <Row label="API Base URL" value={runtimeConfig().apiBaseUrl} />
            <Row label="Backend Version" value={health?.version ?? "..."} />
            <Row label="Backend Status" value={health?.status ?? "..."} />
            <Row label="Frontend Version" value={runtimeConfig().version} />
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">Component Status</h3>
        {health?.components ? (
          <ul className="text-sm space-y-1">
            {Object.entries(health.components).map(([name, status]) => (
              <li key={name} className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    status === "up" ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="font-medium">{name}</span>
                <span className="text-slate-500">{status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Loading...</p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">AWS Deployment</h3>
        <p className="text-sm text-slate-600">
          The AWS Terraform scaffold is available in <code>deploy/aws/</code>. Copy
          <code> terraform.tfvars.example</code> to <code>terraform.tfvars</code>, fill
          in your credentials, and run <code>terraform plan</code> followed by
          <code> terraform apply</code>.
        </p>
        <p className="text-sm text-slate-600">
          See <code>deploy/aws/README.md</code> for the full bootstrap checklist and
          estimated monthly costs.
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b">
      <td className="py-1.5 pr-4 text-slate-500">{label}</td>
      <td className="py-1.5 font-mono text-sm">{value}</td>
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

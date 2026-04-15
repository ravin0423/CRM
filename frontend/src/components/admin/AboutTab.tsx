import { useQuery } from "@tanstack/react-query";

import { runtimeConfig } from "../../lib/runtime-config";

interface HealthPayload {
  version: string;
  status: string;
}

export default function AboutTab() {
  const { data: health } = useQuery<HealthPayload>({
    queryKey: ["health"],
    queryFn: async () => {
      const base = runtimeConfig().apiBaseUrl.replace(/\/api\/v1\/?$/, "");
      return (await fetch(`${base}/health`)).json();
    },
  });

  return (
    <div className="space-y-5 max-w-2xl animate-fade-in">
      <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        About / Help
      </h2>

      <div className="table-wrapper">
        <table className="text-sm w-full">
          <tbody>
            <Row label="Application" value="Internal Support CRM" />
            <Row label="Backend Version" value={health?.version ?? "..."} />
            <Row label="Frontend Version" value={runtimeConfig().version} />
            <Row label="License" value="Internal Use" />
          </tbody>
        </table>
      </div>

      <section className="space-y-2">
        <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>Feature Overview</h3>
        <ul className="list-disc list-inside text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
          <li>Ticket management with state machine (open / pending / resolved / closed)</li>
          <li>Contact &amp; deal CRM with audit logging</li>
          <li>Dual database support: SQL Server Express &amp; MongoDB</li>
          <li>Object storage: MinIO (local) or Amazon S3</li>
          <li>SMTP email integration with test-send from Admin Panel</li>
          <li>Freshdesk import wizard for migrations</li>
          <li>Role-based access control (Admin / Agent / Viewer)</li>
          <li>Zero hardcoded configuration — everything editable in this Admin Panel</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>Phase Roadmap</h3>
        <ul className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
          <li>
            <span className="font-medium" style={{ color: "var(--success)" }}>Phase 1</span> — Core system: auth,
            tickets, contacts, admin panel, AWS scaffold
          </li>
          <li>
            <span className="font-medium" style={{ color: "var(--success)" }}>Phase 1.5</span> — User management,
            integrations, Freshdesk import, backup/deployment tabs
          </li>
          <li>
            <span className="font-medium" style={{ color: "var(--text-muted)" }}>Phase 2</span> — Knowledge base,
            AI chatbot, workflow engine, analytics dashboard
          </li>
          <li>
            <span className="font-medium" style={{ color: "var(--text-muted)" }}>Phase 3</span> — SLA management,
            customer portal, mobile, multi-language
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>Documentation</h3>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Architecture diagrams and flowcharts are in{" "}
          <code>docs/ARCHITECTURE_AND_FLOWCHARTS.md</code>. AWS deployment guide is in{" "}
          <code>deploy/aws/README.md</code>.
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
      <td className="py-1.5 pr-4" style={{ color: "var(--text-muted)" }}>{label}</td>
      <td className="py-1.5" style={{ color: "var(--text-primary)" }}>{value}</td>
    </tr>
  );
}

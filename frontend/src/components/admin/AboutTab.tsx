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
    <div className="space-y-5 max-w-2xl">
      <h2 className="text-xl font-semibold">About / Help</h2>

      <table className="text-sm w-full">
        <tbody>
          <Row label="Application" value="Internal Support CRM" />
          <Row label="Backend Version" value={health?.version ?? "..."} />
          <Row label="Frontend Version" value={runtimeConfig().version} />
          <Row label="License" value="Internal Use" />
        </tbody>
      </table>

      <section className="space-y-2">
        <h3 className="font-medium">Feature Overview</h3>
        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
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
        <h3 className="font-medium">Phase Roadmap</h3>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>
            <span className="font-medium text-green-700">Phase 1</span> — Core system: auth,
            tickets, contacts, admin panel, AWS scaffold
          </li>
          <li>
            <span className="font-medium text-green-700">Phase 1.5</span> — User management, integrations,
            Freshdesk import, backup/deployment tabs
          </li>
          <li>
            <span className="font-medium text-slate-500">Phase 2</span> — Knowledge base, AI chatbot,
            workflow engine, analytics dashboard
          </li>
          <li>
            <span className="font-medium text-slate-500">Phase 3</span> — SLA management,
            customer portal, mobile, multi-language
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">Documentation</h3>
        <p className="text-sm text-slate-600">
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
    <tr className="border-b">
      <td className="py-1.5 pr-4 text-slate-500">{label}</td>
      <td className="py-1.5">{value}</td>
    </tr>
  );
}

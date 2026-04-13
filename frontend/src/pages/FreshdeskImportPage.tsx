import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../lib/api";

type Step = "connect" | "inventory" | "mapping" | "preview" | "running" | "done";

const STEPS: { key: Step; label: string }[] = [
  { key: "connect", label: "1. Connect" },
  { key: "inventory", label: "2. Inventory" },
  { key: "mapping", label: "3. Map Fields" },
  { key: "preview", label: "4. Preview" },
  { key: "running", label: "5. Import" },
  { key: "done", label: "6. Done" },
];

export default function FreshdeskImportPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("connect");
  const [domain, setDomain] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // inventory data
  const [counts, setCounts] = useState<{ tickets: number; contacts: number } | null>(null);
  // preview data
  const [previewData, setPreviewData] = useState<{ tickets: any[]; contacts: any[] } | null>(null);
  // job
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);

  const creds = { domain, api_key: apiKey };

  const doConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      await api().post("/integrations/freshdesk/connect", creds);
      // Auto-advance to inventory
      const inv = await api().post("/integrations/freshdesk/inventory", creds);
      setCounts(inv.data as any);
      setStep("inventory");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  const doPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api().post("/integrations/freshdesk/preview", { ...creds, sample_size: 5 });
      setPreviewData(res.data as any);
      setStep("preview");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  const doStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api().post("/integrations/freshdesk/start", creds);
      setJobId((res.data as any).job_id);
      setStep("running");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  // Poll job status
  useEffect(() => {
    if (step !== "running" || !jobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await api().get(`/integrations/freshdesk/status/${jobId}`);
        const data = res.data as any;
        setJobStatus(data);
        if (data.stage === "done" || data.stage === "error") {
          setStep("done");
          clearInterval(interval);
        }
      } catch {
        // ignore polling errors
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [step, jobId]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Freshdesk Import Wizard</h1>
        <button onClick={() => navigate("/admin/integrations")} className="text-sm text-slate-500 hover:underline">
          Back to Integrations
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1">
        {STEPS.map((s) => (
          <div
            key={s.key}
            className={`flex-1 text-center py-1.5 text-xs rounded ${
              s.key === step
                ? "bg-blue-600 text-white"
                : STEPS.findIndex((x) => x.key === step) > STEPS.findIndex((x) => x.key === s.key)
                  ? "bg-green-100 text-green-800"
                  : "bg-slate-100 text-slate-500"
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}

      {/* Step 1: Connect */}
      {step === "connect" && (
        <div className="space-y-3 bg-white p-5 rounded shadow">
          <h2 className="font-medium">Connect to Freshdesk</h2>
          <p className="text-sm text-slate-600">
            Enter your Freshdesk domain and API key. Find your API key under Profile Settings in Freshdesk.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Domain
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yourcompany.freshdesk.com"
                className="mt-1 block w-full border rounded px-2 py-1"
              />
            </label>
            <label className="block text-sm">
              API Key
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1 block w-full border rounded px-2 py-1"
              />
            </label>
          </div>
          <button
            onClick={doConnect}
            disabled={loading || !domain || !apiKey}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Connect & Scan"}
          </button>
        </div>
      )}

      {/* Step 2: Inventory */}
      {step === "inventory" && counts && (
        <div className="space-y-3 bg-white p-5 rounded shadow">
          <h2 className="font-medium">Inventory</h2>
          <p className="text-sm text-slate-600">
            Found the following objects in your Freshdesk account:
          </p>
          <table className="text-sm w-full">
            <tbody>
              <tr className="border-b">
                <td className="py-1.5 text-slate-500">Tickets</td>
                <td className="py-1.5 font-medium">{counts.tickets.toLocaleString()}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 text-slate-500">Contacts</td>
                <td className="py-1.5 font-medium">{counts.contacts.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <div className="flex gap-2">
            <button onClick={() => setStep("mapping")} className="px-4 py-2 bg-blue-600 text-white rounded">
              Next: Map Fields
            </button>
            <button onClick={() => setStep("connect")} className="px-4 py-2 border rounded text-sm">
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Mapping */}
      {step === "mapping" && (
        <div className="space-y-3 bg-white p-5 rounded shadow">
          <h2 className="font-medium">Field Mapping</h2>
          <p className="text-sm text-slate-600">
            The default mapping imports tickets and contacts with automatic status and priority
            conversion. Custom field mapping is available in Phase 2.
          </p>
          <table className="text-sm w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-2 py-1">Freshdesk</th>
                <th className="text-left px-2 py-1">CRM</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-2 py-1">Status 2 (Open)</td>
                <td className="px-2 py-1">open</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1">Status 3 (Pending)</td>
                <td className="px-2 py-1">pending</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1">Status 4 (Resolved)</td>
                <td className="px-2 py-1">resolved</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1">Status 5 (Closed)</td>
                <td className="px-2 py-1">closed</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1">Priority 1–4</td>
                <td className="px-2 py-1">low / medium / high / urgent</td>
              </tr>
            </tbody>
          </table>
          <div className="flex gap-2">
            <button onClick={doPreview} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
              {loading ? "Loading Preview..." : "Next: Preview"}
            </button>
            <button onClick={() => setStep("inventory")} className="px-4 py-2 border rounded text-sm">
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Preview */}
      {step === "preview" && previewData && (
        <div className="space-y-3 bg-white p-5 rounded shadow">
          <h2 className="font-medium">Preview</h2>
          <p className="text-sm text-slate-600">
            Sample records that will be imported. Verify the data looks correct before proceeding.
          </p>
          {previewData.tickets.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-1">Sample Tickets</h3>
              <div className="overflow-x-auto">
                <table className="text-xs w-full border">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-2 py-1">Subject</th>
                      <th className="text-left px-2 py-1">Status</th>
                      <th className="text-left px-2 py-1">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.tickets.map((t: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1">{t.subject}</td>
                        <td className="px-2 py-1">{t.status}</td>
                        <td className="px-2 py-1">{t.priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {previewData.contacts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-1">Sample Contacts</h3>
              <div className="overflow-x-auto">
                <table className="text-xs w-full border">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-2 py-1">Name</th>
                      <th className="text-left px-2 py-1">Email</th>
                      <th className="text-left px-2 py-1">Company</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.contacts.map((c: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1">{c.name}</td>
                        <td className="px-2 py-1">{c.email}</td>
                        <td className="px-2 py-1">{c.company_name ?? c.company ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={doStart}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {loading ? "Starting..." : "Start Import"}
            </button>
            <button onClick={() => setStep("mapping")} className="px-4 py-2 border rounded text-sm">
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Running */}
      {step === "running" && (
        <div className="space-y-3 bg-white p-5 rounded shadow">
          <h2 className="font-medium">Importing...</h2>
          <p className="text-sm text-slate-600">
            Stage: <span className="font-medium">{jobStatus?.stage ?? "starting"}</span>
          </p>
          <div className="w-full bg-slate-200 rounded h-4">
            <div
              className="bg-blue-600 h-4 rounded transition-all duration-300"
              style={{ width: `${jobStatus?.progress ?? 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Contacts: {jobStatus?.imported_contacts ?? 0} | Tickets: {jobStatus?.imported_tickets ?? 0}
          </p>
        </div>
      )}

      {/* Step 6: Done */}
      {step === "done" && (
        <div className="space-y-3 bg-white p-5 rounded shadow">
          <h2 className="font-medium">
            {jobStatus?.stage === "error" ? "Import Failed" : "Import Complete"}
          </h2>
          {jobStatus?.stage === "error" && (
            <p className="text-red-600 text-sm">{jobStatus?.errors?.join(", ")}</p>
          )}
          {jobStatus?.stage === "done" && (
            <>
              <p className="text-sm text-green-700">
                Successfully imported {jobStatus.imported_contacts} contacts and{" "}
                {jobStatus.imported_tickets} tickets.
              </p>
              <p className="text-xs text-slate-500">
                Started: {jobStatus.started_at} — Finished: {jobStatus.finished_at}
              </p>
            </>
          )}
          <div className="flex gap-2">
            <button onClick={() => navigate("/tickets")} className="px-4 py-2 bg-blue-600 text-white rounded">
              View Tickets
            </button>
            <button onClick={() => navigate("/contacts")} className="px-4 py-2 border rounded text-sm">
              View Contacts
            </button>
            <button onClick={() => navigate("/admin/integrations")} className="px-4 py-2 border rounded text-sm">
              Back to Integrations
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

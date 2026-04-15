import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  Link,
  Eye,
  Table2,
  Play,
} from "lucide-react";

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

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Upload size={28} style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Freshdesk Import Wizard
          </h1>
        </div>
        <button
          onClick={() => navigate("/admin/integrations")}
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft size={14} />
          Back to Integrations
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1.5">
        {STEPS.map((s) => {
          const stepIndex = STEPS.findIndex((x) => x.key === s.key);
          const isActive = s.key === step;
          const isCompleted = currentStepIndex > stepIndex;
          const isPending = currentStepIndex < stepIndex;

          let stepStyle: React.CSSProperties = {};
          let className = "flex-1 text-center py-2 text-xs font-medium rounded-lg transition-all duration-200";

          if (isActive) {
            stepStyle = {
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              color: "white",
              boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
            };
          } else if (isCompleted) {
            className += " badge-green";
          } else if (isPending) {
            stepStyle = {
              background: "var(--bg-elevated)",
              color: "var(--text-muted)",
            };
          }

          return (
            <div key={s.key} className={className} style={stepStyle}>
              {isCompleted && <CheckCircle2 size={12} className="inline mr-1" />}
              {s.label}
            </div>
          );
        })}
      </div>

      {error && (
        <div
          className="flex items-center gap-2 text-sm p-3 rounded-lg"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            color: "var(--danger)",
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Step 1: Connect */}
      {step === "connect" && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Link size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>
              Connect to Freshdesk
            </h2>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Enter your Freshdesk domain and API key. Find your API key under Profile Settings in Freshdesk.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm" style={{ color: "var(--text-secondary)" }}>
              Domain
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yourcompany.freshdesk.com"
                className="input mt-1.5"
              />
            </label>
            <label className="block text-sm" style={{ color: "var(--text-secondary)" }}>
              API Key
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your API key"
                className="input mt-1.5"
              />
            </label>
          </div>
          <button
            onClick={doConnect}
            disabled={loading || !domain || !apiKey}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Connect & Scan
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Inventory */}
      {step === "inventory" && counts && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Table2 size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>
              Inventory
            </h2>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Found the following objects in your Freshdesk account:
          </p>
          <div className="table-wrapper">
            <table>
              <tbody>
                <tr>
                  <td style={{ color: "var(--text-secondary)" }}>Tickets</td>
                  <td className="font-medium">{counts.tickets.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ color: "var(--text-secondary)" }}>Contacts</td>
                  <td className="font-medium">{counts.contacts.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep("mapping")} className="btn btn-primary">
              Next: Map Fields
              <ArrowRight size={16} />
            </button>
            <button onClick={() => setStep("connect")} className="btn btn-secondary">
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Mapping */}
      {step === "mapping" && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Table2 size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>
              Field Mapping
            </h2>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            The default mapping imports tickets and contacts with automatic status and priority
            conversion. Custom field mapping is available in Phase 2.
          </p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Freshdesk</th>
                  <th>CRM</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Status 2 (Open)</td>
                  <td><span className="badge badge-blue">open</span></td>
                </tr>
                <tr>
                  <td>Status 3 (Pending)</td>
                  <td><span className="badge badge-amber">pending</span></td>
                </tr>
                <tr>
                  <td>Status 4 (Resolved)</td>
                  <td><span className="badge badge-green">resolved</span></td>
                </tr>
                <tr>
                  <td>Status 5 (Closed)</td>
                  <td><span className="badge badge-slate">closed</span></td>
                </tr>
                <tr>
                  <td>Priority 1-4</td>
                  <td>
                    <span className="badge badge-slate">low</span>{" "}
                    <span className="badge badge-blue">medium</span>{" "}
                    <span className="badge badge-amber">high</span>{" "}
                    <span className="badge badge-red">urgent</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button onClick={doPreview} disabled={loading} className="btn btn-primary">
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Loading Preview...
                </>
              ) : (
                <>
                  Next: Preview
                  <ArrowRight size={16} />
                </>
              )}
            </button>
            <button onClick={() => setStep("inventory")} className="btn btn-secondary">
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Preview */}
      {step === "preview" && previewData && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Eye size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>
              Preview
            </h2>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Sample records that will be imported. Verify the data looks correct before proceeding.
          </p>
          {previewData.tickets.length > 0 && (
            <div>
              <h3
                className="text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Sample Tickets
              </h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.tickets.map((t: any, i: number) => (
                      <tr key={i}>
                        <td>{t.subject}</td>
                        <td>{t.status}</td>
                        <td>{t.priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {previewData.contacts.length > 0 && (
            <div>
              <h3
                className="text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Sample Contacts
              </h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Company</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.contacts.map((c: any, i: number) => (
                      <tr key={i}>
                        <td>{c.name}</td>
                        <td>{c.email}</td>
                        <td>{c.company_name ?? c.company ?? ""}</td>
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
              className="btn"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Start Import
                </>
              )}
            </button>
            <button onClick={() => setStep("mapping")} className="btn btn-secondary">
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Running */}
      {step === "running" && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" style={{ color: "var(--accent)" }} />
            <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>
              Importing...
            </h2>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Stage: <span className="font-medium" style={{ color: "var(--text-primary)" }}>{jobStatus?.stage ?? "starting"}</span>
          </p>
          <div
            className="w-full overflow-hidden"
            style={{
              height: "1.25rem",
              borderRadius: "0.625rem",
              background: "var(--bg-elevated)",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${jobStatus?.progress ?? 0}%`,
                background: "linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6)",
                backgroundSize: "200% 100%",
                borderRadius: "0.625rem",
                transition: "width 0.3s ease",
                animation: "shimmer 2s linear infinite",
              }}
            />
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Contacts: {jobStatus?.imported_contacts ?? 0} | Tickets: {jobStatus?.imported_tickets ?? 0}
          </p>
          <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        </div>
      )}

      {/* Step 6: Done */}
      {step === "done" && (
        <div className="glass-card p-6 space-y-4">
          {jobStatus?.stage === "error" ? (
            <>
              <div className="flex items-center gap-2">
                <AlertCircle size={18} style={{ color: "var(--danger)" }} />
                <h2 className="font-medium" style={{ color: "var(--danger)" }}>
                  Import Failed
                </h2>
              </div>
              <div
                className="text-sm p-3 rounded-lg"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  color: "var(--danger)",
                }}
              >
                {jobStatus?.errors?.join(", ")}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} style={{ color: "var(--success)" }} />
                <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>
                  Import Complete
                </h2>
              </div>
              <div
                className="text-sm p-3 rounded-lg"
                style={{
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  color: "var(--success)",
                }}
              >
                Successfully imported {jobStatus?.imported_contacts} contacts and{" "}
                {jobStatus?.imported_tickets} tickets.
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Started: {jobStatus?.started_at} -- Finished: {jobStatus?.finished_at}
              </p>
            </>
          )}
          <div className="flex gap-2">
            <button onClick={() => navigate("/tickets")} className="btn btn-primary">
              View Tickets
            </button>
            <button onClick={() => navigate("/contacts")} className="btn btn-secondary">
              View Contacts
            </button>
            <button onClick={() => navigate("/admin/integrations")} className="btn btn-secondary">
              Back to Integrations
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Mail, Loader2 } from "lucide-react";

import { testEmail, useAdminSettings, useUpdateAdminSettings } from "../../hooks/useAdminSettings";

export default function EmailTab() {
  const { data: settings, isLoading } = useAdminSettings();
  const update = useUpdateAdminSettings();
  const [email, setEmail] = useState<Record<string, any>>({});
  const [recipient, setRecipient] = useState("");
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (settings?.email) setEmail(settings.email);
  }, [settings]);

  if (isLoading)
    return (
      <div style={{ color: "var(--text-muted)" }} className="flex items-center gap-2 py-8">
        <Loader2 size={16} className="animate-spin" /> Loading...
      </div>
    );

  async function onTest() {
    setResult("Sending...");
    try {
      await testEmail({ ...email, recipient });
      setResult("Test email sent successfully.");
    } catch (err: any) {
      setResult(`Failed: ${err?.response?.data?.detail ?? "Failed"}`);
    }
  }

  async function onSave() {
    await update.mutateAsync({ email });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div style={{ background: "var(--accent)", opacity: 0.15 }} className="p-2 rounded-lg">
          <Mail size={20} style={{ color: "var(--accent)" }} />
        </div>
        <h2 style={{ color: "var(--text-primary)" }} className="text-xl font-semibold">
          Email Configuration
        </h2>
      </div>

      <div className="glass-card p-5 space-y-4">
        <Field label="SMTP Host" value={email.smtp_host ?? ""} onChange={(v) => setEmail({ ...email, smtp_host: v })} />
        <Field
          label="SMTP Port"
          value={String(email.smtp_port ?? 587)}
          onChange={(v) => setEmail({ ...email, smtp_port: Number(v) || 587 })}
        />
        <Field label="Username" value={email.username ?? ""} onChange={(v) => setEmail({ ...email, username: v })} />
        <Field
          label="Password"
          type="password"
          value={email.password_encrypted ?? ""}
          onChange={(v) => setEmail({ ...email, password: v })}
        />
        <Field label="From Email" value={email.from_email ?? ""} onChange={(v) => setEmail({ ...email, from_email: v })} />
        <Field label="From Name" value={email.from_name ?? ""} onChange={(v) => setEmail({ ...email, from_name: v })} />

        <div className="flex items-center gap-2 pt-2">
          <input
            className="input flex-1"
            placeholder="test recipient email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <button className="btn btn-secondary" onClick={onTest}>
            Test Email
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            Save
          </button>
        </div>
        {result && (
          <p
            className="text-sm"
            style={{
              color: result.includes("successfully") ? "var(--success)" : result.includes("Failed") ? "var(--danger)" : "var(--text-secondary)",
            }}
          >
            {result}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col text-sm">
      <span className="mb-1" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
    </label>
  );
}

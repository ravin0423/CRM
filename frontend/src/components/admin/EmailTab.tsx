import { useEffect, useState } from "react";

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

  if (isLoading) return <p>Loading…</p>;

  async function onTest() {
    setResult("Sending…");
    try {
      await testEmail({ ...email, recipient });
      setResult("✓ Test email sent.");
    } catch (err: any) {
      setResult(`✗ ${err?.response?.data?.detail ?? "Failed"}`);
    }
  }

  async function onSave() {
    await update.mutateAsync({ email });
  }

  return (
    <div className="space-y-3 max-w-2xl">
      <h2 className="text-xl font-semibold">Email Configuration</h2>
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
          className="border rounded px-2 py-1 flex-1"
          placeholder="test recipient email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <button className="px-4 py-2 bg-slate-200 rounded" onClick={onTest}>
          Test Email
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={onSave}>
          Save
        </button>
      </div>
      {result && <p className="text-sm">{result}</p>}
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
      <span className="mb-1 text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded px-2 py-1"
      />
    </label>
  );
}

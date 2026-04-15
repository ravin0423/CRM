import { useEffect, useState } from "react";
import { HardDrive, Loader2 } from "lucide-react";

import {
  testStorage,
  useAdminSettings,
  useUpdateAdminSettings,
} from "../../hooks/useAdminSettings";

export default function StorageTab() {
  const { data: settings, isLoading } = useAdminSettings();
  const update = useUpdateAdminSettings();
  const [type, setType] = useState<"minio" | "s3">("minio");
  const [minio, setMinio] = useState<Record<string, any>>({});
  const [s3, setS3] = useState<Record<string, any>>({});
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (!settings?.storage) return;
    setType(((settings.storage.type as any) ?? "minio") as "minio" | "s3");
    setMinio(settings.storage.minio ?? {});
    setS3(settings.storage.s3 ?? {});
  }, [settings]);

  if (isLoading)
    return (
      <div style={{ color: "var(--text-muted)" }} className="flex items-center gap-2 py-8">
        <Loader2 size={16} className="animate-spin" /> Loading...
      </div>
    );

  async function onTest() {
    setResult("Testing...");
    try {
      await testStorage({ type, minio, s3 });
      setResult("Connected successfully.");
    } catch (err: any) {
      setResult(`Failed: ${err?.response?.data?.detail ?? "Failed"}`);
    }
  }

  async function onSave() {
    await update.mutateAsync({ storage: { type, minio, s3 } });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div style={{ background: "var(--accent)", opacity: 0.15 }} className="p-2 rounded-lg">
          <HardDrive size={20} style={{ color: "var(--accent)" }} />
        </div>
        <h2 style={{ color: "var(--text-primary)" }} className="text-xl font-semibold">
          File Storage Configuration
        </h2>
      </div>

      <div className="glass-card p-5 space-y-4">
        <label className="flex items-center gap-2">
          <span style={{ color: "var(--text-secondary)" }} className="font-medium">
            Storage Type:
          </span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="input"
          >
            <option value="minio">MinIO (local)</option>
            <option value="s3">AWS S3</option>
          </select>
        </label>

        {type === "minio" ? (
          <div className="space-y-3">
            <Field label="Endpoint URL" value={minio.endpoint ?? ""} onChange={(v) => setMinio({ ...minio, endpoint: v })} />
            <Field label="Access Key" value={minio.access_key ?? ""} onChange={(v) => setMinio({ ...minio, access_key: v })} />
            <Field
              label="Secret Key"
              type="password"
              value={minio.secret_key_encrypted ?? ""}
              onChange={(v) => setMinio({ ...minio, secret_key: v })}
            />
            <Field label="Bucket" value={minio.bucket ?? ""} onChange={(v) => setMinio({ ...minio, bucket: v })} />
          </div>
        ) : (
          <div className="space-y-3">
            <Field label="AWS Region" value={s3.region ?? "us-east-1"} onChange={(v) => setS3({ ...s3, region: v })} />
            <Field label="AWS Access Key" value={s3.access_key ?? ""} onChange={(v) => setS3({ ...s3, access_key: v })} />
            <Field
              label="AWS Secret Key"
              type="password"
              value={s3.secret_key_encrypted ?? ""}
              onChange={(v) => setS3({ ...s3, secret_key: v })}
            />
            <Field label="Bucket Name" value={s3.bucket ?? ""} onChange={(v) => setS3({ ...s3, bucket: v })} />
          </div>
        )}

        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={onTest}>
            Test Connection
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            Save
          </button>
        </div>
        {result && (
          <p
            className="text-sm"
            style={{
              color: result.includes("successfully") ? "var(--success)" : result.includes("Failed") ? "var(--danger)" : "var(--text-muted)",
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

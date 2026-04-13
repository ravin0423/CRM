import { useEffect, useState } from "react";

import {
  testDatabase,
  useAdminSettings,
  useUpdateAdminSettings,
} from "../../hooks/useAdminSettings";

/**
 * Database configuration tab — fully wired.
 *
 * Reads current settings, edits them locally, POSTs to the Test Connection
 * endpoint on demand, and PUTs to the settings endpoint on Save. Secrets
 * come back as "***" and are only re-sent when the operator edits them.
 */
export default function DatabaseTab() {
  const { data: settings, isLoading } = useAdminSettings();
  const update = useUpdateAdminSettings();

  const [dbType, setDbType] = useState<"sqlserver" | "mongodb">("sqlserver");
  const [sqlserver, setSqlserver] = useState<Record<string, any>>({});
  const [mongodb, setMongodb] = useState<Record<string, any>>({});
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setDbType((settings.database?.type as any) ?? "sqlserver");
    setSqlserver(settings.database?.sqlserver ?? {});
    setMongodb(settings.database?.mongodb ?? {});
  }, [settings]);

  if (isLoading) return <p>Loading…</p>;

  async function onTest() {
    setStatus("testing");
    setError(null);
    try {
      await testDatabase({ type: dbType, sqlserver, mongodb });
      setStatus("ok");
    } catch (err: any) {
      setStatus("fail");
      setError(err?.response?.data?.detail ?? "Connection failed");
    }
  }

  async function onSave() {
    await update.mutateAsync({
      database: { type: dbType, sqlserver, mongodb },
    });
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-semibold">Database Configuration</h2>

      <div className="flex items-center gap-4">
        <label className="font-medium">Database Type:</label>
        <select
          value={dbType}
          onChange={(e) => setDbType(e.target.value as any)}
          className="border rounded px-3 py-1"
        >
          <option value="sqlserver">SQL Server Express</option>
          <option value="mongodb">MongoDB</option>
        </select>
        <span
          className={
            status === "ok"
              ? "text-green-600"
              : status === "fail"
                ? "text-red-600"
                : "text-slate-500"
          }
        >
          {status === "ok"
            ? "● Connected"
            : status === "fail"
              ? "● Failed"
              : status === "testing"
                ? "Testing…"
                : "— Not tested"}
        </span>
      </div>

      {dbType === "sqlserver" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Server"
            value={sqlserver.server ?? ""}
            onChange={(v) => setSqlserver({ ...sqlserver, server: v })}
          />
          <Field
            label="Port"
            value={String(sqlserver.port ?? 1433)}
            onChange={(v) => setSqlserver({ ...sqlserver, port: Number(v) || 1433 })}
          />
          <Field
            label="Database Name"
            value={sqlserver.database ?? ""}
            onChange={(v) => setSqlserver({ ...sqlserver, database: v })}
          />
          <Field
            label="Username"
            value={sqlserver.username ?? ""}
            onChange={(v) => setSqlserver({ ...sqlserver, username: v })}
          />
          <Field
            label="Password"
            type="password"
            className="col-span-2"
            value={sqlserver.password_encrypted ?? ""}
            onChange={(v) => setSqlserver({ ...sqlserver, password: v })}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          <Field
            label="Connection String"
            value={mongodb.connection_string_encrypted ?? ""}
            onChange={(v) => setMongodb({ ...mongodb, connection_string: v })}
          />
          <Field
            label="Database Name"
            value={mongodb.database ?? ""}
            onChange={(v) => setMongodb({ ...mongodb, database: v })}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-slate-200 rounded"
          onClick={onTest}
          disabled={status === "testing"}
        >
          Test Connection
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={onSave}
          disabled={update.isPending}
        >
          {update.isPending ? "Saving…" : "Save"}
        </button>
      </div>

      <p className="text-sm text-amber-700">
        Changing databases will require a data migration. Restart the backend after saving to
        take effect.
      </p>
    </div>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  className = "",
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`flex flex-col text-sm ${className}`}>
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

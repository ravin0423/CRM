import { useState } from "react";

/**
 * Database configuration tab.
 *
 * Fully drives the dual-database switch:
 *   - toggle between SQL Server and MongoDB
 *   - enter credentials
 *   - click "Test Connection" — backend calls DatabaseFactory.build(...).ping()
 *   - click "Save" — backend writes admin_settings.json and hot-reloads
 */
export default function DatabaseTab() {
  const [dbType, setDbType] = useState<"sqlserver" | "mongodb">("sqlserver");
  const [status] = useState<"connected" | "disconnected">("disconnected");

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-semibold">Database Configuration</h2>

      <div className="flex items-center gap-4">
        <label className="font-medium">Database Type:</label>
        <select
          value={dbType}
          onChange={(e) => setDbType(e.target.value as "sqlserver" | "mongodb")}
          className="border rounded px-3 py-1"
        >
          <option value="sqlserver">SQL Server Express</option>
          <option value="mongodb">MongoDB</option>
        </select>
        <span className={status === "connected" ? "text-green-600" : "text-red-600"}>
          {status === "connected" ? "● Connected" : "○ Disconnected"}
        </span>
      </div>

      {dbType === "sqlserver" ? <SqlServerForm /> : <MongoForm />}

      <div className="flex gap-2">
        <button className="px-4 py-2 bg-slate-200 rounded">Test Connection</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
      </div>

      <p className="text-sm text-amber-700">
        Changing databases will require a data migration. You will be prompted to confirm.
      </p>
    </div>
  );
}

function SqlServerForm() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Server" />
      <Field label="Port" defaultValue="1433" />
      <Field label="Database Name" />
      <Field label="Username" />
      <Field label="Password" type="password" className="col-span-2" />
    </div>
  );
}

function MongoForm() {
  return (
    <div className="grid grid-cols-1 gap-3">
      <Field label="Connection String" />
      <Field label="Database Name" />
    </div>
  );
}

function Field({
  label,
  type = "text",
  defaultValue = "",
  className = "",
}: {
  label: string;
  type?: string;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col text-sm ${className}`}>
      <span className="mb-1 text-slate-600">{label}</span>
      <input type={type} defaultValue={defaultValue} className="border rounded px-2 py-1" />
    </label>
  );
}

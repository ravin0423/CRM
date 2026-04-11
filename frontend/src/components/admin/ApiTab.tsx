import { useEffect, useState } from "react";

import { useAdminSettings, useUpdateAdminSettings } from "../../hooks/useAdminSettings";

export default function ApiTab() {
  const { data: settings, isLoading } = useAdminSettings();
  const update = useUpdateAdminSettings();
  const [api, setApi] = useState<Record<string, any>>({});

  useEffect(() => {
    if (settings?.api) setApi(settings.api);
  }, [settings]);

  if (isLoading) return <p>Loading…</p>;

  return (
    <div className="space-y-3 max-w-2xl">
      <h2 className="text-xl font-semibold">API Configuration</h2>
      <Field
        label="API Base URL"
        value={api.base_url ?? ""}
        onChange={(v) => setApi({ ...api, base_url: v })}
      />
      <Field
        label="Timezone"
        value={api.timezone ?? "UTC"}
        onChange={(v) => setApi({ ...api, timezone: v })}
      />
      <Field
        label="Session Timeout (minutes)"
        value={String(api.session_timeout_minutes ?? 30)}
        onChange={(v) => setApi({ ...api, session_timeout_minutes: Number(v) || 30 })}
      />
      <Field
        label="Max Upload (MB)"
        value={String(api.max_upload_mb ?? 100)}
        onChange={(v) => setApi({ ...api, max_upload_mb: Number(v) || 100 })}
      />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!api.debug}
          onChange={(e) => setApi({ ...api, debug: e.target.checked })}
        />
        <span>Enable Debug Mode</span>
      </label>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded"
        onClick={() => update.mutate({ api })}
      >
        Save
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col text-sm">
      <span className="mb-1 text-slate-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded px-2 py-1"
      />
    </label>
  );
}

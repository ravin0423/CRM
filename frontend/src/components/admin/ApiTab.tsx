import { useEffect, useState } from "react";
import { Globe, Loader2 } from "lucide-react";

import { useAdminSettings, useUpdateAdminSettings } from "../../hooks/useAdminSettings";

export default function ApiTab() {
  const { data: settings, isLoading } = useAdminSettings();
  const update = useUpdateAdminSettings();
  const [api, setApi] = useState<Record<string, any>>({});

  useEffect(() => {
    if (settings?.api) setApi(settings.api);
  }, [settings]);

  if (isLoading)
    return (
      <div style={{ color: "var(--text-muted)" }} className="flex items-center gap-2 py-8">
        <Loader2 size={16} className="animate-spin" /> Loading...
      </div>
    );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div style={{ background: "var(--accent)", opacity: 0.15 }} className="p-2 rounded-lg">
          <Globe size={20} style={{ color: "var(--accent)" }} />
        </div>
        <h2 style={{ color: "var(--text-primary)" }} className="text-xl font-semibold">
          API Configuration
        </h2>
      </div>

      <div className="glass-card p-5 space-y-4">
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
        <label className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
          <input
            type="checkbox"
            checked={!!api.debug}
            onChange={(e) => setApi({ ...api, debug: e.target.checked })}
            style={{ accentColor: "var(--accent)" }}
          />
          <span>Enable Debug Mode</span>
        </label>
        <button
          className="btn btn-primary"
          onClick={() => update.mutate({ api })}
        >
          Save
        </button>
      </div>
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
      <span className="mb-1" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
    </label>
  );
}

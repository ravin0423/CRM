import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Puzzle, CheckCircle } from "lucide-react";

import { useAdminSettings, useUpdateAdminSettings } from "../../hooks/useAdminSettings";

export default function IntegrationsTab() {
  const { data: settings } = useAdminSettings();
  const updateMut = useUpdateAdminSettings();
  const navigate = useNavigate();

  const integrations = (settings?.integrations ?? {}) as Record<string, any>;

  const [slackToken, setSlackToken] = useState(integrations.slack?.bot_token ?? "");
  const [slackChannel, setSlackChannel] = useState(integrations.slack?.channel ?? "");
  const [freshdeskDomain, setFreshdeskDomain] = useState(integrations.freshdesk?.domain ?? "");
  const [freshdeskKey, setFreshdeskKey] = useState(integrations.freshdesk?.api_key ?? "");
  const [webhookUrl, setWebhookUrl] = useState(integrations.webhook?.url ?? "");
  const [webhookEvents, setWebhookEvents] = useState(
    integrations.webhook?.events ?? "ticket.created,ticket.resolved",
  );
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateMut.mutate(
      {
        integrations: {
          slack: { bot_token: slackToken, channel: slackChannel },
          freshdesk: { domain: freshdeskDomain, api_key: freshdeskKey },
          webhook: { url: webhookUrl, events: webhookEvents },
        },
      },
      { onSuccess: () => setSaved(true) },
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div style={{ background: "var(--accent)", opacity: 0.15 }} className="p-2 rounded-lg">
          <Puzzle size={20} style={{ color: "var(--accent)" }} />
        </div>
        <h2 style={{ color: "var(--text-primary)" }} className="text-xl font-semibold">
          Integrations
        </h2>
      </div>

      {/* Freshdesk */}
      <div className="glass-card p-5 space-y-3">
        <h3 style={{ color: "var(--text-primary)" }} className="font-medium">
          Freshdesk Import
        </h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Enter your Freshdesk domain and API key, then launch the Import Wizard to migrate
          tickets, contacts, and custom fields.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Domain</span>
            <input
              value={freshdeskDomain}
              onChange={(e) => { setFreshdeskDomain(e.target.value); setSaved(false); }}
              placeholder="yourcompany.freshdesk.com"
              className="input mt-1 w-full"
            />
          </label>
          <label className="block text-sm">
            <span style={{ color: "var(--text-secondary)" }}>API Key</span>
            <input
              value={freshdeskKey}
              onChange={(e) => { setFreshdeskKey(e.target.value); setSaved(false); }}
              type="password"
              className="input mt-1 w-full"
            />
          </label>
        </div>
        <button
          onClick={() => navigate("/freshdesk-import")}
          disabled={!freshdeskDomain || !freshdeskKey}
          className="btn btn-primary btn-sm disabled:opacity-50"
        >
          Start Import Wizard
        </button>
      </div>

      {/* Slack */}
      <div className="glass-card p-5 space-y-3">
        <h3 style={{ color: "var(--text-primary)" }} className="font-medium">
          Slack Notifications
        </h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Post ticket events (created, resolved, escalated) to a Slack channel.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Bot Token</span>
            <input
              value={slackToken}
              onChange={(e) => { setSlackToken(e.target.value); setSaved(false); }}
              type="password"
              placeholder="xoxb-..."
              className="input mt-1 w-full"
            />
          </label>
          <label className="block text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Channel</span>
            <input
              value={slackChannel}
              onChange={(e) => { setSlackChannel(e.target.value); setSaved(false); }}
              placeholder="#support-alerts"
              className="input mt-1 w-full"
            />
          </label>
        </div>
      </div>

      {/* Outbound Webhook */}
      <div className="glass-card p-5 space-y-3">
        <h3 style={{ color: "var(--text-primary)" }} className="font-medium">
          Outbound Webhook
        </h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          POST JSON payloads to an external URL when selected events occur.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span style={{ color: "var(--text-secondary)" }}>URL</span>
            <input
              value={webhookUrl}
              onChange={(e) => { setWebhookUrl(e.target.value); setSaved(false); }}
              placeholder="https://hooks.example.com/crm"
              className="input mt-1 w-full"
            />
          </label>
          <label className="block text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Events (comma-separated)</span>
            <input
              value={webhookEvents}
              onChange={(e) => { setWebhookEvents(e.target.value); setSaved(false); }}
              className="input mt-1 w-full"
            />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={updateMut.isPending}
          className="btn btn-primary disabled:opacity-50"
        >
          {updateMut.isPending ? "Saving..." : "Save Integrations"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm" style={{ color: "var(--success)" }}>
            <CheckCircle size={14} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

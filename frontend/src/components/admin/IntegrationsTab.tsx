import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
      <h2 className="text-xl font-semibold">Integrations</h2>

      {/* Freshdesk */}
      <section className="space-y-2">
        <h3 className="font-medium">Freshdesk Import</h3>
        <p className="text-sm text-slate-600">
          Enter your Freshdesk domain and API key, then launch the Import Wizard to migrate
          tickets, contacts, and custom fields.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Domain
            <input
              value={freshdeskDomain}
              onChange={(e) => { setFreshdeskDomain(e.target.value); setSaved(false); }}
              placeholder="yourcompany.freshdesk.com"
              className="mt-1 block w-full border rounded px-2 py-1"
            />
          </label>
          <label className="block text-sm">
            API Key
            <input
              value={freshdeskKey}
              onChange={(e) => { setFreshdeskKey(e.target.value); setSaved(false); }}
              type="password"
              className="mt-1 block w-full border rounded px-2 py-1"
            />
          </label>
        </div>
        <button
          onClick={() => navigate("/freshdesk-import")}
          disabled={!freshdeskDomain || !freshdeskKey}
          className="mt-1 px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
        >
          Start Import Wizard
        </button>
      </section>

      {/* Slack */}
      <section className="space-y-2">
        <h3 className="font-medium">Slack Notifications</h3>
        <p className="text-sm text-slate-600">
          Post ticket events (created, resolved, escalated) to a Slack channel.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Bot Token
            <input
              value={slackToken}
              onChange={(e) => { setSlackToken(e.target.value); setSaved(false); }}
              type="password"
              placeholder="xoxb-..."
              className="mt-1 block w-full border rounded px-2 py-1"
            />
          </label>
          <label className="block text-sm">
            Channel
            <input
              value={slackChannel}
              onChange={(e) => { setSlackChannel(e.target.value); setSaved(false); }}
              placeholder="#support-alerts"
              className="mt-1 block w-full border rounded px-2 py-1"
            />
          </label>
        </div>
      </section>

      {/* Outbound Webhook */}
      <section className="space-y-2">
        <h3 className="font-medium">Outbound Webhook</h3>
        <p className="text-sm text-slate-600">
          POST JSON payloads to an external URL when selected events occur.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            URL
            <input
              value={webhookUrl}
              onChange={(e) => { setWebhookUrl(e.target.value); setSaved(false); }}
              placeholder="https://hooks.example.com/crm"
              className="mt-1 block w-full border rounded px-2 py-1"
            />
          </label>
          <label className="block text-sm">
            Events (comma-separated)
            <input
              value={webhookEvents}
              onChange={(e) => { setWebhookEvents(e.target.value); setSaved(false); }}
              className="mt-1 block w-full border rounded px-2 py-1"
            />
          </label>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={updateMut.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {updateMut.isPending ? "Saving..." : "Save Integrations"}
        </button>
        {saved && <span className="text-green-600 text-sm">Saved</span>}
      </div>
    </div>
  );
}

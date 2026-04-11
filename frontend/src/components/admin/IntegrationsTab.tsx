export default function IntegrationsTab() {
  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-semibold">Integrations</h2>

      <section>
        <h3 className="font-medium">Freshdesk</h3>
        <p className="text-sm text-slate-600">
          Enter your Freshdesk domain and API key, then launch the Import Wizard to migrate
          tickets, contacts, templates, and custom fields.
        </p>
        <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded">
          Start Import Wizard
        </button>
      </section>

      <section>
        <h3 className="font-medium">Slack</h3>
        <p className="text-sm text-slate-600">Bot token and channel for notifications.</p>
      </section>

      <section>
        <h3 className="font-medium">Calendar</h3>
        <p className="text-sm text-slate-600">Google / Outlook calendar sync.</p>
      </section>
    </div>
  );
}

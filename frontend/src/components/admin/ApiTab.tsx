export default function ApiTab() {
  return (
    <div className="space-y-3 max-w-2xl">
      <h2 className="text-xl font-semibold">API Configuration</h2>
      <p className="text-sm text-slate-600">
        Base URL, timezone, session timeout, max upload size, debug flag. Values flow into
        the runtime config.json that the frontend loads at boot.
      </p>
    </div>
  );
}

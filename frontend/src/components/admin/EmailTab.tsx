export default function EmailTab() {
  return (
    <div className="space-y-3 max-w-2xl">
      <h2 className="text-xl font-semibold">Email Configuration</h2>
      <p className="text-sm text-slate-600">
        SMTP host, port, credentials, and the From identity. All values stored via Admin API,
        never read from environment variables.
      </p>
      {/* TODO: form fields + Test Email button */}
    </div>
  );
}

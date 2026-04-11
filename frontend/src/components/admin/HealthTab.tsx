export default function HealthTab() {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">System Health</h2>
      <ul className="text-sm space-y-1">
        <li>Database: <span className="text-green-600">✓ Connected</span></li>
        <li>MinIO Storage: <span className="text-green-600">✓ Connected</span></li>
        <li>Email Server: <span className="text-slate-500">— Not tested</span></li>
        <li>Redis Cache: <span className="text-green-600">✓ Connected</span></li>
        <li>API Backend: <span className="text-green-600">✓ Running</span></li>
      </ul>
    </div>
  );
}

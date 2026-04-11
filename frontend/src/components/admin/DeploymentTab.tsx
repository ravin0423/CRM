export default function DeploymentTab() {
  return (
    <div className="space-y-3 max-w-2xl">
      <h2 className="text-xl font-semibold">Deployment</h2>
      <p className="text-sm text-slate-600">
        Toggle between Local and AWS. AWS mode collects credentials, region, instance sizes,
        then runs the one-click deploy script.
      </p>
    </div>
  );
}

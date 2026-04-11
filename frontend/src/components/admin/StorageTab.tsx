export default function StorageTab() {
  return (
    <div className="space-y-3 max-w-2xl">
      <h2 className="text-xl font-semibold">File Storage Configuration</h2>
      <p className="text-sm text-slate-600">
        Switch between MinIO (local) and AWS S3. Credentials here are encrypted before
        persistence. Includes Test Connection button and bucket usage display.
      </p>
      {/* TODO: storage type select + credential forms */}
    </div>
  );
}

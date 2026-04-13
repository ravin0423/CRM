import { useState } from "react";

import { useAdminSettings, useUpdateAdminSettings } from "../../hooks/useAdminSettings";
import { api } from "../../lib/api";

export default function BackupTab() {
  const { data: settings } = useAdminSettings();
  const updateMut = useUpdateAdminSettings();

  const backup = (settings as any)?.backup ?? {};

  const [schedule, setSchedule] = useState(backup.schedule ?? "daily");
  const [location, setLocation] = useState(backup.location ?? "local");
  const [retentionDays, setRetentionDays] = useState(backup.retention_days ?? 30);
  const [s3Bucket, setS3Bucket] = useState(backup.s3_bucket ?? "");
  const [saved, setSaved] = useState(false);

  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const save = () => {
    updateMut.mutate(
      {
        backup: {
          schedule,
          location,
          retention_days: retentionDays,
          s3_bucket: s3Bucket,
        },
      } as any,
      { onSuccess: () => setSaved(true) },
    );
  };

  const runBackupNow = async () => {
    setIsRunning(true);
    setBackupStatus(null);
    try {
      const res = await api().post("/admin/settings/backup/now");
      setBackupStatus(`Backup completed: ${(res.data as any)?.file ?? "ok"}`);
    } catch (err: any) {
      setBackupStatus(
        `Backup failed: ${err?.response?.data?.detail ?? err.message}`,
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <h2 className="text-xl font-semibold">Backup &amp; Recovery</h2>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm">
          Schedule
          <select
            value={schedule}
            onChange={(e) => { setSchedule(e.target.value); setSaved(false); }}
            className="mt-1 block w-full border rounded px-2 py-1"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="manual">Manual only</option>
          </select>
        </label>

        <label className="block text-sm">
          Location
          <select
            value={location}
            onChange={(e) => { setLocation(e.target.value); setSaved(false); }}
            className="mt-1 block w-full border rounded px-2 py-1"
          >
            <option value="local">Local filesystem</option>
            <option value="s3">Amazon S3</option>
          </select>
        </label>

        <label className="block text-sm">
          Retention (days)
          <input
            type="number"
            min={1}
            value={retentionDays}
            onChange={(e) => { setRetentionDays(Number(e.target.value)); setSaved(false); }}
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </label>

        {location === "s3" && (
          <label className="block text-sm">
            S3 Bucket
            <input
              value={s3Bucket}
              onChange={(e) => { setS3Bucket(e.target.value); setSaved(false); }}
              placeholder="my-crm-backups"
              className="mt-1 block w-full border rounded px-2 py-1"
            />
          </label>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={updateMut.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {updateMut.isPending ? "Saving..." : "Save"}
        </button>
        <button
          onClick={runBackupNow}
          disabled={isRunning}
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded disabled:opacity-50"
        >
          {isRunning ? "Running..." : "Backup Now"}
        </button>
        {saved && <span className="text-green-600 text-sm">Saved</span>}
      </div>

      {backupStatus && (
        <p className={`text-sm ${backupStatus.includes("failed") ? "text-red-600" : "text-green-600"}`}>
          {backupStatus}
        </p>
      )}
    </div>
  );
}

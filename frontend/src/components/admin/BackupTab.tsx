import { useState } from "react";
import { Play, Save, CheckCircle2, XCircle } from "lucide-react";

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
      setBackupStatus(`Backup failed: ${err?.response?.data?.detail ?? err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const isFailed = backupStatus?.includes("failed");

  return (
    <div className="space-y-5 max-w-2xl animate-fade-in">
      <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        Backup &amp; Recovery
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm">
          <span style={{ color: "var(--text-secondary)" }}>Schedule</span>
          <select
            value={schedule}
            onChange={(e) => {
              setSchedule(e.target.value);
              setSaved(false);
            }}
            className="input mt-1"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="manual">Manual only</option>
          </select>
        </label>

        <label className="block text-sm">
          <span style={{ color: "var(--text-secondary)" }}>Location</span>
          <select
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setSaved(false);
            }}
            className="input mt-1"
          >
            <option value="local">Local filesystem</option>
            <option value="s3">Amazon S3</option>
          </select>
        </label>

        <label className="block text-sm">
          <span style={{ color: "var(--text-secondary)" }}>Retention (days)</span>
          <input
            type="number"
            min={1}
            value={retentionDays}
            onChange={(e) => {
              setRetentionDays(Number(e.target.value));
              setSaved(false);
            }}
            className="input mt-1"
          />
        </label>

        {location === "s3" && (
          <label className="block text-sm">
            <span style={{ color: "var(--text-secondary)" }}>S3 Bucket</span>
            <input
              value={s3Bucket}
              onChange={(e) => {
                setS3Bucket(e.target.value);
                setSaved(false);
              }}
              placeholder="my-crm-backups"
              className="input mt-1"
            />
          </label>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={updateMut.isPending} className="btn btn-primary">
          <Save size={14} /> {updateMut.isPending ? "Saving..." : "Save"}
        </button>
        <button onClick={runBackupNow} disabled={isRunning} className="btn btn-secondary">
          <Play size={14} /> {isRunning ? "Running..." : "Backup Now"}
        </button>
        {saved && (
          <span className="text-sm flex items-center gap-1" style={{ color: "var(--success)" }}>
            <CheckCircle2 size={14} /> Saved
          </span>
        )}
      </div>

      {backupStatus && (
        <p
          className="text-sm flex items-center gap-2"
          style={{ color: isFailed ? "var(--danger)" : "var(--success)" }}
        >
          {isFailed ? <XCircle size={14} /> : <CheckCircle2 size={14} />} {backupStatus}
        </p>
      )}
    </div>
  );
}

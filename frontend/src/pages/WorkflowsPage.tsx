import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Zap, Edit2, Trash2, X } from "lucide-react";

import { api } from "../lib/api";

interface Workflow {
  id: number;
  name: string;
  trigger_type: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
}

const TRIGGER_TYPES = [
  "ticket.created",
  "ticket.updated",
  "contact.created",
  "deal.stage_changed",
];

export default function WorkflowsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    trigger_type: TRIGGER_TYPES[0],
    conditions: "{}",
    actions: "{}",
    enabled: true,
  });

  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ["workflows"],
    queryFn: async () => (await api().get("/workflows")).data,
  });

  const createMut = useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      (await api().post("/workflows", data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      resetForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown> & { id: number }) =>
      (await api().patch(`/workflows/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => api().delete(`/workflows/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) =>
      (await api().patch(`/workflows/${id}`, { enabled })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });

  function resetForm() {
    setForm({ name: "", trigger_type: TRIGGER_TYPES[0], conditions: "{}", actions: "{}", enabled: true });
    setEditId(null);
    setShowForm(false);
  }

  function startEdit(w: Workflow) {
    setForm({
      name: w.name,
      trigger_type: w.trigger_type,
      conditions: JSON.stringify(w.conditions, null, 2),
      actions: JSON.stringify(w.actions, null, 2),
      enabled: w.enabled,
    });
    setEditId(w.id);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let conditions: Record<string, unknown>;
    let actions: Record<string, unknown>;
    try {
      conditions = JSON.parse(form.conditions);
      actions = JSON.parse(form.actions);
    } catch {
      alert("Invalid JSON in conditions or actions");
      return;
    }

    const payload = { name: form.name, trigger_type: form.trigger_type, conditions, actions, enabled: form.enabled };

    if (editId) {
      updateMut.mutate({ id: editId, ...payload });
    } else {
      createMut.mutate(payload);
    }
  }

  if (isLoading)
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading workflows...</div>
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "0.75rem",
              background: "rgba(139, 92, 246, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={20} style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Workflow Automation
            </h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
              {workflows.length} workflow{workflows.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className={showForm ? "btn btn-secondary" : "btn btn-primary"}
        >
          {showForm ? (
            <>
              <X size={16} />
              Cancel
            </>
          ) : (
            <>
              <Plus size={16} />
              New Workflow
            </>
          )}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.25rem" }}>
            {editId ? "Edit Workflow" : "Create Workflow"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: "0.375rem",
                }}
              >
                Name
              </label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: "0.375rem",
                }}
              >
                Trigger Type
              </label>
              <select
                className="input"
                value={form.trigger_type}
                onChange={(e) => setForm({ ...form, trigger_type: e.target.value })}
              >
                {TRIGGER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: "0.375rem",
                }}
              >
                Conditions (JSON)
              </label>
              <textarea
                className="input"
                style={{ fontFamily: "monospace", fontSize: "0.8125rem", resize: "vertical" }}
                rows={4}
                value={form.conditions}
                onChange={(e) => setForm({ ...form, conditions: e.target.value })}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: "0.375rem",
                }}
              >
                Actions (JSON)
              </label>
              <textarea
                className="input"
                style={{ fontFamily: "monospace", fontSize: "0.8125rem", resize: "vertical" }}
                rows={4}
                value={form.actions}
                onChange={(e) => setForm({ ...form, actions: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem" }}>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              id="wf-enabled"
              style={{ accentColor: "var(--accent)" }}
            />
            <label htmlFor="wf-enabled" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              Enabled
            </label>
          </div>
          <div style={{ marginTop: "1.25rem" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMut.isPending || updateMut.isPending}
            >
              {editId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {workflows.length === 0 ? (
        <div
          className="glass-card"
          style={{ padding: "3rem", textAlign: "center" }}
        >
          <Zap size={40} style={{ color: "var(--text-muted)", margin: "0 auto 0.75rem" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No workflows configured yet.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Trigger</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((w) => (
                <tr key={w.id}>
                  <td style={{ fontWeight: 500 }}>{w.name}</td>
                  <td>
                    <span className="badge badge-blue" style={{ fontFamily: "monospace" }}>
                      {w.trigger_type}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleMut.mutate({ id: w.id, enabled: !w.enabled })}
                      className={`badge ${w.enabled ? "badge-green" : "badge-slate"}`}
                      style={{ cursor: "pointer", border: "none", background: undefined }}
                    >
                      {w.enabled ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.25rem" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(w)} title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          if (confirm(`Delete workflow "${w.name}"?`)) {
                            deleteMut.mutate(w.id);
                          }
                        }}
                        title="Delete"
                        style={{ color: "var(--danger)" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

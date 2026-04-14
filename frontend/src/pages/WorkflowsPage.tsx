import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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

  if (isLoading) return <p>Loading workflows...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Workflow Automation</h1>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "New Workflow"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 space-y-4">
          <h2 className="font-medium">{editId ? "Edit Workflow" : "Create Workflow"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                className="border rounded px-3 py-2 w-full"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trigger Type</label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={form.trigger_type}
                onChange={(e) => setForm({ ...form, trigger_type: e.target.value })}
              >
                {TRIGGER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Conditions (JSON)</label>
              <textarea
                className="border rounded px-3 py-2 w-full font-mono text-sm"
                rows={4}
                value={form.conditions}
                onChange={(e) => setForm({ ...form, conditions: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Actions (JSON)</label>
              <textarea
                className="border rounded px-3 py-2 w-full font-mono text-sm"
                rows={4}
                value={form.actions}
                onChange={(e) => setForm({ ...form, actions: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              id="wf-enabled"
            />
            <label htmlFor="wf-enabled" className="text-sm">Enabled</label>
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            disabled={createMut.isPending || updateMut.isPending}
          >
            {editId ? "Update" : "Create"}
          </button>
        </form>
      )}

      {workflows.length === 0 ? (
        <p className="text-slate-500">No workflows configured yet.</p>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Trigger</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((w) => (
                <tr key={w.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium">{w.name}</td>
                  <td className="px-4 py-2">
                    <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-mono">
                      {w.trigger_type}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => toggleMut.mutate({ id: w.id, enabled: !w.enabled })}
                      className={`text-xs px-2 py-0.5 rounded ${
                        w.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {w.enabled ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button
                      onClick={() => startEdit(w)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete workflow "${w.name}"?`)) {
                          deleteMut.mutate(w.id);
                        }
                      }}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Delete
                    </button>
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

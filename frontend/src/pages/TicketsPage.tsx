import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../lib/api";

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function TicketsPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["tickets"],
    queryFn: async () => (await api().get("/tickets")).data,
  });

  const createMutation = useMutation({
    mutationFn: async (body: Partial<Ticket> & { description?: string }) =>
      (await api().post("/tickets", body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      setShowNew(false);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded"
          onClick={() => setShowNew((s) => !s)}
        >
          {showNew ? "Cancel" : "+ New Ticket"}
        </button>
      </div>

      {showNew && <NewTicketForm onSubmit={(v) => createMutation.mutate(v)} />}

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <table className="w-full bg-white rounded shadow text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Subject</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-3 py-2 font-mono">{t.ticket_number}</td>
                <td className="px-3 py-2">{t.subject}</td>
                <td className="px-3 py-2">{t.status}</td>
                <td className="px-3 py-2">{t.priority}</td>
                <td className="px-3 py-2">{new Date(t.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={5}>
                  No tickets yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

function NewTicketForm({
  onSubmit,
}: {
  onSubmit: (values: { subject: string; description: string; priority: string }) => void;
}) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ subject, description, priority });
    setSubject("");
    setDescription("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded shadow p-4 mb-4 space-y-2 max-w-xl"
    >
      <input
        required
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full border rounded px-2 py-1"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className="w-full border rounded px-2 py-1"
      />
      <div className="flex items-center gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">
          Create
        </button>
      </div>
    </form>
  );
}

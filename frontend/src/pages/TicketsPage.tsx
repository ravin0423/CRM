import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Loader2, Ticket, AlertCircle, Send } from "lucide-react";

import { api } from "../lib/api";

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

const statusBadge: Record<string, string> = {
  open: "badge badge-blue",
  pending: "badge badge-amber",
  resolved: "badge badge-green",
  closed: "badge badge-slate",
};

const priorityBadge: Record<string, string> = {
  low: "badge badge-slate",
  medium: "badge badge-blue",
  high: "badge badge-amber",
  urgent: "badge badge-red",
};

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
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--accent), #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ticket size={20} color="#fff" />
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Tickets
            </h1>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              {tickets.length} total ticket{tickets.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          className={showNew ? "btn btn-secondary" : "btn btn-primary"}
          onClick={() => setShowNew((s) => !s)}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          {showNew ? (
            <>
              <X size={16} /> Cancel
            </>
          ) : (
            <>
              <Plus size={16} /> New Ticket
            </>
          )}
        </button>
      </div>

      {/* New ticket form */}
      {showNew && <NewTicketForm onSubmit={(v) => createMutation.mutate(v)} />}

      {/* Loading state */}
      {isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem",
            color: "var(--text-muted)",
            gap: "0.75rem",
          }}
        >
          <Loader2
            size={20}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <span>Loading tickets...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td
                    style={{
                      fontFamily: "monospace",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {t.ticket_number}
                  </td>
                  <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                    {t.subject}
                  </td>
                  <td>
                    <span className={statusBadge[t.status] || "badge badge-slate"}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <span className={priorityBadge[t.priority] || "badge badge-slate"}>
                      {t.priority}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {new Date(t.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      padding: "2.5rem 1rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <AlertCircle size={28} style={{ opacity: 0.4 }} />
                      <span>No tickets yet. Create one to get started.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NewTicketForm({
  onSubmit,
}: {
  onSubmit: (values: {
    subject: string;
    description: string;
    priority: string;
  }) => void;
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
      className="glass-card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        maxWidth: 560,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: "1rem",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        Create New Ticket
      </h3>
      <input
        required
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="input"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className="input"
        style={{ resize: "vertical" }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="input"
          style={{ width: "auto" }}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Send size={14} />
          Create
        </button>
      </div>
    </form>
  );
}

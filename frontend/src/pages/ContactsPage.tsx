import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Loader2, Users, UserPlus, UserCircle } from "lucide-react";

import { api } from "../lib/api";

interface Contact {
  id: number;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  created_at: string;
}

export default function ContactsPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: async () => (await api().get("/contacts")).data,
  });

  const createMutation = useMutation({
    mutationFn: async (body: Partial<Contact>) =>
      (await api().post("/contacts", body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
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
            <Users size={20} color="#fff" />
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
              Contacts
            </h1>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              {contacts.length} total contact{contacts.length !== 1 ? "s" : ""}
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
              <Plus size={16} /> New Contact
            </>
          )}
        </button>
      </div>

      {/* New contact form */}
      {showNew && <NewContactForm onSubmit={(v) => createMutation.mutate(v)} />}

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
          <span>Loading contacts...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <UserCircle
                        size={20}
                        style={{ color: "var(--text-muted)", flexShrink: 0 }}
                      />
                      <span
                        style={{
                          color: "var(--text-primary)",
                          fontWeight: 500,
                        }}
                      >
                        {c.name ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{c.email}</td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {c.company ?? "—"}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {c.phone ?? "—"}
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
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
                      <Users size={28} style={{ opacity: 0.4 }} />
                      <span>No contacts yet. Add one to get started.</span>
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

function NewContactForm({
  onSubmit,
}: {
  onSubmit: (v: Partial<Contact>) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ email, name, company, phone });
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
        Add New Contact
      </h3>
      <input
        required
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input"
      />
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input"
      />
      <input
        placeholder="Company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="input"
      />
      <input
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="input"
      />
      <div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <UserPlus size={14} />
          Create Contact
        </button>
      </div>
    </form>
  );
}

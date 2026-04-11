import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
    mutationFn: async (body: Partial<Contact>) => (await api().post("/contacts", body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      setShowNew(false);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded"
          onClick={() => setShowNew((s) => !s)}
        >
          {showNew ? "Cancel" : "+ New Contact"}
        </button>
      </div>

      {showNew && <NewContactForm onSubmit={(v) => createMutation.mutate(v)} />}

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <table className="w-full bg-white rounded shadow text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Phone</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2">{c.name ?? "—"}</td>
                <td className="px-3 py-2">{c.email}</td>
                <td className="px-3 py-2">{c.company ?? "—"}</td>
                <td className="px-3 py-2">{c.phone ?? "—"}</td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={4}>
                  No contacts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

function NewContactForm({ onSubmit }: { onSubmit: (v: Partial<Contact>) => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ email, name, company, phone });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 mb-4 space-y-2 max-w-xl">
      <input
        required
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border rounded px-2 py-1"
      />
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border rounded px-2 py-1"
      />
      <input
        placeholder="Company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="w-full border rounded px-2 py-1"
      />
      <input
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full border rounded px-2 py-1"
      />
      <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">
        Create
      </button>
    </form>
  );
}

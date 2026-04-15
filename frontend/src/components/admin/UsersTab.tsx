import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Key, Edit2, Check, X, Power } from "lucide-react";

import { api } from "../../lib/api";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  must_change_password: boolean;
}

interface CreateUserPayload {
  email: string;
  name: string;
  password: string;
  role: "admin" | "agent" | "viewer";
}

interface UpdateUserPayload {
  name?: string;
  role?: "admin" | "agent" | "viewer";
  status?: "active" | "inactive";
}

export default function UsersTab() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [resetId, setResetId] = useState<number | null>(null);

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => (await api().get("/users")).data,
  });

  const createMut = useMutation({
    mutationFn: async (payload: CreateUserPayload) =>
      (await api().post("/users", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setShowCreate(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, ...patch }: UpdateUserPayload & { id: number }) =>
      (await api().patch(`/users/${id}`, patch)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingId(null);
    },
  });

  const resetPwMut = useMutation({
    mutationFn: async ({ id, new_password }: { id: number; new_password: string }) =>
      (await api().post(`/users/${id}/reset-password`, { new_password })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setResetId(null);
    },
  });

  if (isLoading) return <p style={{ color: "var(--text-muted)" }}>Loading...</p>;

  const roleBadge = (role: string) =>
    role === "admin" ? "badge badge-purple" : role === "agent" ? "badge badge-blue" : "badge badge-slate";

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          User Management
        </h2>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm">
          <UserPlus size={14} /> New User
        </button>
      </div>

      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Role-based access control: Admin (full access), Agent (tickets + contacts), Viewer (read-only).
      </p>

      {showCreate && (
        <CreateUserForm
          onSubmit={(p) => createMut.mutate(p)}
          onCancel={() => setShowCreate(false)}
          error={createMut.error instanceof Error ? createMut.error.message : null}
          isPending={createMut.isPending}
        />
      )}

      {resetId !== null && (
        <ResetPasswordForm
          userId={resetId}
          onSubmit={(pw) => resetPwMut.mutate({ id: resetId, new_password: pw })}
          onCancel={() => setResetId(null)}
          error={resetPwMut.error instanceof Error ? resetPwMut.error.message : null}
          isPending={resetPwMut.isPending}
        />
      )}

      <div className="table-wrapper">
        <table className="w-full text-sm">
          <thead style={{ background: "var(--bg-elevated)" }}>
            <tr className="text-left">
              <th className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>Name</th>
              <th className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>Email</th>
              <th className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>Role</th>
              <th className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>Status</th>
              <th className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderTop: "1px solid var(--border-color)" }}>
                {editingId === u.id ? (
                  <EditUserRow
                    user={u}
                    onSave={(patch) => updateMut.mutate({ id: u.id, ...patch })}
                    onCancel={() => setEditingId(null)}
                    isPending={updateMut.isPending}
                  />
                ) : (
                  <>
                    <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>{u.name}</td>
                    <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                    <td className="px-3 py-2">
                      <span className={roleBadge(u.role)}>{u.role}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={u.status === "active" ? "badge badge-green" : "badge badge-red"}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 space-x-2">
                      <button onClick={() => setEditingId(u.id)} className="btn btn-ghost btn-sm">
                        <Edit2 size={12} /> Edit
                      </button>
                      <button onClick={() => setResetId(u.id)} className="btn btn-ghost btn-sm">
                        <Key size={12} /> Reset PW
                      </button>
                      <button
                        onClick={() =>
                          updateMut.mutate({
                            id: u.id,
                            status: u.status === "active" ? "inactive" : "active",
                          })
                        }
                        className="btn btn-ghost btn-sm"
                        style={{ color: u.status === "active" ? "var(--danger)" : "var(--success)" }}
                      >
                        <Power size={12} /> {u.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateUserForm({
  onSubmit,
  onCancel,
  error,
  isPending,
}: {
  onSubmit: (p: CreateUserPayload) => void;
  onCancel: () => void;
  error: string | null;
  isPending: boolean;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "agent" | "viewer">("agent");

  return (
    <div className="glass-card p-4 space-y-3">
      <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>Create New User</h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input mt-1"
          />
        </label>
        <label className="block">
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="input mt-1"
          >
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
        </label>
      </div>
      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          disabled={isPending || !email || !name || !password}
          onClick={() => onSubmit({ email, name, password, role })}
          className="btn btn-primary btn-sm"
        >
          {isPending ? "Creating..." : "Create"}
        </button>
        <button onClick={onCancel} className="btn btn-secondary btn-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

function EditUserRow({
  user,
  onSave,
  onCancel,
  isPending,
}: {
  user: AdminUser;
  onSave: (p: UpdateUserPayload) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);

  return (
    <>
      <td className="px-3 py-2">
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
      </td>
      <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>{user.email}</td>
      <td className="px-3 py-2">
        <select value={role} onChange={(e) => setRole(e.target.value)} className="input">
          <option value="admin">admin</option>
          <option value="agent">agent</option>
          <option value="viewer">viewer</option>
        </select>
      </td>
      <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>{user.status}</td>
      <td className="px-3 py-2 space-x-2">
        <button
          disabled={isPending}
          onClick={() =>
            onSave({
              ...(name !== user.name ? { name } : {}),
              ...(role !== user.role ? { role: role as "admin" | "agent" | "viewer" } : {}),
            })
          }
          className="btn btn-ghost btn-sm"
          style={{ color: "var(--success)" }}
        >
          <Check size={12} /> Save
        </button>
        <button onClick={onCancel} className="btn btn-ghost btn-sm">
          <X size={12} /> Cancel
        </button>
      </td>
    </>
  );
}

function ResetPasswordForm({
  userId,
  onSubmit,
  onCancel,
  error,
  isPending,
}: {
  userId: number;
  onSubmit: (pw: string) => void;
  onCancel: () => void;
  error: string | null;
  isPending: boolean;
}) {
  const [pw, setPw] = useState("");

  return (
    <div
      className="glass-card p-4 space-y-3"
      style={{ borderColor: "var(--warning)", borderWidth: "1px" }}
    >
      <h3 className="font-medium" style={{ color: "var(--warning)" }}>
        Reset Password — User #{userId}
      </h3>
      <label className="block max-w-xs">
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>New Password</span>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="input mt-1"
        />
      </label>
      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          disabled={isPending || pw.length < 6}
          onClick={() => onSubmit(pw)}
          className="btn btn-primary btn-sm"
        >
          {isPending ? "Resetting..." : "Reset Password"}
        </button>
        <button onClick={onCancel} className="btn btn-secondary btn-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

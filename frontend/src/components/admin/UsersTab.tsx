import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">User Management</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          + New User
        </button>
      </div>

      <p className="text-sm text-slate-600">
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

      <table className="w-full bg-white rounded shadow text-sm">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              {editingId === u.id ? (
                <EditUserRow
                  user={u}
                  onSave={(patch) => updateMut.mutate({ id: u.id, ...patch })}
                  onCancel={() => setEditingId(null)}
                  isPending={updateMut.isPending}
                />
              ) : (
                <>
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : u.role === "agent"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        u.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 space-x-2">
                    <button
                      onClick={() => setEditingId(u.id)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setResetId(u.id)}
                      className="text-amber-600 hover:underline text-xs"
                    >
                      Reset PW
                    </button>
                    {u.status === "active" ? (
                      <button
                        onClick={() => updateMut.mutate({ id: u.id, status: "inactive" })}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => updateMut.mutate({ id: u.id, status: "active" })}
                        className="text-green-600 hover:underline text-xs"
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
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
    <div className="border rounded p-4 bg-slate-50 space-y-3">
      <h3 className="font-medium">Create New User</h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm text-slate-600">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="mt-1 block w-full border rounded px-2 py-1 text-sm"
          >
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
        </label>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-2">
        <button
          disabled={isPending || !email || !name || !password}
          onClick={() => onSubmit({ email, name, password, role })}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create"}
        </button>
        <button onClick={onCancel} className="px-3 py-1 border rounded text-sm">
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
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
        />
      </td>
      <td className="px-3 py-2 text-slate-500">{user.email}</td>
      <td className="px-3 py-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="admin">admin</option>
          <option value="agent">agent</option>
          <option value="viewer">viewer</option>
        </select>
      </td>
      <td className="px-3 py-2">{user.status}</td>
      <td className="px-3 py-2 space-x-2">
        <button
          disabled={isPending}
          onClick={() =>
            onSave({
              ...(name !== user.name ? { name } : {}),
              ...(role !== user.role ? { role: role as "admin" | "agent" | "viewer" } : {}),
            })
          }
          className="text-green-600 hover:underline text-xs"
        >
          Save
        </button>
        <button onClick={onCancel} className="text-slate-500 hover:underline text-xs">
          Cancel
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
    <div className="border rounded p-4 bg-amber-50 space-y-3">
      <h3 className="font-medium">Reset Password — User #{userId}</h3>
      <label className="block">
        <span className="text-sm text-slate-600">New Password</span>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="mt-1 block w-full border rounded px-2 py-1 text-sm max-w-xs"
        />
      </label>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-2">
        <button
          disabled={isPending || pw.length < 6}
          onClick={() => onSubmit(pw)}
          className="px-3 py-1 bg-amber-600 text-white rounded text-sm disabled:opacity-50"
        >
          {isPending ? "Resetting..." : "Reset Password"}
        </button>
        <button onClick={onCancel} className="px-3 py-1 border rounded text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

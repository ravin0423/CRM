import { useQuery } from "@tanstack/react-query";

import { api } from "../../lib/api";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
}

export default function UsersTab() {
  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => (await api().get("/auth/me")).data as any,
    // NB: In Phase 1 we only have /auth/me; a full /users CRUD endpoint arrives
    // in Phase 1.5. This placeholder shows the current admin so the tab is
    // never empty.
    select: (d) => (Array.isArray(d) ? d : [d]),
  });

  if (isLoading) return <p>Loading…</p>;

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">User Management</h2>
      <p className="text-sm text-slate-600">
        Role-based access control with Admin / Agent / Viewer roles. Full user management
        (create, edit, deactivate) ships in Phase 1.5.
      </p>
      <table className="w-full bg-white rounded shadow text-sm">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="px-3 py-2">{u.name}</td>
              <td className="px-3 py-2">{u.email}</td>
              <td className="px-3 py-2">{u.role}</td>
              <td className="px-3 py-2">{u.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { Routes, Route, NavLink } from "react-router-dom";

import DatabaseTab from "../components/admin/DatabaseTab";
import EmailTab from "../components/admin/EmailTab";
import StorageTab from "../components/admin/StorageTab";
import ApiTab from "../components/admin/ApiTab";
import IntegrationsTab from "../components/admin/IntegrationsTab";
import UsersTab from "../components/admin/UsersTab";
import BackupTab from "../components/admin/BackupTab";
import DeploymentTab from "../components/admin/DeploymentTab";
import HealthTab from "../components/admin/HealthTab";
import AboutTab from "../components/admin/AboutTab";

const tabs = [
  { to: "database", label: "Database" },
  { to: "email", label: "Email" },
  { to: "storage", label: "File Storage" },
  { to: "api", label: "API" },
  { to: "integrations", label: "Integrations" },
  { to: "users", label: "Users" },
  { to: "backup", label: "Backup & Recovery" },
  { to: "deployment", label: "Deployment" },
  { to: "health", label: "System Health" },
  { to: "about", label: "About / Help" },
];

export default function AdminPanel() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Admin Panel</h1>
      <div className="flex gap-6">
        <aside className="w-56 space-y-1">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded ${isActive ? "bg-slate-900 text-white" : "hover:bg-slate-200"}`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </aside>
        <section className="flex-1 bg-white rounded shadow p-6">
          <Routes>
            <Route path="database" element={<DatabaseTab />} />
            <Route path="email" element={<EmailTab />} />
            <Route path="storage" element={<StorageTab />} />
            <Route path="api" element={<ApiTab />} />
            <Route path="integrations" element={<IntegrationsTab />} />
            <Route path="users" element={<UsersTab />} />
            <Route path="backup" element={<BackupTab />} />
            <Route path="deployment" element={<DeploymentTab />} />
            <Route path="health" element={<HealthTab />} />
            <Route path="about" element={<AboutTab />} />
          </Routes>
        </section>
      </div>
    </div>
  );
}

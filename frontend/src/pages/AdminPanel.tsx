import { Routes, Route, NavLink } from "react-router-dom";
import {
  Database,
  Mail,
  HardDrive,
  Code,
  Plug,
  Users,
  Archive,
  Rocket,
  Activity,
  Info,
} from "lucide-react";

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
  { to: "database", label: "Database", icon: Database },
  { to: "email", label: "Email", icon: Mail },
  { to: "storage", label: "File Storage", icon: HardDrive },
  { to: "api", label: "API", icon: Code },
  { to: "integrations", label: "Integrations", icon: Plug },
  { to: "users", label: "Users", icon: Users },
  { to: "backup", label: "Backup & Recovery", icon: Archive },
  { to: "deployment", label: "Deployment", icon: Rocket },
  { to: "health", label: "System Health", icon: Activity },
  { to: "about", label: "About / Help", icon: Info },
];

export default function AdminPanel() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
        Admin Panel
      </h1>
      <div className="flex gap-6">
        <aside className="w-56 space-y-1 glass-card p-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive ? "" : ""
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive
                    ? "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))"
                    : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                })}
              >
                <Icon size={16} />
                {t.label}
              </NavLink>
            );
          })}
        </aside>
        <section className="flex-1 glass-card p-6">
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

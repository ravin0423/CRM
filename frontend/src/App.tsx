import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  Users,
  BookOpen,
  MessageCircle,
  Workflow,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";

import AdminPanel from "./pages/AdminPanel";
import AnalyticsPage from "./pages/AnalyticsPage";
import ChatbotPage from "./pages/ChatbotPage";
import ContactsPage from "./pages/ContactsPage";
import FreshdeskImportPage from "./pages/FreshdeskImportPage";
import KnowledgePage from "./pages/KnowledgePage";
import LoginPage from "./pages/LoginPage";
import TicketsPage from "./pages/TicketsPage";
import WorkflowsPage from "./pages/WorkflowsPage";
import { useAuthStore } from "./store/auth";
import { useThemeStore } from "./store/theme";

function Protected({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

const NAV_ITEMS = [
  { to: "/tickets", icon: Ticket, label: "Tickets" },
  { to: "/contacts", icon: Users, label: "Contacts" },
  { to: "/knowledge", icon: BookOpen, label: "Knowledge Base" },
  { to: "/chatbot", icon: MessageCircle, label: "Chatbot" },
  { to: "/workflows", icon: Workflow, label: "Workflows" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/admin", icon: Settings, label: "Admin Panel" },
];

export default function App() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const { theme, toggle } = useThemeStore();
  const location = useLocation();

  if (!token) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <nav className="glass-sidebar w-60 flex flex-col p-4 sticky top-0 h-screen">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
            <LayoutDashboard size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
            Support CRM
          </span>
        </div>

        {/* Nav links */}
        <div className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "text-white"
                    : ""
                }`}
                style={{
                  background: isActive ? "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))" : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--bg-elevated)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Bottom section */}
        <div className="border-t pt-4 space-y-3" style={{ borderColor: "var(--border-color)" }}>
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          {/* User info */}
          <div className="px-3 py-2">
            <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {user?.name || user?.email || "—"}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {user?.email || ""}
            </p>
          </div>

          <button
            onClick={clear}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: "var(--danger)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/tickets" replace />} />
          <Route path="/login" element={<Navigate to="/tickets" replace />} />
          <Route path="/tickets" element={<Protected><TicketsPage /></Protected>} />
          <Route path="/contacts" element={<Protected><ContactsPage /></Protected>} />
          <Route path="/knowledge" element={<Protected><KnowledgePage /></Protected>} />
          <Route path="/chatbot" element={<Protected><ChatbotPage /></Protected>} />
          <Route path="/workflows" element={<Protected><WorkflowsPage /></Protected>} />
          <Route path="/analytics" element={<Protected><AnalyticsPage /></Protected>} />
          <Route path="/freshdesk-import" element={<Protected><FreshdeskImportPage /></Protected>} />
          <Route path="/admin/*" element={<Protected><AdminPanel /></Protected>} />
        </Routes>
      </main>
    </div>
  );
}

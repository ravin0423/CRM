import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";

import AdminPanel from "./pages/AdminPanel";
import AnalyticsPage from "./pages/AnalyticsPage";
import ChatbotPage from "./pages/ChatbotPage";
import ContactsPage from "./pages/ContactsPage";
import FreshdeskImportPage from "./pages/FreshdeskImportPage";
import KnowledgePage from "./pages/KnowledgePage";
import LoginPage from "./pages/LoginPage";
import TicketsPage from "./pages/TicketsPage";
import { useAuthStore } from "./store/auth";

function Protected({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  if (!token) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex">
      <nav className="w-56 bg-slate-900 text-slate-100 p-4 space-y-2">
        <div className="text-lg font-bold mb-4">Support CRM</div>
        <Link className="block" to="/tickets">
          Tickets
        </Link>
        <Link className="block" to="/contacts">
          Contacts
        </Link>
        <Link className="block" to="/knowledge">
          Knowledge Base
        </Link>
        <Link className="block" to="/chatbot">
          Chatbot
        </Link>
        <Link className="block" to="/analytics">
          Analytics
        </Link>
        <Link className="block" to="/admin">
          Admin Panel
        </Link>
        <div className="pt-6 text-xs text-slate-400">
          {user?.email ?? "—"}
          <button onClick={clear} className="block mt-2 underline">
            Sign out
          </button>
        </div>
      </nav>
      <main className="flex-1 p-6 bg-slate-50">
        <Routes>
          <Route path="/" element={<Navigate to="/tickets" replace />} />
          <Route path="/login" element={<Navigate to="/tickets" replace />} />
          <Route
            path="/tickets"
            element={
              <Protected>
                <TicketsPage />
              </Protected>
            }
          />
          <Route
            path="/contacts"
            element={
              <Protected>
                <ContactsPage />
              </Protected>
            }
          />
          <Route
            path="/knowledge"
            element={
              <Protected>
                <KnowledgePage />
              </Protected>
            }
          />
          <Route
            path="/chatbot"
            element={
              <Protected>
                <ChatbotPage />
              </Protected>
            }
          />
          <Route
            path="/analytics"
            element={
              <Protected>
                <AnalyticsPage />
              </Protected>
            }
          />
          <Route
            path="/freshdesk-import"
            element={
              <Protected>
                <FreshdeskImportPage />
              </Protected>
            }
          />
          <Route
            path="/admin/*"
            element={
              <Protected>
                <AdminPanel />
              </Protected>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

import { Routes, Route, Link, Navigate } from "react-router-dom";

import AdminPanel from "./pages/AdminPanel";
import TicketsPage from "./pages/TicketsPage";
import ContactsPage from "./pages/ContactsPage";
import KnowledgePage from "./pages/KnowledgePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ChatbotPage from "./pages/ChatbotPage";
import LoginPage from "./pages/LoginPage";

export default function App() {
  return (
    <div className="min-h-screen flex">
      <nav className="w-56 bg-slate-900 text-slate-100 p-4 space-y-2">
        <div className="text-lg font-bold mb-4">Support CRM</div>
        <Link className="block" to="/tickets">Tickets</Link>
        <Link className="block" to="/contacts">Contacts</Link>
        <Link className="block" to="/knowledge">Knowledge Base</Link>
        <Link className="block" to="/chatbot">Chatbot</Link>
        <Link className="block" to="/analytics">Analytics</Link>
        <Link className="block" to="/admin">Admin Panel</Link>
      </nav>
      <main className="flex-1 p-6 bg-slate-50">
        <Routes>
          <Route path="/" element={<Navigate to="/tickets" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/admin/*" element={<AdminPanel />} />
        </Routes>
      </main>
    </div>
  );
}

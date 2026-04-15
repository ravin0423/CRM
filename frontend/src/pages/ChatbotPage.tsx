import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, AlertTriangle, RotateCcw } from "lucide-react";

import { api } from "../lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { id: number; title: string }[];
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await api().post("/chatbot/message", {
        message: userMsg,
        conversation_id: conversationId,
      });
      const data = res.data as any;
      setConversationId(data.conversation_id);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          sources: data.sources,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err?.response?.data?.detail ?? err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const escalate = async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const res = await api().post("/chatbot/escalate", { conversation_id: conversationId });
      const data = res.data as any;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `A support ticket has been created (ID: ${data.ticket?.id ?? "?"}). A human agent will follow up.`,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Escalation failed: ${err?.response?.data?.detail ?? err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 7rem)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "0.75rem",
              background: "rgba(59, 130, 246, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MessageCircle size={20} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Support Chatbot
            </h1>
            {conversationId && (
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                Conversation #{conversationId}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {conversationId && (
            <button
              onClick={escalate}
              disabled={loading}
              className="btn btn-secondary"
              style={{ borderColor: "var(--warning)", color: "var(--warning)" }}
            >
              <AlertTriangle size={14} />
              Escalate to Agent
            </button>
          )}
          <button onClick={newChat} className="btn btn-secondary">
            <RotateCcw size={14} />
            New Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="glass-card"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: "1rem",
              padding: "3rem 0",
            }}
          >
            <div
              style={{
                width: "4rem",
                height: "4rem",
                borderRadius: "50%",
                background: "rgba(59, 130, 246, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageCircle size={28} style={{ color: "var(--accent)" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", fontWeight: 500, margin: 0 }}>
                How can I help you today?
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", marginTop: "0.375rem" }}>
                Ask a question and the chatbot will search the knowledge base for answers.
              </p>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "70%",
                borderRadius: m.role === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                lineHeight: 1.6,
                ...(m.role === "user"
                  ? {
                      background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                      color: "#ffffff",
                    }
                  : {
                      background: "var(--bg-elevated)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-color)",
                    }),
              }}
            >
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{m.content}</p>
              {m.sources && m.sources.length > 0 && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.75rem",
                    opacity: 0.7,
                    borderTop: m.role === "user" ? "1px solid rgba(255,255,255,0.2)" : "1px solid var(--border-color)",
                    paddingTop: "0.375rem",
                  }}
                >
                  Sources: {m.sources.map((s) => s.title).join(", ")}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-color)",
                borderRadius: "1rem 1rem 1rem 0.25rem",
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              Thinking
              <span style={{ display: "inline-flex", gap: "2px", marginLeft: "2px" }}>
                <span
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "var(--text-muted)",
                    animation: "pulse 1.4s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "var(--text-muted)",
                    animation: "pulse 1.4s ease-in-out 0.2s infinite",
                  }}
                />
                <span
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "var(--text-muted)",
                    animation: "pulse 1.4s ease-in-out 0.4s infinite",
                  }}
                />
              </span>
              <style>{`
                @keyframes pulse {
                  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                  40% { opacity: 1; transform: scale(1.2); }
                }
              `}</style>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type your question..."
          className="input"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="btn btn-primary"
          style={{ flexShrink: 0 }}
        >
          <Send size={16} />
          Send
        </button>
      </div>
    </div>
  );
}

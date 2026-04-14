import { useState, useRef, useEffect } from "react";

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
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-semibold">Support Chatbot</h1>
        <div className="flex gap-2">
          {conversationId && (
            <button
              onClick={escalate}
              disabled={loading}
              className="px-3 py-1 border border-amber-500 text-amber-600 rounded text-sm hover:bg-amber-50"
            >
              Escalate to Agent
            </button>
          )}
          <button onClick={newChat} className="px-3 py-1 border rounded text-sm hover:bg-slate-50">
            New Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded shadow p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-slate-400 text-sm text-center mt-8">
            Ask a question and the chatbot will search the knowledge base for answers.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-1 text-xs opacity-70">
                  Sources: {m.sources.map((s) => s.title).join(", ")}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-lg px-3 py-2 text-sm text-slate-500">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type your question..."
          className="flex-1 border rounded px-3 py-2 text-sm"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

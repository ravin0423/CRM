import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, BookOpen, Edit2, Trash2, Eye, EyeOff } from "lucide-react";

import { api } from "../lib/api";

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published";
  views_count: number;
}

export default function KnowledgePage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["knowledge", statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status_filter=${statusFilter}` : "";
      return (await api().get(`/knowledge${params}`)).data;
    },
  });

  const { data: searchResults } = useQuery<Article[]>({
    queryKey: ["knowledge-search", searchQuery],
    queryFn: async () => (await api().get(`/knowledge/search?q=${encodeURIComponent(searchQuery)}`)).data,
    enabled: searchQuery.length >= 2,
  });

  const createMut = useMutation({
    mutationFn: async (data: Omit<Article, "id" | "views_count">) =>
      (await api().post("/knowledge", data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["knowledge"] });
      setShowCreate(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Article> & { id: number }) =>
      (await api().patch(`/knowledge/${id}`, patch)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["knowledge"] });
      setEditingId(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => api().delete(`/knowledge/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["knowledge"] }),
  });

  const displayList = searchQuery.length >= 2 && searchResults ? searchResults : articles;

  if (isLoading)
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading articles...</div>
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
            <BookOpen size={20} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Knowledge Base
            </h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
              {articles.length} article{articles.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New Article
        </button>
      </div>

      {/* Search & Filter */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="input"
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input"
          style={{ width: "auto", minWidth: "10rem" }}
        >
          <option value="">All status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Create Form */}
      {showCreate && (
        <ArticleForm
          onSubmit={(d) => createMut.mutate(d)}
          onCancel={() => setShowCreate(false)}
          isPending={createMut.isPending}
        />
      )}

      {/* Article List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {displayList.map((a) =>
          editingId === a.id ? (
            <ArticleForm
              key={a.id}
              initial={a}
              onSubmit={(d) => updateMut.mutate({ id: a.id, ...d })}
              onCancel={() => setEditingId(null)}
              isPending={updateMut.isPending}
            />
          ) : (
            <div
              key={a.id}
              className="glass-card"
              style={{
                padding: "1.25rem",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                cursor: "default",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>
                    {a.title}
                  </h3>
                  <span className={`badge ${a.status === "published" ? "badge-green" : "badge-amber"}`}>
                    {a.status}
                  </span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  /{a.slug} &middot; {a.views_count ?? 0} views
                </p>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-secondary)",
                    marginTop: "0.5rem",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.5,
                  }}
                >
                  {a.content}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.25rem", marginLeft: "1rem", flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(a.id)} title="Edit">
                  <Edit2 size={14} />
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() =>
                    updateMut.mutate({ id: a.id, status: a.status === "draft" ? "published" : "draft" })
                  }
                  title={a.status === "draft" ? "Publish" : "Unpublish"}
                >
                  {a.status === "draft" ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => deleteMut.mutate(a.id)}
                  title="Delete"
                  style={{ color: "var(--danger)" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ),
        )}
        {displayList.length === 0 && (
          <div
            className="glass-card"
            style={{
              padding: "3rem",
              textAlign: "center",
            }}
          >
            <BookOpen size={40} style={{ color: "var(--text-muted)", margin: "0 auto 0.75rem" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No articles found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
}: {
  initial?: Partial<Article>;
  onSubmit: (d: { title: string; slug: string; content: string; status: "draft" | "published" }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [status, setStatus] = useState<"draft" | "published">(initial?.status ?? "draft");

  const autoSlug = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  return (
    <div className="glass-card" style={{ padding: "1.5rem" }}>
      <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>
        {initial ? "Edit Article" : "New Article"}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <label style={{ display: "block" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
            Title
          </span>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!initial) setSlug(autoSlug(e.target.value));
            }}
            className="input"
          />
        </label>
        <label style={{ display: "block" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
            Slug
          </span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="input"
            style={{ fontFamily: "monospace", fontSize: "0.8125rem" }}
          />
        </label>
      </div>
      <label style={{ display: "block", marginTop: "1rem" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
          Content
        </span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="input"
          style={{ resize: "vertical" }}
        />
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "draft" | "published")}
          className="input"
          style={{ width: "auto", minWidth: "8rem" }}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <button
          disabled={isPending || !title || !slug || !content}
          onClick={() => onSubmit({ title, slug, content, status })}
          className="btn btn-primary"
        >
          {isPending ? "Saving..." : initial ? "Update" : "Create"}
        </button>
        <button onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}

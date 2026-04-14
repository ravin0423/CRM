import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Knowledge Base</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          + New Article
        </button>
      </div>

      <div className="flex gap-3">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search articles..."
          className="flex-1 border rounded px-3 py-1.5 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm"
        >
          <option value="">All status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {showCreate && (
        <ArticleForm
          onSubmit={(d) => createMut.mutate(d)}
          onCancel={() => setShowCreate(false)}
          isPending={createMut.isPending}
        />
      )}

      <div className="space-y-2">
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
            <div key={a.id} className="bg-white rounded shadow p-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{a.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      a.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  /{a.slug} &middot; {a.views_count ?? 0} views
                </p>
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{a.content}</p>
              </div>
              <div className="flex gap-2 ml-4 shrink-0">
                <button onClick={() => setEditingId(a.id)} className="text-blue-600 text-xs hover:underline">
                  Edit
                </button>
                <button
                  onClick={() => updateMut.mutate({ id: a.id, status: a.status === "draft" ? "published" : "draft" })}
                  className="text-amber-600 text-xs hover:underline"
                >
                  {a.status === "draft" ? "Publish" : "Unpublish"}
                </button>
                <button onClick={() => deleteMut.mutate(a.id)} className="text-red-600 text-xs hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ),
        )}
        {displayList.length === 0 && (
          <p className="text-slate-500 text-sm">No articles found.</p>
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
    <div className="bg-white rounded shadow p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          Title
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!initial) setSlug(autoSlug(e.target.value));
            }}
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </label>
        <label className="block text-sm">
          Slug
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1 font-mono text-xs"
          />
        </label>
      </div>
      <label className="block text-sm">
        Content
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="mt-1 block w-full border rounded px-2 py-1 text-sm"
        />
      </label>
      <div className="flex items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "draft" | "published")}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <button
          disabled={isPending || !title || !slug || !content}
          onClick={() => onSubmit({ title, slug, content, status })}
          className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
        >
          {isPending ? "Saving..." : initial ? "Update" : "Create"}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 border rounded text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

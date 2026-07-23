// REST API client for Devasophy PKM
const API_BASE = "/api";

async function fetchJSON(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  auth: {
    me: () => fetchJSON("/auth/me"),
    login: (email: string, password: string) => fetchJSON("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    register: (email: string, password: string, name: string) => fetchJSON("/auth/register", { method: "POST", body: JSON.stringify({ email, password, name }) }),
    logout: () => fetchJSON("/auth/logout", { method: "POST" }),
  },

  // Dashboard
  dashboard: {
    stats: () => fetchJSON("/dashboard/stats"),
    recent: (limit?: number) => fetchJSON(`/dashboard/recent${limit ? `?limit=${limit}` : ""}`),
  },

  // Notes (Commonplace)
  notes: {
    list: (params?: { search?: string; dikw?: string; type?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>);
      return fetchJSON(`/notes?${qs}`);
    },
    get: (id: number) => fetchJSON(`/notes/${id}`),
    create: (data: any) => fetchJSON("/notes", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchJSON(`/notes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => fetchJSON(`/notes/${id}`, { method: "DELETE" }),
  },

  // Quotations
  quotations: {
    list: (params?: { search?: string; dikw?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>);
      return fetchJSON(`/quotations?${qs}`);
    },
    create: (data: any) => fetchJSON("/quotations", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchJSON(`/quotations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => fetchJSON(`/quotations/${id}`, { method: "DELETE" }),
  },

  // Vocabulary
  vocabulary: {
    list: (params?: { search?: string; letter?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>);
      return fetchJSON(`/vocabulary?${qs}`);
    },
    create: (data: any) => fetchJSON("/vocabulary", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchJSON(`/vocabulary/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => fetchJSON(`/vocabulary/${id}`, { method: "DELETE" }),
  },

  // Books
  books: {
    list: (params?: { search?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>);
      return fetchJSON(`/books?${qs}`);
    },
    create: (data: any) => fetchJSON("/books", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchJSON(`/books/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => fetchJSON(`/books/${id}`, { method: "DELETE" }),
  },

  // Research
  research: {
    list: (params?: { search?: string; status?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>);
      return fetchJSON(`/research?${qs}`);
    },
    create: (data: any) => fetchJSON("/research", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchJSON(`/research/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => fetchJSON(`/research/${id}`, { method: "DELETE" }),
  },

  // Ideas
  ideas: {
    list: () => fetchJSON("/ideas"),
    create: (data: any) => fetchJSON("/ideas", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchJSON(`/ideas/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => fetchJSON(`/ideas/${id}`, { method: "DELETE" }),
  },

  // Plans
  plans: {
    list: () => fetchJSON("/plans"),
    create: (data: any) => fetchJSON("/plans", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchJSON(`/plans/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => fetchJSON(`/plans/${id}`, { method: "DELETE" }),
  },

  // Themes
  themes: {
    list: () => fetchJSON("/themes"),
  },

  // Search
  search: (q: string) => fetchJSON(`/search?q=${encodeURIComponent(q)}`),

  // Seed
  seed: () => fetchJSON("/seed", { method: "POST", body: JSON.stringify({}) }),

  // Export
  export: {
    json: () => window.open(`${API_BASE}/export/json`, "_blank"),
    markdown: () => window.open(`${API_BASE}/export/markdown`, "_blank"),
  },
};

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { api } from "@/lib/api";
import { Bold, Italic, Heading1, Heading2, Quote, Save, Plus, X, Trash2 } from "lucide-react";

const dikwColors: Record<string, string> = { data: "#3B82F6", information: "#10B981", knowledge: "#C8A84B", wisdom: "#7B5EA7" };

export default function CommonplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", dikwTier: "information", entryType: "note", tags: [] as string[] });

  const load = () => api.notes.list().then(setItems).catch(console.error);
  useEffect(() => { load(); }, []);
  useEffect(() => { if (searchParams.get("new") === "true") { setSelectedId(null); setIsEditing(true); setForm({ title: "", content: "", dikwTier: "information", entryType: "note", tags: [] }); setSearchParams({}); } }, [searchParams, setSearchParams]);

  const save = async () => {
    const data = { ...form, wordCount: form.content.split(/\s+/).filter(Boolean).length, charCount: form.content.length };
    if (selectedId) await api.notes.update(selectedId, data);
    else await api.notes.create(data);
    load(); setIsEditing(false);
  };

  const del = async (id: number) => { if (confirm("Delete?")) { await api.notes.delete(id); setSelectedId(null); load(); } };

  const selected = items.find((i) => i.id === selectedId);

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="w-[320px] flex-shrink-0 border-r flex flex-col" style={{ borderColor: "var(--line)", background: "white" }}>
        <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: "var(--line)" }}>
          <h2 className="text-[10px] font-bold uppercase tracking-[1.5px] font-sans" style={{ color: "var(--ink-light)" }}>Entries</h2>
          <button onClick={() => { setSelectedId(null); setIsEditing(true); setForm({ title: "", content: "", dikwTier: "information", entryType: "note", tags: [] }); }} className="btn-primary h-7 text-[10px]"><Plus className="w-3 h-3" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.map((item) => (
            <button key={item.id} onClick={() => { setSelectedId(item.id); setIsEditing(false); }} className={`w-full text-left px-3 py-2.5 border-b transition-colors ${selectedId === item.id ? "bg-[var(--cream-light)]" : "hover:bg-[var(--cream-light)]"}`} style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dikwColors[item.dikwTier ?? "information"] ?? "#999" }} />
                <span className="text-[11px] font-semibold truncate flex-1 font-sans" style={{ color: "var(--navy)" }}>{item.title ?? "Untitled"}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] uppercase tracking-wider font-bold font-sans" style={{ color: "var(--muted)" }}>{item.entryType}</span>
                <span className="text-[8px] font-sans" style={{ color: "var(--muted)" }}>{item.wordCount ?? 0}w</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        {isEditing ? (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold" style={{ color: "var(--navy)" }}>{selectedId ? "Edit Entry" : "New Entry"}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsEditing(false)} className="h-8 px-3 rounded-lg border text-[11px] font-sans transition-colors hover:bg-[var(--cream-dark)]" style={{ borderColor: "var(--line)" }}><X className="w-3.5 h-3.5" /></button>
                <button onClick={save} className="btn-primary h-8 text-[11px]"><Save className="w-3.5 h-3.5" /> Save</button>
              </div>
            </div>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title..." className="w-full h-10 px-3 rounded-lg border text-[13px] font-sans mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/20" style={{ borderColor: "var(--line)" }} />
            <div className="flex items-center gap-2 mb-3">
              <select value={form.dikwTier} onChange={(e) => setForm({ ...form, dikwTier: e.target.value })} className="h-8 px-2 rounded-lg border text-[10px] font-sans" style={{ borderColor: "var(--line)" }}>
                {Object.keys(dikwColors).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={form.entryType} onChange={(e) => setForm({ ...form, entryType: e.target.value })} className="h-8 px-2 rounded-lg border text-[10px] font-sans" style={{ borderColor: "var(--line)" }}>
                {["note", "quote", "bookmark", "idea", "book_ref", "article", "glossary_term", "list"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write your thoughts..." className="w-full h-[400px] p-4 rounded-lg border text-[13px] font-sans leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/20" style={{ borderColor: "var(--line)" }} />
          </div>
        ) : selected ? (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: dikwColors[selected.dikwTier ?? "information"] ?? "#999" }} />
                <span className="text-[9px] uppercase tracking-wider font-bold font-sans" style={{ color: "var(--muted)" }}>{selected.dikwTier}</span>
                <span className="text-[9px] uppercase tracking-wider font-bold font-sans" style={{ color: "var(--muted)" }}>{selected.entryType}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setIsEditing(true); setForm({ title: selected.title ?? "", content: selected.content ?? "", dikwTier: selected.dikwTier ?? "information", entryType: selected.entryType ?? "note", tags: selected.tags ?? [] }); }} className="h-8 px-3 rounded-lg border text-[11px] font-sans transition-colors hover:bg-[var(--cream-dark)]" style={{ borderColor: "var(--line)" }}>Edit</button>
                <button onClick={() => del(selected.id)} className="h-8 px-3 rounded-lg border text-[11px] font-sans transition-colors hover:bg-[var(--coral-light)]" style={{ borderColor: "var(--line)", color: "var(--coral)" }}><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <h1 className="font-display text-2xl font-semibold mb-4" style={{ color: "var(--navy)" }}>{selected.title ?? "Untitled"}</h1>
            <div className="prose prose-sm max-w-none font-sans text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--ink-light)" }}>{selected.content}</div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-[12px] font-sans mb-2" style={{ color: "var(--muted)" }}>Select an entry or create a new one</p>
              <button onClick={() => { setIsEditing(true); setForm({ title: "", content: "", dikwTier: "information", entryType: "note", tags: [] }); }} className="btn-primary text-[11px]"><Plus className="w-3.5 h-3.5" /> New Entry</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

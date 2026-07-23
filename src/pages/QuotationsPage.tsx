import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Plus, Save, Trash2, Search } from "lucide-react";

const dikwColors: Record<string, string> = { data: "#3B82F6", information: "#10B981", knowledge: "#C8A84B", wisdom: "#7B5EA7" };

export default function QuotationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ quoteText: "", author: "", sourceWork: "", dikwTier: "wisdom", tags: [] as string[] });
  const [search, setSearch] = useState("");

  const load = () => api.quotations.list(search ? { search } : {}).then(setItems).catch(console.error);
  useEffect(() => { load(); }, [search]);

  const save = async () => {
    await api.quotations.create(form);
    setShowForm(false);
    setForm({ quoteText: "", author: "", sourceWork: "", dikwTier: "wisdom", tags: [] });
    load();
  };

  const del = async (id: number) => { if (confirm("Delete this quotation?")) { await api.quotations.delete(id); load(); } };

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold mb-1" style={{ color: "var(--navy)" }}>Quotations</h1>
          <p className="text-[11px] font-sans" style={{ color: "var(--ink-muted)" }}>Collected wisdom from the canon.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--muted)" }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="h-8 pl-8 pr-3 rounded-lg border text-[11px] font-sans w-48" style={{ borderColor: "var(--line)" }} />
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary h-8 text-[11px]"><Plus className="w-3.5 h-3.5" /> Add Quote</button>
        </div>
      </div>

      {showForm && (
        <div className="panel-card p-4 mb-6 max-w-xl">
          <h3 className="text-[10px] font-bold uppercase tracking-[1.5px] mb-3 font-sans" style={{ color: "var(--ink-light)" }}>New Quotation</h3>
          <textarea value={form.quoteText} onChange={(e) => setForm({ ...form, quoteText: e.target.value })} placeholder="The quote..." className="w-full h-20 p-3 rounded-lg border text-[12px] font-sans mb-2 resize-none" style={{ borderColor: "var(--line)" }} />
          <div className="flex gap-2 mb-2">
            <input type="text" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author" className="flex-1 h-8 px-3 rounded-lg border text-[11px] font-sans" style={{ borderColor: "var(--line)" }} />
            <input type="text" value={form.sourceWork} onChange={(e) => setForm({ ...form, sourceWork: e.target.value })} placeholder="Source" className="flex-1 h-8 px-3 rounded-lg border text-[11px] font-sans" style={{ borderColor: "var(--line)" }} />
          </div>
          <div className="flex gap-2">
            <select value={form.dikwTier} onChange={(e) => setForm({ ...form, dikwTier: e.target.value })} className="h-8 px-2 rounded-lg border text-[10px] font-sans" style={{ borderColor: "var(--line)" }}>
              {Object.keys(dikwColors).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={save} className="btn-primary h-8 text-[11px]"><Save className="w-3.5 h-3.5" /> Save</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {items.map((q) => (
          <div key={q.id} className="panel-card p-5">
            <div className="flex items-start justify-between mb-2">
              <span className="dikw-chip text-[8px]" style={{ background: `${dikwColors[q.dikwTier ?? "wisdom"]}18`, color: dikwColors[q.dikwTier ?? "wisdom"] }}>{q.dikwTier}</span>
              <button onClick={() => del(q.id)} className="transition-colors" style={{ color: "var(--muted)" }}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <blockquote className="font-display text-lg italic leading-relaxed mb-2" style={{ color: "var(--navy)" }}>&ldquo;{q.quoteText}&rdquo;</blockquote>
            <div className="text-[11px] font-sans" style={{ color: "var(--ink-light)" }}>
              &mdash; {q.author}{q.sourceWork ? `, ${q.sourceWork}` : ""}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-center py-12 text-[12px] font-sans" style={{ color: "var(--muted)" }}>No quotations yet. Click &quot;Add Quote&quot; to begin.</div>}
      </div>
    </div>
  );
}

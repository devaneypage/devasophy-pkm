import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Book, Plus, Search, Save, Trash2 } from "lucide-react";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function VocabularyPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [letter, setLetter] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ headword: "", pronunciation: "", partOfSpeech: "", definitions: [{ num: 1, text: "" }], etymology: "" });

  const load = () => {
    const params: any = {};
    if (search) params.search = search;
    if (letter) params.letter = letter;
    api.vocabulary.list(params).then(setItems).catch(console.error);
  };
  useEffect(() => { load(); }, [letter, search]);

  const save = async () => {
    await api.vocabulary.create({ ...form, definitions: form.definitions.filter((d) => d.text.trim()) });
    setShowForm(false);
    setForm({ headword: "", pronunciation: "", partOfSpeech: "", definitions: [{ num: 1, text: "" }], etymology: "" });
    load();
  };

  const del = async (id: number) => { if (confirm("Delete?")) { await api.vocabulary.delete(id); setSelected(null); load(); } };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-[260px] flex-shrink-0 border-r flex flex-col" style={{ borderColor: "var(--line)", background: "white" }}>
        <div className="p-3 border-b" style={{ borderColor: "var(--line)" }}>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--muted)" }} />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setLetter(""); }} placeholder="Search words..." className="w-full h-8 pl-8 pr-3 rounded-lg border text-[11px] font-sans" style={{ borderColor: "var(--line)" }} />
          </div>
          <div className="flex flex-wrap gap-0.5">
            {ALPHABET.map((l) => (
              <button key={l} onClick={() => { setLetter(l === letter ? "" : l); setSearch(""); }} className={`w-5 h-5 rounded text-[9px] font-bold font-sans transition-colors ${letter === l ? "text-white" : "hover:bg-[var(--cream-dark)]"}`} style={letter === l ? { background: "var(--navy)" } : { color: "var(--ink-light)" }}>{l}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.map((item) => (
            <button key={item.id} onClick={() => setSelected(item)} className={`w-full text-left px-3 py-2 border-b transition-colors ${selected?.id === item.id ? "bg-[var(--cream-light)]" : "hover:bg-[var(--cream-light)]"}`} style={{ borderColor: "var(--line)" }}>
              <div className="text-[12px] font-semibold font-sans" style={{ color: "var(--navy)" }}>{item.headword}</div>
              <div className="text-[8px] font-sans" style={{ color: "var(--muted)" }}>{item.partOfSpeech}{item.pronunciation ? ` · ${item.pronunciation}` : ""}</div>
            </button>
          ))}
        </div>
        <div className="p-2 border-t" style={{ borderColor: "var(--line)" }}>
          <button onClick={() => setShowForm(true)} className="btn-primary w-full h-8 text-[10px]"><Plus className="w-3 h-3" /> Add Word</button>
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {showForm ? (
          <div className="max-w-lg">
            <h2 className="font-display text-xl font-semibold mb-4" style={{ color: "var(--navy)" }}>New Lexicon Entry</h2>
            <div className="space-y-3">
              <input type="text" value={form.headword} onChange={(e) => setForm({ ...form, headword: e.target.value })} placeholder="Headword" className="w-full h-9 px-3 rounded-lg border text-[12px] font-sans" style={{ borderColor: "var(--line)" }} />
              <div className="flex gap-2">
                <input type="text" value={form.pronunciation} onChange={(e) => setForm({ ...form, pronunciation: e.target.value })} placeholder="Pronunciation" className="flex-1 h-9 px-3 rounded-lg border text-[12px] font-sans" style={{ borderColor: "var(--line)" }} />
                <input type="text" value={form.partOfSpeech} onChange={(e) => setForm({ ...form, partOfSpeech: e.target.value })} placeholder="Part of speech" className="flex-1 h-9 px-3 rounded-lg border text-[12px] font-sans" style={{ borderColor: "var(--line)" }} />
              </div>
              <textarea value={form.definitions[0].text} onChange={(e) => setForm({ ...form, definitions: [{ num: 1, text: e.target.value }] })} placeholder="Definition" className="w-full h-20 p-3 rounded-lg border text-[12px] font-sans resize-none" style={{ borderColor: "var(--line)" }} />
              <textarea value={form.etymology} onChange={(e) => setForm({ ...form, etymology: e.target.value })} placeholder="Etymology (optional)" className="w-full h-16 p-3 rounded-lg border text-[12px] font-sans resize-none" style={{ borderColor: "var(--line)" }} />
              <button onClick={save} className="btn-primary h-8 text-[11px]"><Save className="w-3.5 h-3.5" /> Save Entry</button>
            </div>
          </div>
        ) : selected ? (
          <div className="max-w-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="font-display text-3xl font-semibold mb-1" style={{ color: "var(--navy)" }}>{selected.headword}</h1>
                <div className="text-[11px] font-sans" style={{ color: "var(--ink-muted)" }}>
                  {selected.pronunciation && <span className="italic mr-2">{selected.pronunciation}</span>}
                  {selected.partOfSpeech && <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "var(--muted)" }}>{selected.partOfSpeech}</span>}
                </div>
              </div>
              <button onClick={() => del(selected.id)} className="transition-colors" style={{ color: "var(--muted)" }}><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              {(selected.definitions as { num: number; text: string }[] | null)?.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-[11px] font-bold font-sans flex-shrink-0" style={{ color: "var(--amber)" }}>{d.num}.</span>
                  <span className="text-[12px] font-sans leading-relaxed" style={{ color: "var(--ink-light)" }}>{d.text}</span>
                </div>
              ))}
              {selected.etymology && (
                <div className="mt-4 p-3 rounded-lg" style={{ background: "var(--cream-light)" }}>
                  <div className="text-[8px] font-bold uppercase tracking-[1.5px] mb-1 font-sans" style={{ color: "var(--muted)" }}>Etymology</div>
                  <div className="text-[11px] italic font-sans" style={{ color: "var(--ink-light)" }}>{selected.etymology}</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Book className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--line)" }} />
              <p className="text-[12px] font-sans" style={{ color: "var(--muted)" }}>Select a word or add a new entry</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

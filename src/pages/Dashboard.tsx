import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { api } from "@/lib/api";
import {
  StickyNote, Quote, Type, BookOpen, FileText, Lightbulb,
  Plus, Download,
} from "lucide-react";

const modules = [
  { num: "01", label: "THE CORE", subtitle: "Foundations", desc: "Ontological roots and first principles.", color: "#E05C4B", path: "/notes" },
  { num: "02", label: "ATELIER", subtitle: "Practice", desc: "Active workspace for creative synthesis.", color: "#C8A84B", path: "/commonplace" },
  { num: "03", label: "ARCHIVES", subtitle: "Memory", desc: "Durable storage for processed knowledge.", color: "#4CAF50", path: "/library" },
  { num: "04", label: "NETWORK", subtitle: "Relations", desc: "Mapping relationships and emergence.", color: "#2D9CDB", path: "/atlas" },
  { num: "05", label: "DRAFTS", subtitle: "Flux", desc: "Ephemeral thoughts and initial captures.", color: "#7B5EA7", path: "/ideas" },
  { num: "06", label: "CANON", subtitle: "Sources", desc: "Curated external resources and references.", color: "#E05C4B", path: "/books" },
];

const typeConfig: Record<string, { color: string; icon: any }> = {
  note: { color: "#1B2A4A", icon: StickyNote },
  quote: { color: "#C8A84B", icon: Quote },
  book_ref: { color: "#4CAF50", icon: BookOpen },
  article: { color: "#E05C4B", icon: FileText },
  glossary_term: { color: "#7B5EA7", icon: Type },
  list: { color: "#2D9CDB", icon: FileText },
  idea: { color: "#F5A400", icon: Lightbulb },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    api.dashboard.stats().then(setStats).catch(console.error);
    api.dashboard.recent(5).then(setRecent).catch(console.error);
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1B2A4A 0%, #2A3F6B 50%, #1B2A4A 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="relative px-8 py-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ background: "#4CAF50" }} />
            <span className="text-[10px] font-medium tracking-wider uppercase" style={{ color: "#8AA4C8" }}>Status Operational &middot; July 16, 2026</span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-white mb-2 tracking-tight">The Atelier</h1>
          <p className="text-sm mb-6" style={{ color: "#8AA4C8" }}>Welcome back to your knowledge territory.</p>
          <p className="text-xs max-w-xl leading-relaxed mb-6" style={{ color: "#6B8AAF" }}>
            Your architecture is evolving. Today's focus is structural integrity and aesthetic coherence across the Personal Knowledge Library.
          </p>
          <div className="flex items-center gap-4 text-[10px]" style={{ color: "#8AA4C8" }}>
            <span>12 active drafts</span>
            <span>&middot;</span>
            <span>4 pending reviews</span>
            <span>&middot;</span>
            <span>842 nodes linked</span>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Artifacts", value: stats?.counts?.total ?? 0, change: "+34 this week", icon: "A", color: "#E05C4B" },
            { label: "Insights", value: stats?.counts?.themes ?? 0, change: "+5 synthesized", icon: "I", color: "#C8A84B" },
            { label: "Nodes", value: 0, change: "+212 linked", icon: "N", color: "#4CAF50" },
            { label: "Sources", value: stats?.counts?.quotations ?? 0, change: "+9 curated", icon: "S", color: "#2D9CDB" },
          ].map((s) => (
            <div key={s.label} className="panel-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ background: s.color }}>{s.icon}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>{s.label}</span>
              </div>
              <div className="font-display text-2xl font-semibold" style={{ color: "var(--navy)" }}>{s.value.toLocaleString()}</div>
              <div className="text-[9px] mt-1" style={{ color: "var(--ink-muted)" }}>{s.change}</div>
            </div>
          ))}
        </div>

        {/* Knowledge Architecture */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-bold uppercase tracking-[1.5px] font-sans" style={{ color: "var(--ink-light)" }}>Knowledge Architecture</h2>
            <span className="text-[9px] font-sans" style={{ color: "var(--ink-muted)" }}>The structural regions of your intellectual territory.</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {modules.map((m) => (
              <button key={m.num} onClick={() => navigate(m.path)} className="panel-card p-4 text-left hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ background: m.color }}>{m.num}</div>
                  <div>
                    <div className="text-[11px] font-semibold font-sans" style={{ color: "var(--navy)" }}>{m.label}</div>
                    <div className="text-[9px] font-sans" style={{ color: "var(--ink-muted)" }}>{m.subtitle}</div>
                  </div>
                </div>
                <p className="text-[10px] leading-relaxed font-sans" style={{ color: "var(--ink-light)" }}>{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Classification Key */}
        <div className="panel-card p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[1.5px] mb-3 font-sans" style={{ color: "var(--ink-light)" }}>Classification Key</h3>
          <div className="flex items-center gap-4 flex-wrap">
            {Object.entries(typeConfig).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: cfg.color }} />
                <span className="text-[9px] font-sans capitalize" style={{ color: "var(--ink-light)" }}>{type.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Work */}
        <div className="grid grid-cols-2 gap-4">
          <div className="panel-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[1.5px] font-sans" style={{ color: "var(--ink-light)" }}>Recent Work</h3>
              <button onClick={() => navigate("/library")} className="text-[9px] font-sans font-medium hover:underline" style={{ color: "var(--coral)" }}>View all</button>
            </div>
            <div className="space-y-0">
              {recent.length > 0 ? recent.map((r: any, i: number) => (
                <div key={`${r.type}-${r.id}-${i}`} className="flex items-center gap-3 py-2.5 border-b last:border-0 cursor-pointer hover:bg-[var(--cream-light)] -mx-2 px-2 rounded transition-colors" style={{ borderColor: "var(--line)" }} onClick={() => navigate(r.type === "quotation" ? "/quotations" : "/notes")}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${typeConfig[r.entryType ?? "note"]?.color ?? "#999"}12` }}>
                    <StickyNote className="w-3.5 h-3.5" style={{ color: typeConfig[r.entryType ?? "note"]?.color ?? "#999" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold truncate font-sans" style={{ color: "var(--navy)" }}>{r.title?.slice(0, 50) ?? "Untitled"}</div>
                    <div className="text-[9px] uppercase tracking-wider font-bold font-sans" style={{ color: typeConfig[r.entryType ?? "note"]?.color ?? "var(--muted)" }}>{r.entryType ?? "note"}</div>
                  </div>
                  <span className="text-[9px] flex-shrink-0 font-sans" style={{ color: "var(--ink-muted)" }}>{new Date(r.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
              )) : (
                <div className="text-center py-6 text-[11px] font-sans" style={{ color: "var(--ink-muted)" }}>No recent work yet</div>
              )}
            </div>
          </div>

          <div className="panel-card p-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[1.5px] mb-3 font-sans" style={{ color: "var(--ink-light)" }}>Quick Synthesis</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Capture", desc: "New note", path: "/notes", color: "#E05C4B" },
                { label: "Refine", desc: "Edit latest", path: "/commonplace", color: "#C8A84B" },
                { label: "Map", desc: "View atlas", path: "/atlas", color: "#4CAF50" },
                { label: "Export", desc: "Download", path: "/exports", color: "#2D9CDB" },
                { label: "Review", desc: "Quotations", path: "/quotations", color: "#7B5EA7" },
                { label: "Search", desc: "Find anything", path: "/search", color: "#1B2A4A" },
              ].map((action) => (
                <button key={action.label} onClick={() => navigate(action.path)} className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-[var(--cream-dark)] transition-colors text-left">
                  <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[8px] font-bold" style={{ background: action.color }}>{action.label[0]}</span>
                  <div>
                    <div className="text-[10px] font-semibold font-sans" style={{ color: "var(--navy)" }}>{action.label}</div>
                    <div className="text-[8px] font-sans" style={{ color: "var(--ink-muted)" }}>{action.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

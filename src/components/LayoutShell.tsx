import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import {
  LayoutDashboard, Library, StickyNote, Quote, Type, BookOpen,
  FileText, Lightbulb, CalendarDays, Sparkles, Globe, Download,
  Settings, Search, Bell, Plus, LogOut, Command,
} from "lucide-react";

const navGroups = [
  {
    label: "OVERVIEW",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    ],
  },
  {
    label: "MODULES",
    items: [
      { icon: Library, label: "Library", path: "/library" },
      { icon: StickyNote, label: "Commonplace", path: "/notes" },
      { icon: Quote, label: "Quotations", path: "/quotations" },
      { icon: Type, label: "Vocabulary", path: "/vocabulary" },
      { icon: BookOpen, label: "Books", path: "/books" },
      { icon: FileText, label: "Research", path: "/research" },
      { icon: Lightbulb, label: "Ideas Lab", path: "/ideas" },
      { icon: CalendarDays, label: "Planning", path: "/plans" },
      { icon: Sparkles, label: "Synthesis", path: "/synthesis" },
    ],
  },
  {
    label: "VISUALIZE",
    items: [
      { icon: Globe, label: "Knowledge Atlas", path: "/atlas" },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { icon: Download, label: "Exports", path: "/exports" },
      { icon: Settings, label: "Settings", path: "/settings" },
    ],
  },
];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(() => api.search(searchQuery).then(setSearchResults).catch(() => setSearchResults([])), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const isActive = (path: string) => path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const dikwColors: Record<string, string> = { data: "#3B82F6", information: "#10B981", knowledge: "#C8A84B", wisdom: "#7B5EA7" };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: "var(--cream)" }}>
      {/* Sidebar */}
      <aside className="w-[230px] flex-shrink-0 flex flex-col bg-white border-r border-[var(--line)]">
        {/* Colorful top stripe */}
        <div className="flex h-1">
          <div className="flex-1 bg-[#E05C4B]" />
          <div className="flex-1 bg-[#C8A84B]" />
          <div className="flex-1 bg-[#4CAF50]" />
          <div className="flex-1 bg-[#2D9CDB]" />
          <div className="flex-1 bg-[#7B5EA7]" />
          <div className="flex-1 bg-[#1B2A4A]" />
        </div>

        {/* Brand */}
        <div className="px-4 pt-5 pb-2">
          <Link to="/" className="block">
            <h1 className="font-display text-[28px] tracking-[-1px] leading-none" style={{ color: "var(--navy)" }}>
              devasophy<span style={{ color: "var(--coral)" }}>.</span>
            </h1>
          </Link>
          <p className="mt-1 text-[9px] tracking-[2px] uppercase font-bold" style={{ color: "var(--muted)">
            Knowledge Taxonomy
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 pb-1 text-[8px] font-bold uppercase tracking-[2px]" style={{ color: "var(--muted)" }}>{group.label}</div>
              {group.items.map((item) => (
                <Link key={item.path} to={item.path} className={`nav-item ${isActive(item.path) ? "nav-item-active" : "nav-item-inactive"}`}>
                  <item.icon className="w-[16px] h-[16px] stroke-[2] flex-shrink-0" />
                  <span className="font-sans">{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Daily Intention */}
        <div className="mx-3 mb-3 p-3 rounded-xl border" style={{ background: "var(--cream-light)", borderColor: "var(--line)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <span style={{ color: "var(--amber)" }}>&#x2600;</span>
            <span className="text-[8px] font-bold uppercase tracking-[1.5px]" style={{ color: "var(--amber)" }}>Daily Intention</span>
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: "var(--ink-light)" }}>
            Synthesize the relationship between local structures and conceptual ontologies.
          </p>
        </div>

        {/* User */}
        <div className="px-3 py-2.5 border-t" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ background: "var(--navy)" }}>
              {user?.name?.[0]?.toUpperCase() ?? "P"}
            </div>
            <span className="text-[11px] font-sans flex-1 truncate" style={{ color: "var(--ink-light)" }}>{user?.name ?? "Philosopher"}</span>
            <button onClick={logout} className="transition-colors" style={{ color: "var(--muted)" }}>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-[56px] flex items-center gap-4 px-5 bg-white/70 backdrop-blur-xl border-b flex-shrink-0" style={{ borderColor: "var(--line)" }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-xl tracking-[-0.3px]" style={{ color: "var(--navy)" }}>
                {navGroups.flatMap((g) => g.items).find((i) => isActive(i.path))?.label ?? "Devasophy"}
              </h2>
              <span className="text-[10px] font-sans uppercase tracking-[1px]" style={{ color: "var(--muted)" }}>
                {today}
              </span>
            </div>
          </div>

          {/* Search */}
          <button onClick={() => setSearchOpen(true)} className="flex items-center gap-2 h-8 px-3 bg-white border rounded-lg text-[11px] font-sans transition-colors" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="text-[10px] px-1.5 py-px rounded border font-mono" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>&#x2318;K</kbd>
          </button>

          <button className="btn-primary h-8 text-[11px]" onClick={() => navigate("/notes?new=true")}>
            <Plus className="w-3.5 h-3.5" />
            New
          </button>

          <button className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--cream-light)]" style={{ color: "var(--muted)" }}>
            <Bell className="w-[16px] h-[16px]" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--coral)]" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto grid-bg">
          {children}
        </main>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} />
          <div className="relative w-[480px] bg-white rounded-xl shadow-2xl border overflow-hidden" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--line)" }}>
              <Command className="w-4 h-4" style={{ color: "var(--muted)" }} />
              <input autoFocus type="text" placeholder="Search across all knowledge..." className="flex-1 bg-transparent border-0 outline-none text-sm font-sans" style={{ color: "var(--navy)" }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <kbd className="text-[10px] px-1.5 py-px rounded border font-mono" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>ESC</kbd>
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {searchResults.length > 0 ? searchResults.map((r: any) => (
                <button key={`${r.type}-${r.id}`} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--cream-light)] transition-colors border-b" style={{ borderColor: "var(--line)" }}
                  onClick={() => { const paths: Record<string, string> = { note: "/notes", quotation: "/quotations", lexicon: "/vocabulary", document: "/research" }; navigate(paths[r.type] ?? "/library"); setSearchOpen(false); }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dikwColors[r.dikwTier ?? "information"] ?? "#999" }} />
                  <span className="text-[9px] font-bold uppercase tracking-wider w-20 flex-shrink-0 font-sans" style={{ color: "var(--muted)" }}>{r.module}</span>
                  <span className="text-[12px] truncate flex-1 font-sans" style={{ color: "var(--navy)" }}>{r.title}</span>
                </button>
              )) : searchQuery.length > 1 ? (
                <div className="p-6 text-center text-[11px] font-sans" style={{ color: "var(--muted)" }}>No results found</div>
              ) : (
                <div className="p-6 text-center text-[11px] font-sans" style={{ color: "var(--muted)" }}>Type to search across all modules...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

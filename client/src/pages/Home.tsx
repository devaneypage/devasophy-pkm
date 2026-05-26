import React, { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { BookOpen, FileText, Lightbulb, MessageSquareQuote, Plus } from "lucide-react";

const FOCUS_QUOTES = [
  { text: "The person you are becoming is more important than the person you have been.", author: "Alex Aubrey" },
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
];

const ITEM_ICONS: Record<string, React.FC<any>> = {
  notebook: MessageSquareQuote,
  lexicon: BookOpen,
  document: FileText,
  idea: Lightbulb,
};

function formatRelTime(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return "";
  const date = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (Number.isNaN(date.getTime())) return "";
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) {
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }
  if (diff < 7 * 86_400_000) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Home() {
  const [focusIndex, setFocusIndex] = useState(0);
  const [, setLocation] = useLocation();

  const notebookQuery = trpc.notebook.list.useQuery({ sortBy: "recent" });
  const lexiconQuery = trpc.lexicon.list.useQuery({});
  const booksQuery = trpc.books.list.useQuery({ sortBy: "recent" });
  const ideasQuery = trpc.ideas.list.useQuery({});

  const notes = notebookQuery.data ?? [];
  const lexicon = lexiconQuery.data ?? [];
  const books = booksQuery.data ?? [];
  const ideas = ideasQuery.data ?? [];

  // Quotes = notebook entries that are actual quotes (have author field)
  const quotes = notes.filter((n: any) => n.author);

  // Knowledge overview stats
  const stats = [
    { label: "NOTES", count: notes.length, delta: 0, color: "#E84D20" },
    { label: "QUOTES", count: quotes.length, delta: 0, color: "#2D6BE4" },
    { label: "BOOKS", count: books.length, delta: 0, color: "#1A8F6E" },
    { label: "CONCEPTS", count: lexicon.length + ideas.length, delta: 0, color: "#7B4FD4" },
  ];

  // Recently opened — combine notes + lexicon + ideas, sort by updatedAt
  type RecentItem = { id: number; type: string; title: string; jdLabel: string; updatedAt: Date | string | null; path: string };
  const recentItems: RecentItem[] = [
    ...notes.slice(0, 8).map((n: any) => ({
      id: n.id,
      type: "notebook",
      title: n.work || n.author || n.text?.slice(0, 50) || "Untitled note",
      jdLabel: n.collections || "30.01 Quotations",
      updatedAt: n.updatedAt,
      path: `/notebook/${n.id}`,
    })),
    ...lexicon.slice(0, 4).map((l: any) => ({
      id: l.id,
      type: "lexicon",
      title: l.term,
      jdLabel: "20.01 Vocabulary",
      updatedAt: l.updatedAt,
      path: `/lexicon/${l.id}`,
    })),
    ...ideas.slice(0, 4).map((i: any) => ({
      id: i.id,
      type: "idea",
      title: i.title,
      jdLabel: "50.01 Concepts",
      updatedAt: i.updatedAt,
      path: "/ideas",
    })),
  ]
    .sort((a, b) => {
      const at = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bt - at;
    })
    .slice(0, 6);

  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();

  // Use quotes from notebook as focus quotes, fall back to static
  const focusQuotes = quotes.length > 0
    ? quotes.slice(0, 3).map((q: any) => ({ text: q.text, author: q.author }))
    : FOCUS_QUOTES;
  const currentFocus = focusQuotes[focusIndex % focusQuotes.length];

  return (
    <div className="min-h-screen bg-white px-0 pb-24">
      {/* Today's Focus Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#E84D20] text-[10px] font-bold text-white">1</span>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-black">Today's Focus</span>
          <span className="ml-1 h-1.5 w-1.5 rounded-full bg-[#E84D20]" />
        </div>
        <span className="text-xs font-medium text-black/40">{today}</span>
      </div>

      {/* Quote Carousel Card */}
      <div className="mx-4 mb-5 overflow-hidden rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
        <div className="mb-3">
          <span className="text-5xl font-black leading-none text-[#E84D20]">"</span>
          <p className="mt-1 text-base font-medium leading-relaxed text-black">{currentFocus.text}</p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">— {currentFocus.author}</p>
        <div className="mt-4 flex items-center gap-1.5">
          {focusQuotes.map((_, i) => (
            <button
              key={i}
              onClick={() => setFocusIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === focusIndex % focusQuotes.length ? "w-5 bg-[#E84D20]" : "w-1.5 bg-black/15"}`}
            />
          ))}
        </div>
      </div>

      {/* Knowledge Overview */}
      <div className="px-4 mb-5">
        <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.25em] text-black/40">Knowledge Overview</p>
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-black/8 bg-white p-2.5 text-center">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em]" style={{ color: stat.color }}>{stat.label}</p>
              <p className="mt-0.5 text-xl font-black tabular-nums text-black">{stat.count.toLocaleString()}</p>
              <p className="mt-0.5 text-[0.6rem] font-medium text-black/30">+{stat.delta} today</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recently Opened */}
      <div className="px-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-black/40">Recently Opened</p>
          <button onClick={() => setLocation("/search")} className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[#E84D20]">View All</button>
        </div>
        <div className="divide-y divide-black/6 overflow-hidden rounded-2xl border border-black/8 bg-white">
          {recentItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-black/40">Your recent items will appear here.</div>
          ) : (
            recentItems.map((item) => {
              const Icon = ITEM_ICONS[item.type] ?? FileText;
              return (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => setLocation(item.path)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-black/2"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-black/8 bg-black/3">
                    <Icon className="h-4 w-4 text-black/60" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-black">{item.title}</p>
                    <p className="text-xs text-black/40">{item.jdLabel}</p>
                  </div>
                  <span className="text-xs font-medium text-black/30 whitespace-nowrap">{formatRelTime(item.updatedAt)}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Quick capture FAB */}
      <button
        onClick={() => setLocation("/notes")}
        className="fixed bottom-24 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#E84D20] text-white shadow-lg shadow-[#E84D20]/30 transition hover:bg-[#d43b10] z-30"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

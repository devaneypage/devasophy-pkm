import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, SlidersHorizontal, LayoutGrid, List, Star } from "lucide-react";

const COVER_COLORS = ["#E84D20", "#2D6BE4", "#D4A017", "#1A8F6E", "#7B4FD4", "#E05C94", "#2A9D8F", "#E76F51"];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          fill={i <= rating ? "#F5B820" : "none"}
          stroke={i <= rating ? "#F5B820" : "#CCCCCC"}
        />
      ))}
    </div>
  );
}

function BookCover({ title, color }: { title: string; color: string }) {
  return (
    <div
      className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-sm shadow-md"
      style={{ backgroundColor: color }}
    >
      <div className="absolute inset-0 flex flex-col justify-between p-1.5">
        <p className="text-[0.55rem] font-bold uppercase leading-tight tracking-wide text-white line-clamp-4">
          {title}
        </p>
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-black/10" />
    </div>
  );
}

export default function Library() {
  const [activeTab, setActiveTab] = useState<"books" | "authors" | "sources" | "tags">("books");
  const [isGrid, setIsGrid] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newBook, setNewBook] = useState({ title: "", author: "", coverColor: COVER_COLORS[0], rating: "4.0", readingProgress: 0, status: "want_to_read" as const });
  const [, setLocation] = useLocation();

  const booksQuery = trpc.books.list.useQuery({ sortBy: "recent" });
  const createMutation = trpc.books.create.useMutation({
    onSuccess: () => {
      booksQuery.refetch();
      setShowNewDialog(false);
      setNewBook({ title: "", author: "", coverColor: COVER_COLORS[0], rating: "4.0", readingProgress: 0, status: "want_to_read" });
    },
  });

  const books = booksQuery.data ?? [];

  const tabs = [
    { key: "books", label: "BOOKS", count: books.length },
    { key: "authors", label: "AUTHORS", count: Array.from(new Set(books.map((b: any) => b.author).filter(Boolean))).length },
    { key: "sources", label: "SOURCES" },
    { key: "tags", label: "TAGS" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-black/8 bg-white px-4 py-4">
        <button onClick={() => setLocation("/")} className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10">
          <ArrowLeft className="h-4 w-4 text-black" />
        </button>
        <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-black">Library</h1>
        <div className="flex gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10">
            <SlidersHorizontal className="h-4 w-4 text-black" />
          </button>
          <button onClick={() => setShowNewDialog(true)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E84D20] text-white">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black/8 bg-white">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-3 text-xs font-bold tracking-[0.15em] transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-[#E84D20] text-[#E84D20]"
                : "text-black/40 hover:text-black/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Count + Sort row */}
      <div className="flex items-center justify-between border-b border-black/6 bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/50">
          {books.length} Books
        </p>
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/50">Sort: Recent ↓</p>
          <div className="flex gap-1">
            <button
              onClick={() => setIsGrid(false)}
              className={`flex h-7 w-7 items-center justify-center rounded ${!isGrid ? "bg-black text-white" : "text-black/40"}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setIsGrid(true)}
              className={`flex h-7 w-7 items-center justify-center rounded ${isGrid ? "bg-black text-white" : "text-black/40"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Books list */}
      <div className="divide-y divide-black/6">
        {booksQuery.isLoading ? (
          <div className="flex items-center justify-center py-12 text-black/40">Loading books…</div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <p className="text-sm text-black/40">Your library is empty.</p>
            <Button onClick={() => setShowNewDialog(true)} className="rounded-full bg-[#E84D20] px-6 py-2 text-white hover:bg-[#d43b10]">
              Add your first book
            </Button>
          </div>
        ) : (
          books.map((book: any) => (
            <div key={book.id} className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-black/2">
              <BookCover title={book.title} color={book.coverColor ?? "#E84D20"} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-black leading-tight">{book.title}</p>
                <p className="mt-0.5 text-xs text-black/50">{book.author || "Unknown"}</p>
                <p className="mt-0.5 text-xs text-black/40">
                  {new Date(book.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <StarRating rating={Math.round(parseFloat(book.rating ?? "0"))} />
                  <span className="text-xs font-medium text-black/40">{book.rating ?? "—"}</span>
                </div>
                {book.readingProgress != null && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-black/8 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${book.readingProgress}%`, backgroundColor: book.coverColor ?? "#E84D20" }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-black/50">{book.readingProgress}%</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Book Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="rounded-2xl border border-black/10 bg-white p-6 shadow-xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-black">Add a book</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <Input placeholder="Title" value={newBook.title} onChange={(e) => setNewBook({ ...newBook, title: e.target.value })} className="rounded-xl border-black/15 bg-black/3 text-black placeholder:text-black/40" />
            <Input placeholder="Author" value={newBook.author} onChange={(e) => setNewBook({ ...newBook, author: e.target.value })} className="rounded-xl border-black/15 bg-black/3 text-black placeholder:text-black/40" />
            <div>
              <p className="mb-1.5 text-xs font-medium text-black/60">Cover colour</p>
              <div className="flex flex-wrap gap-2">
                {COVER_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewBook({ ...newBook, coverColor: c })}
                    className="h-7 w-7 rounded-full border-2 transition"
                    style={{ backgroundColor: c, borderColor: newBook.coverColor === c ? "#000" : "transparent" }}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-black/60">Reading progress (%)</p>
              <Input type="number" min={0} max={100} value={newBook.readingProgress} onChange={(e) => setNewBook({ ...newBook, readingProgress: parseInt(e.target.value) || 0 })} className="rounded-xl border-black/15 bg-black/3 text-black" />
            </div>
            <Button onClick={() => createMutation.mutate(newBook)} disabled={!newBook.title || createMutation.isPending} className="w-full rounded-xl bg-[#E84D20] text-white hover:bg-[#d43b10]">
              {createMutation.isPending ? "Adding…" : "Add book"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

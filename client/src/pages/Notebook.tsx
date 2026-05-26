import React from "react";
import { Filter, NotebookPen, Plus, Quote, Search, Upload } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function Notebook() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [collectionFilter, setCollectionFilter] = React.useState<string>("all");
  const { data: entries = [], isLoading } = trpc.notebook.list.useQuery({ search: searchTerm });
  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  const collections = React.useMemo(() => {
    const values = new Set<string>();
    for (const entry of entries as any[]) {
      for (const collection of (entry.collections || "").split(",").map((item: string) => item.trim()).filter(Boolean)) {
        values.add(collection);
      }
    }
    return Array.from(values).slice(0, 10);
  }, [entries]);

  const filteredEntries = React.useMemo(() => {
    return entries.filter((entry: any) => {
      if (collectionFilter === "all") return true;
      return (entry.collections || "")
        .split(",")
        .map((item: string) => item.trim())
        .filter(Boolean)
        .includes(collectionFilter);
    });
  }, [collectionFilter, entries]);

  const selectedEntry = filteredEntries.find((entry: any) => entry.id === selectedId) ?? filteredEntries[0] ?? null;

  React.useEffect(() => {
    if (!selectedEntry && filteredEntries[0]) {
      setSelectedId(filteredEntries[0].id);
    }
  }, [filteredEntries, selectedEntry]);

  return (
    <div className="space-y-6">
      <section className="dev-soft-card p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Notes workspace</p>
            <h1 className="mb-4">Notes</h1>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              Review quotations and notes through a split-pane layout, filter by collection, and move into deeper notebook or import workflows only when needed.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setLocation("/bulk-import")} className="h-11 rounded-full border border-[#13243f]/15 bg-[#e85b3e] px-5 text-white hover:bg-[#d94d31]">
              <Upload className="mr-2 h-4 w-4" />
              Import notes
            </Button>
            <Button variant="outline" onClick={() => setLocation("/notebook")} className="h-11 rounded-full border border-black/10 bg-white px-5 text-[#13243f] hover:bg-[#fffaf2]">
              <Plus className="mr-2 h-4 w-4" />
              Open full notebook
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <Card className="dev-card rounded-[1.8rem] p-5 shadow-none">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search notes, authors, tags, and text" className="dev-search h-14 pl-12 text-base shadow-none" />
          </div>
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
            <button onClick={() => setCollectionFilter("all")} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${collectionFilter === "all" ? "border-[#13243f] bg-[#13243f] text-white" : "border-black/10 bg-white text-[#13243f] hover:bg-[#fcfaf6]"}`}>
              All collections
            </button>
            {collections.map((collection) => (
              <button key={collection} onClick={() => setCollectionFilter(collection)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${collectionFilter === collection ? "border-[#13243f] bg-[#13243f] text-white" : "border-black/10 bg-white text-[#13243f] hover:bg-[#fcfaf6]"}`}>
                {collection}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading notes...</p>
            ) : filteredEntries.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-black/12 bg-[#fcfaf6] p-5 text-sm leading-6 text-muted-foreground">
                No entries match the current search and collection filters.
              </div>
            ) : (
              filteredEntries.map((entry: any) => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedId(entry.id)}
                  className={`block w-full rounded-[1.35rem] border p-4 text-left transition ${selectedEntry?.id === entry.id ? "border-[#13243f]/25 bg-[#f6f1e7]" : "border-black/10 bg-[#fcfaf6] hover:border-black/15"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-3 text-sm leading-6 text-foreground">{entry.text}</p>
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-black/10 bg-[#f8e9b7]">
                      {entry.sourceType === "General note" ? <NotebookPen className="h-4 w-4 text-[#13243f]" /> : <Quote className="h-4 w-4 text-[#13243f]" />}
                    </div>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">{entry.author || entry.collections || entry.sourceType || "Commonplace Notebook"}</p>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card className="dev-card rounded-[1.8rem] p-6 shadow-none">
          {selectedEntry ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Entry detail</p>
                  <h2 className="mt-2 text-3xl text-foreground">{selectedEntry.author || selectedEntry.sourceType || "Selected note"}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(selectedEntry.collections || "").split(",").map((collection: string) => collection.trim()).filter(Boolean).map((collection: string) => (
                    <Badge key={collection} variant="outline" className="rounded-full border-black/10 bg-[#fcfaf6]">{collection}</Badge>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-[1.6rem] border border-black/10 bg-[#fcfaf6] p-6">
                <p className="text-lg leading-8 text-foreground">{selectedEntry.text}</p>
                {selectedEntry.note ? <p className="mt-5 text-sm leading-7 text-muted-foreground">{selectedEntry.note}</p> : null}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.4rem] border border-black/10 bg-[#fcfaf6] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Source</p>
                  <p className="mt-3 text-sm leading-6 text-foreground">{selectedEntry.work || selectedEntry.sourceType || "No source metadata provided."}</p>
                </div>
                <div className="rounded-[1.4rem] border border-black/10 bg-[#fcfaf6] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tags</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(selectedEntry.tags || "").split(",").map((tag: string) => tag.trim()).filter(Boolean).length > 0 ? (
                      (selectedEntry.tags || "").split(",").map((tag: string) => tag.trim()).filter(Boolean).map((tag: string) => <Badge key={tag} variant="outline" className="rounded-full border-black/10 bg-white">{tag}</Badge>)
                    ) : (
                      <p className="text-sm text-muted-foreground">No tags attached yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="outline" className="rounded-2xl border-black/10 bg-[#fcfaf6]" onClick={() => setLocation(`/notebook/${selectedEntry.id}`)}>
                  Open detail page
                </Button>
                <Button variant="outline" className="rounded-2xl border-black/10 bg-[#fcfaf6]" onClick={() => setLocation("/bulk-import")}>
                  <Filter className="mr-2 h-4 w-4" />
                  Refine with import tools
                </Button>
              </div>
            </>
          ) : (
            <div className="flex min-h-[24rem] items-center justify-center text-center text-muted-foreground">
              Select a note from the left pane to inspect its details.
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

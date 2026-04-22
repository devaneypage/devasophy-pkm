import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Plus, Quote, Search, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function Notebook() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    text: "",
    author: "",
    work: "",
    sourceType: "",
    location: "",
    note: "",
    tags: "",
    collections: "",
    favorite: false,
  });

  const { data: entries, isLoading, refetch } = trpc.notebook.list.useQuery({
    search: searchTerm,
  });

  const createMutation = trpc.notebook.create.useMutation({
    onSuccess: () => {
      refetch();
      setFormData({
        text: "",
        author: "",
        work: "",
        sourceType: "",
        location: "",
        note: "",
        tags: "",
        collections: "",
        favorite: false,
      });
      setShowForm(false);
    },
  });

  const deleteMutation = trpc.notebook.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim()) return;

    createMutation.mutate({
      ...formData,
      uuid: uuidv4(),
    });
  };

  return (
    <div className="space-y-6">
      <section className="dev-soft-card p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Module 01 · Notes and quotations
            </p>
            <h1 className="mb-4">Commonplace Notebook</h1>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              Capture quotations, passages, and observations with source metadata, personal notes, collections, and tags.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowForm((current) => !current)}
              className="h-11 rounded-full border-2 border-black bg-[#e25b33] px-5 text-white shadow-none hover:bg-[#d6522d]"
            >
              <Plus className="mr-2 h-4 w-4" />
              {showForm ? "Close form" : "New entry"}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search quotes, authors, works, or tags"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dev-search h-14 pl-12 text-base shadow-none"
            />
          </div>
          <div className="dev-card flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Visible entries</p>
              <p className="text-3xl font-black leading-none">{entries?.length ?? 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#efb93a]">
              <Quote className="h-5 w-5 text-black" />
            </div>
          </div>
        </div>
      </section>

      {showForm && (
        <Card className="dev-card rounded-[1.5rem] p-6 shadow-none sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3 border-b border-black/10 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Quick capture</p>
              <h2 className="mt-1 text-[2rem] leading-none">Create notebook entry</h2>
            </div>
            <div className="rounded-full border-2 border-black bg-[#efb93a] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-black">
              11 / Quotes
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Quote or passage *</label>
              <Textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Enter the quotation, passage, or observation you want to preserve"
                rows={5}
                className="rounded-[1.2rem] border-2 border-black/85 bg-white shadow-none"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Author</label>
                <Input
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Author name"
                  className="rounded-full border-2 border-black/85 bg-white shadow-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Work or source</label>
                <Input
                  value={formData.work}
                  onChange={(e) => setFormData({ ...formData, work: e.target.value })}
                  placeholder="Book, article, lecture, archive"
                  className="rounded-full border-2 border-black/85 bg-white shadow-none"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Source type</label>
                <Input
                  value={formData.sourceType}
                  onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                  placeholder="Book, article, web, video"
                  className="rounded-full border-2 border-black/85 bg-white shadow-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Page, chapter, timestamp, URL"
                  className="rounded-full border-2 border-black/85 bg-white shadow-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Personal note</label>
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Add a reflection, interpretation, or semantic link prompt"
                rows={4}
                className="rounded-[1.2rem] border-2 border-black/85 bg-white shadow-none"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Tags</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="epistemology, rhetoric, commonplace"
                  className="rounded-full border-2 border-black/85 bg-white shadow-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Collection</label>
                <Input
                  value={formData.collections}
                  onChange={(e) => setFormData({ ...formData, collections: e.target.value })}
                  placeholder="Reading log, research file, lecture notes"
                  className="rounded-full border-2 border-black/85 bg-white shadow-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="h-11 rounded-full border-2 border-black bg-[#116d6d] px-5 text-white shadow-none hover:bg-[#0f5959]"
              >
                {createMutation.isPending ? "Creating..." : "Create entry"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="h-11 rounded-full border-2 border-black bg-white px-5 text-black shadow-none hover:bg-[#f6f3ec]"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <section className="space-y-4">
        {isLoading ? (
          <Card className="dev-card rounded-[1.5rem] p-12 text-center shadow-none">
            <p className="text-muted-foreground">Loading notebook entries...</p>
          </Card>
        ) : entries && entries.length > 0 ? (
          entries.map((entry, index) => (
            <Card key={entry.id} className="dev-card overflow-hidden rounded-[1.5rem] p-0 shadow-none">
              <div
                className={`h-4 w-full ${index % 3 === 0 ? "dev-pattern-waves" : index % 3 === 1 ? "dev-pattern-dots" : "dev-pattern-stripes"}`}
                style={{ backgroundColor: index % 3 === 0 ? "#efb93a" : index % 3 === 1 ? "#56c5ea" : "#e25b33" }}
              />
              <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="mb-3 text-2xl italic leading-9 text-foreground">“{entry.text}”</p>
                  <div className="mb-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {entry.author && <span className="dev-chip">{entry.author}</span>}
                    {entry.work && <span className="dev-chip">{entry.work}</span>}
                    {entry.location && <span className="dev-chip">{entry.location}</span>}
                    {entry.sourceType && <span className="dev-chip">{entry.sourceType}</span>}
                  </div>
                  {entry.note && <p className="text-sm leading-6 text-muted-foreground">{entry.note}</p>}
                  {entry.tags && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {entry.tags.split(",").map((tag) => (
                        <span key={tag} className="rounded-full border border-black/20 bg-[#f6f3ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 lg:flex-col">
                  <button className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-black bg-white transition hover:bg-[#f6f3ec]">
                    <Heart className={`h-4 w-4 ${entry.favorite ? "fill-[#e25b33] text-[#e25b33]" : "text-black"}`} />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate({ id: entry.id })}
                    className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-black bg-white text-[#e25b33] transition hover:bg-[#fff1eb]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="dev-card rounded-[1.5rem] p-12 text-center shadow-none">
            <p className="text-lg font-semibold text-foreground">No notebook entries yet.</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Start your Devanomy commonplace archive by capturing your first quotation or observation.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}

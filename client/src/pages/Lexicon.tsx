import React, { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import CategorySelect from "@/components/CategorySelect";
import ZettelkastenIdDisplay from "@/components/ZettelkastenIdDisplay";

export default function Lexicon() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [generatedZettelkastenId, setGeneratedZettelkastenId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    term: "",
    partOfSpeech: "",
    definition: "",
    etymology: "",
    origin: "",
    sourceType: "",
    imageNum: "",
    notes: "",
    categoryId: undefined as number | undefined,
  });
  const [editFormData, setEditFormData] = useState({
    term: "",
    partOfSpeech: "",
    definition: "",
    etymology: "",
    origin: "",
    sourceType: "",
    imageNum: "",
    notes: "",
    categoryId: undefined as number | undefined,
  });

  const { data: entries, isLoading, refetch } = trpc.lexicon.list.useQuery({
    search: searchTerm,
  });

  const { data: taxonomyTree } = trpc.taxonomy.getTree.useQuery();

  const createMutation = trpc.lexicon.create.useMutation({
    onSuccess: () => {
      refetch();
      setFormData({
        term: "",
        partOfSpeech: "",
        definition: "",
        etymology: "",
        origin: "",
        sourceType: "",
        imageNum: "",
        notes: "",
        categoryId: undefined,
      });
      setShowForm(false);
    },
  });

  const updateMutation = trpc.lexicon.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingEntryId(null);
    },
  });

  const deleteMutation = trpc.lexicon.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const alphabeticalIndex = useMemo(() => {
    const available = new Set((entries || []).map((entry) => entry.term?.trim().charAt(0).toUpperCase()).filter(Boolean));
    return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => ({
      letter,
      active: available.has(letter),
    }));
  }, [entries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.term.trim()) return;
    createMutation.mutate(formData);
  };

  const startEditing = (entry: NonNullable<typeof entries>[number]) => {
    setEditingEntryId(entry.id);
    setExpandedId(entry.id);
    setEditFormData({
      term: entry.term,
      partOfSpeech: entry.partOfSpeech || "",
      definition: entry.definition || "",
      etymology: entry.etymology || "",
      origin: entry.origin || "",
      sourceType: entry.sourceType || "",
      imageNum: entry.imageNum || "",
      notes: entry.notes || "",
      categoryId: entry.categoryId || undefined,
    });
  };

  const handleUpdate = (entryId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.term.trim()) return;

    updateMutation.mutate({
      id: entryId,
      term: editFormData.term,
      partOfSpeech: editFormData.partOfSpeech || undefined,
      definition: editFormData.definition || undefined,
      etymology: editFormData.etymology || undefined,
      origin: editFormData.origin || undefined,
      sourceType: editFormData.sourceType || undefined,
      imageNum: editFormData.imageNum || undefined,
      notes: editFormData.notes || undefined,
      categoryId: editFormData.categoryId,
    });
  };

  return (
    <div className="space-y-6">
      <section className="dev-soft-card p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Module 02 · Personal lexicon and concordance
            </p>
            <h1 className="mb-4">Clavis Aurea</h1>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              Build a browsable glossary of terms, definitions, etymologies, origins, and scholarly notes.
            </p>
          </div>
          <Button
            onClick={() => setShowForm((current) => !current)}
            className="h-11 rounded-full border-2 border-black bg-[#56c5ea] px-5 text-black shadow-none hover:bg-[#3ab8e3]"
          >
            <Plus className="mr-2 h-4 w-4" />
            {showForm ? "Close form" : "New term"}
          </Button>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search terms, origins, etymologies, or notes"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dev-search h-14 pl-12 text-base shadow-none"
              />
            </div>
            <div className="dev-card rounded-[1.35rem] p-4 shadow-none">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Alphabetical index</p>
              <div className="grid grid-cols-7 gap-2 sm:grid-cols-9 lg:grid-cols-13">
                {alphabeticalIndex.map(({ letter, active }) => (
                  <button
                    key={letter}
                    className={`flex h-10 items-center justify-center rounded-full border-2 border-black text-sm font-semibold transition ${active ? "bg-[#f6f3ec] text-black" : "bg-white text-black/35"}`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="dev-card rounded-[1.35rem] p-5 shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Glossary status</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[1rem] border border-black/10 bg-[#f6f3ec] p-4">
                <p className="text-4xl font-black leading-none text-foreground">{entries?.length ?? 0}</p>
                <p className="mt-2 text-sm text-muted-foreground">Visible terms</p>
              </div>
              <div className="rounded-[1rem] border border-black/10 bg-white p-4">
                <p className="text-4xl font-black leading-none text-foreground">354</p>
                <p className="mt-2 text-sm text-muted-foreground">Target import set</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showForm && (
        <Card className="dev-card rounded-[1.5rem] p-6 shadow-none sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3 border-b border-black/10 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Glossary authoring</p>
              <h2 className="mt-1 text-[2rem] leading-none">Create Clavis Aurea entry</h2>
            </div>
            <div className="rounded-full border-2 border-black bg-[#56c5ea] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-black">
              21 / Terms
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Term *</label>
                <Input
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  placeholder="Enter the term"
                  className="rounded-full border-2 border-black/85 bg-white shadow-none"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Part of speech</label>
                <Input
                  value={formData.partOfSpeech}
                  onChange={(e) => setFormData({ ...formData, partOfSpeech: e.target.value })}
                  placeholder="noun, verb, adjective"
                  className="rounded-full border-2 border-black/85 bg-white shadow-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Definition</label>
              <Textarea
                value={formData.definition}
                onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                placeholder="Primary definition, conceptual scope, or summary"
                rows={3}
                className="rounded-[1.2rem] border-2 border-black/85 bg-white shadow-none"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Etymology</label>
                <Textarea
                  value={formData.etymology}
                  onChange={(e) => setFormData({ ...formData, etymology: e.target.value })}
                  placeholder="Word origin and evolution"
                  rows={3}
                  className="rounded-[1.2rem] border-2 border-black/85 bg-white shadow-none"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Origin</label>
                  <Input
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="Language or source tradition"
                    className="rounded-full border-2 border-black/85 bg-white shadow-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Source type</label>
                  <Input
                    value={formData.sourceType}
                    onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                    placeholder="Book, article, archive, lecture"
                    className="rounded-full border-2 border-black/85 bg-white shadow-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Reference image number</label>
                <Input
                  value={formData.imageNum}
                  onChange={(e) => setFormData({ ...formData, imageNum: e.target.value })}
                  placeholder="Optional image number"
                  className="rounded-full border-2 border-black/85 bg-white shadow-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Notes</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Examples, related concepts, usage notes"
                  rows={2}
                  className="rounded-[1.2rem] border-2 border-black/85 bg-white shadow-none"
                />
              </div>
            </div>

            <CategorySelect
              label="Johnny Decimal category"
              value={formData.categoryId}
              tree={taxonomyTree}
              placeholder="Assign this term to a seeded lexicon category"
              onChange={(categoryId) => setFormData({ ...formData, categoryId })}
            />

            {generatedZettelkastenId && (
              <div className="rounded-lg border border-border bg-card p-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Zettelkasten ID</label>
                <ZettelkastenIdDisplay zettelkastenId={generatedZettelkastenId} />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
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

      <section className="space-y-3">
        {isLoading ? (
          <Card className="dev-card rounded-[1.5rem] p-12 text-center shadow-none">
            <p className="text-muted-foreground">Loading lexicon terms...</p>
          </Card>
        ) : entries && entries.length > 0 ? (
          entries.map((entry, index) => {
            const accent = index % 3 === 0 ? "#56c5ea" : index % 3 === 1 ? "#efb93a" : "#e25b33";
            const pattern = index % 3 === 0 ? "dev-pattern-dots" : index % 3 === 1 ? "dev-pattern-stripes" : "dev-pattern-waves";
            return (
              <Card key={entry.id} className="dev-card overflow-hidden rounded-[1.5rem] p-0 shadow-none">
                <div
                  className="flex cursor-pointer items-center justify-between gap-4 border-b border-black/10 px-5 py-5"
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-[2rem] leading-none text-foreground">{entry.term}</h3>
                      {entry.partOfSpeech && <span className="dev-chip">{entry.partOfSpeech}</span>}
                    </div>
                    {entry.definition && (
                      <p className="mt-3 line-clamp-2 max-w-4xl text-sm leading-6 text-muted-foreground">{entry.definition}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(entry);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white transition hover:bg-[#f6f3ec]"
                    >
                      <Pencil className="h-4 w-4 text-black" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate({ id: entry.id });
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white text-[#e25b33] transition hover:bg-[#fff1eb]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white">
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedId === entry.id ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </div>

                <div className={`${pattern} h-3 w-full`} style={{ backgroundColor: accent }} />

                {expandedId === entry.id && (
                  <div className="grid gap-4 px-5 py-5 lg:grid-cols-2">
                    {entry.definition && (
                      <div className="rounded-[1.2rem] border border-black/10 bg-[#f6f3ec] p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Definition</p>
                        <p className="text-sm leading-6 text-foreground">{entry.definition}</p>
                      </div>
                    )}
                    {entry.etymology && (
                      <div className="rounded-[1.2rem] border border-black/10 bg-white p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Etymology</p>
                        <p className="text-sm leading-6 text-foreground">{entry.etymology}</p>
                      </div>
                    )}
                    {entry.origin && (
                      <div className="rounded-[1.2rem] border border-black/10 bg-white p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Origin</p>
                        <p className="text-sm leading-6 text-foreground">{entry.origin}</p>
                      </div>
                    )}
                    {entry.notes && (
                      <div className="rounded-[1.2rem] border border-black/10 bg-[#f6f3ec] p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Notes</p>
                        <p className="text-sm leading-6 text-foreground">{entry.notes}</p>
                      </div>
                    )}

                    {editingEntryId === entry.id && (
                      <div className="lg:col-span-2 rounded-[1.25rem] border-2 border-black bg-[#f6f3ec] p-5">
                        <form onSubmit={(e) => handleUpdate(entry.id, e)} className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <Input value={editFormData.term} onChange={(e) => setEditFormData({ ...editFormData, term: e.target.value })} placeholder="Term" className="rounded-full border-2 border-black/85 bg-white shadow-none" />
                            <Input value={editFormData.partOfSpeech} onChange={(e) => setEditFormData({ ...editFormData, partOfSpeech: e.target.value })} placeholder="Part of speech" className="rounded-full border-2 border-black/85 bg-white shadow-none" />
                          </div>
                          <Textarea value={editFormData.definition} onChange={(e) => setEditFormData({ ...editFormData, definition: e.target.value })} rows={3} placeholder="Definition" className="rounded-[1.2rem] border-2 border-black/85 bg-white shadow-none" />
                          <div className="grid gap-4 md:grid-cols-2">
                            <Textarea value={editFormData.etymology} onChange={(e) => setEditFormData({ ...editFormData, etymology: e.target.value })} rows={3} placeholder="Etymology" className="rounded-[1.2rem] border-2 border-black/85 bg-white shadow-none" />
                            <Textarea value={editFormData.origin} onChange={(e) => setEditFormData({ ...editFormData, origin: e.target.value })} rows={3} placeholder="Origin" className="rounded-[1.2rem] border-2 border-black/85 bg-white shadow-none" />
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <Input value={editFormData.sourceType} onChange={(e) => setEditFormData({ ...editFormData, sourceType: e.target.value })} placeholder="Source type" className="rounded-full border-2 border-black/85 bg-white shadow-none" />
                            <Input value={editFormData.imageNum} onChange={(e) => setEditFormData({ ...editFormData, imageNum: e.target.value })} placeholder="Reference image number" className="rounded-full border-2 border-black/85 bg-white shadow-none" />
                          </div>
                          <Textarea value={editFormData.notes} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} rows={3} placeholder="Notes" className="rounded-[1.2rem] border-2 border-black/85 bg-white shadow-none" />
                          <CategorySelect
                            label="Johnny Decimal category"
                            value={editFormData.categoryId}
                            tree={taxonomyTree}
                            placeholder="Reassign this term to a seeded category"
                            onChange={(categoryId) => setEditFormData({ ...editFormData, categoryId })}
                          />
                          <div className="flex flex-wrap gap-3">
                            <Button type="submit" disabled={updateMutation.isPending} className="h-11 rounded-full border-2 border-black bg-[#56c5ea] px-5 text-black shadow-none hover:bg-[#3ab8e3]">
                              {updateMutation.isPending ? "Saving..." : "Save changes"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setEditingEntryId(null)} className="h-11 rounded-full border-2 border-black bg-white px-5 text-black shadow-none hover:bg-white">
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <Card className="dev-card rounded-[1.5rem] p-12 text-center shadow-none">
            <p className="text-lg font-semibold text-foreground">No terms yet.</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Add your first glossary term or import the full Clavis Aurea dataset to populate the concordance.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}

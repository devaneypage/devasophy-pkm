import React, { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import InsightPanel from "@/components/InsightPanel";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpenText,
  Bookmark,
  Brain,
  FileText,
  GripVertical,
  LibraryBig,
  Plus,
  Quote,
  Save,
  Search,
  Sparkles,
  Tags,
  Trash2,
} from "lucide-react";
import {
  buildEntryPreview,
  commonplaceTypes,
  getCommonplaceTypeConfig,
  type CommonplaceTypeValue,
} from "@/lib/commonplace";

type BoardRecord = {
  id: number;
  title: string;
  description: string | null;
  isDefault: boolean;
};

type ColumnRecord = {
  id: number;
  title: string;
  colorToken: string | null;
  position: number;
};

type EntryRecord = {
  id: number;
  boardId: number;
  columnId: number;
  entryType: CommonplaceTypeValue;
  title: string;
  summary: string | null;
  content: unknown;
  metadata: unknown;
  tags: string | null;
  position: number;
  isArchived: boolean;
};

type EditorState = {
  open: boolean;
  id?: number;
  boardId: number | null;
  columnId: number | null;
  entryType: CommonplaceTypeValue;
  title: string;
  summary: string;
  tags: string;
  markdown: string;
  sourceUrl: string;
  sourceLabel: string;
  secondaryText: string;
  listItems: string;
};

const iconMap: Record<CommonplaceTypeValue, React.ComponentType<{ className?: string }>> = {
  research_note: FileText,
  bookmark: Bookmark,
  idea: Sparkles,
  quote: Quote,
  book: LibraryBig,
  article: BookOpenText,
  glossary_term: Brain,
  list: Tags,
};

const emptyEditorState = (): EditorState => ({
  open: false,
  boardId: null,
  columnId: null,
  entryType: "research_note",
  title: "",
  summary: "",
  tags: "",
  markdown: "",
  sourceUrl: "",
  sourceLabel: "",
  secondaryText: "",
  listItems: "",
});

function buildContentPayload(state: EditorState) {
  if (state.entryType === "list") {
    return {
      items: state.listItems
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    };
  }

  if (state.entryType === "bookmark") {
    return {
      url: state.sourceUrl,
      note: state.markdown,
      label: state.sourceLabel,
    };
  }

  if (state.entryType === "book") {
    return {
      author: state.secondaryText,
      notes: state.markdown,
      status: state.sourceLabel,
    };
  }

  if (state.entryType === "quote") {
    return {
      text: state.markdown,
      source: state.sourceLabel,
      location: state.secondaryText,
    };
  }

  if (state.entryType === "glossary_term") {
    return {
      definition: state.markdown,
      etymology: state.secondaryText,
      aliases: state.sourceLabel,
    };
  }

  if (state.entryType === "article") {
    return {
      abstract: state.markdown,
      author: state.secondaryText,
      url: state.sourceUrl,
      publication: state.sourceLabel,
    };
  }

  return {
    markdown: state.markdown,
    context: state.sourceLabel,
    reference: state.secondaryText,
  };
}

function deriveEditorState(entry: EntryRecord): EditorState {
  const content = entry.content && typeof entry.content === "object" ? (entry.content as Record<string, unknown>) : {};

  return {
    open: true,
    id: entry.id,
    boardId: entry.boardId,
    columnId: entry.columnId,
    entryType: entry.entryType,
    title: entry.title,
    summary: entry.summary ?? "",
    tags: entry.tags ?? "",
    markdown:
      typeof content.markdown === "string"
        ? content.markdown
        : typeof content.note === "string"
          ? content.note
          : typeof content.notes === "string"
            ? content.notes
            : typeof content.text === "string"
              ? content.text
              : typeof content.definition === "string"
                ? content.definition
                : typeof content.abstract === "string"
                  ? content.abstract
                  : "",
    sourceUrl: typeof content.url === "string" ? content.url : "",
    sourceLabel:
      typeof content.label === "string"
        ? content.label
        : typeof content.source === "string"
          ? content.source
          : typeof content.publication === "string"
            ? content.publication
            : typeof content.context === "string"
              ? content.context
              : typeof content.status === "string"
                ? content.status
                : typeof content.aliases === "string"
                  ? content.aliases
                  : "",
    secondaryText:
      typeof content.location === "string"
        ? content.location
        : typeof content.author === "string"
          ? content.author
          : typeof content.reference === "string"
            ? content.reference
            : typeof content.etymology === "string"
              ? content.etymology
              : "",
    listItems: Array.isArray(content.items) ? content.items.join("\n") : "",
  };
}

export default function Commonplace() {
  const utils = trpc.useUtils();
  const [selectedBoardId, setSelectedBoardId] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeType, setActiveType] = useState<CommonplaceTypeValue | "all">("all");
  const [draggedEntryId, setDraggedEntryId] = useState<number | null>(null);
  const [editor, setEditor] = useState<EditorState>(emptyEditorState());

  const boardsQuery = trpc.commonplace.boards.list.useQuery();
  const snapshotQuery = trpc.commonplace.bootstrap.useQuery(selectedBoardId ? { boardId: selectedBoardId } : undefined);

  const refreshCommonplace = async () => {
    await Promise.all([
      utils.commonplace.boards.list.invalidate(),
      utils.commonplace.bootstrap.invalidate(),
      utils.commonplace.entries.list.invalidate(),
    ]);
  };

  const createEntryMutation = trpc.commonplace.entries.create.useMutation({
    onSuccess: async () => {
      setEditor(emptyEditorState());
      await refreshCommonplace();
    },
  });

  const updateEntryMutation = trpc.commonplace.entries.update.useMutation({
    onSuccess: async () => {
      setEditor(emptyEditorState());
      await refreshCommonplace();
    },
  });

  const deleteEntryMutation = trpc.commonplace.entries.delete.useMutation({
    onSuccess: async () => {
      setEditor(emptyEditorState());
      await refreshCommonplace();
    },
  });

  const moveEntryMutation = trpc.commonplace.entries.move.useMutation({
    onSuccess: refreshCommonplace,
  });

  const createColumnMutation = trpc.commonplace.columns.create.useMutation({
    onSuccess: refreshCommonplace,
  });

  const saveBoardMutation = trpc.commonplace.boards.saveSnapshot.useMutation({
    onSuccess: async (snapshot) => {
      setSelectedBoardId(snapshot.board.id);
      await refreshCommonplace();
    },
  });

  const boards = (boardsQuery.data ?? []) as BoardRecord[];
  const snapshot = snapshotQuery.data;
  const board = snapshot?.board as BoardRecord | undefined;
  const columns = ((snapshot?.columns ?? []) as ColumnRecord[]).slice().sort((a, b) => a.position - b.position);
  const entries = (snapshot?.entries ?? []) as EntryRecord[];

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (activeType !== "all" && entry.entryType !== activeType) {
        return false;
      }

      if (!searchTerm.trim()) {
        return true;
      }

      const haystack = [entry.title, entry.summary ?? "", entry.tags ?? "", buildEntryPreview(entry.content, entry.summary)]
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchTerm.trim().toLowerCase());
    });
  }, [activeType, entries, searchTerm]);

  const entriesByColumn = useMemo(() => {
    const map = new Map<number, EntryRecord[]>();

    columns.forEach((column) => map.set(column.id, []));

    filteredEntries.forEach((entry) => {
      const bucket = map.get(entry.columnId);
      if (bucket) {
        bucket.push(entry);
      }
    });

    map.forEach((bucket) => bucket.sort((a, b) => a.position - b.position));

    return map;
  }, [columns, filteredEntries]);

  const openCreateCard = (columnId: number, entryType: CommonplaceTypeValue = activeType === "all" ? "research_note" : activeType) => {
    setEditor({
      ...emptyEditorState(),
      open: true,
      boardId: board?.id ?? null,
      columnId,
      entryType,
    });
  };

  const handleSaveCard = () => {
    if (!editor.boardId || !editor.columnId || !editor.title.trim()) {
      return;
    }

    const payload = {
      boardId: editor.boardId,
      columnId: editor.columnId,
      entryType: editor.entryType,
      title: editor.title.trim(),
      summary: editor.summary.trim() || undefined,
      tags: editor.tags.trim() || undefined,
      content: buildContentPayload(editor),
    };

    if (editor.id) {
      updateEntryMutation.mutate({
        id: editor.id,
        columnId: editor.columnId,
        entryType: editor.entryType,
        title: editor.title.trim(),
        summary: editor.summary.trim() || undefined,
        tags: editor.tags.trim() || undefined,
        content: buildContentPayload(editor),
      });
      return;
    }

    createEntryMutation.mutate(payload);
  };

  const handleDropIntoColumn = (columnId: number) => {
    if (!draggedEntryId) {
      return;
    }

    const destinationLength = entriesByColumn.get(columnId)?.length ?? 0;
    moveEntryMutation.mutate({ id: draggedEntryId, columnId, position: destinationLength });
    setDraggedEntryId(null);
  };

  const handleCreateColumn = () => {
    if (!board?.id) {
      return;
    }

    const title = window.prompt("Name the new column", "Workbench");
    if (!title?.trim()) {
      return;
    }

    createColumnMutation.mutate({ boardId: board.id, title: title.trim() });
  };

  const handleSaveBoard = () => {
    if (!board?.id) {
      return;
    }

    const title = window.prompt("Save this working board as", `${board.title} Snapshot`);
    if (!title?.trim()) {
      return;
    }

    saveBoardMutation.mutate({
      sourceBoardId: board.id,
      title: title.trim(),
      description: `Snapshot saved from ${board.title}`,
    });
  };

  const totalVisibleEntries = filteredEntries.length;

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#f4f0eb] px-6 py-8 text-slate-900 shadow-[0_30px_90px_rgba(15,23,42,0.28)] sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(29,143,255,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(224,79,47,0.18),transparent_32%)]" />
        <div className="relative space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
                Commonplace Workspace · Storyboard, markdown, mood board, bookmarks, and lists
              </p>
              <h1 className="max-w-4xl text-[clamp(2.8rem,7vw,5.9rem)] font-serif leading-[0.92] tracking-[-0.04em] text-slate-950">
                Remember everything. Shape it on cards.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                This fresh interface turns your commonplace practice into a working wall: every research note, quote,
                book, glossary term, list, article, bookmark, and idea lives as a movable card with its own visual identity.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleSaveBoard}
                disabled={!board || saveBoardMutation.isPending}
                className="h-11 rounded-full border border-slate-300 bg-white px-5 text-slate-900 shadow-none hover:bg-slate-100"
              >
                <Save className="mr-2 h-4 w-4" />
                Save board
              </Button>
              <Button
                onClick={handleCreateColumn}
                disabled={!board || createColumnMutation.isPending}
                className="h-11 rounded-full bg-slate-950 px-5 text-white shadow-none hover:bg-slate-800"
              >
                <Plus className="mr-2 h-4 w-4" />
                New column
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span>All your</span>
            {commonplaceTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setActiveType((current) => (current === type.value ? "all" : type.value))}
                className="content-chip rounded-full px-4 py-1.5 transition"
                data-tone={type.value}
                style={{
                  background: activeType === type.value ? type.softAccent : undefined,
                }}
              >
                {type.shortLabel.toLowerCase()}
              </button>
            ))}
            <span>in one drafting wall.</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search titles, tags, summaries, and fragments"
                className="h-12 rounded-full border-slate-300 bg-white pl-11 text-slate-900 shadow-none"
              />
            </div>
            <Card className="rounded-[1.35rem] border-slate-300 bg-white/75 px-4 py-3 shadow-none">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Visible cards</p>
                  <p className="mt-1 text-3xl font-semibold text-slate-950">{totalVisibleEntries}</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-950/5 p-3">
                  <GripVertical className="h-5 w-5 text-slate-700" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Boards</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {boards.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => setSelectedBoardId(candidate.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${candidate.id === (board?.id ?? selectedBoardId) ? "border-slate-950 bg-slate-950 text-white" : "border-border bg-background text-foreground hover:bg-muted"}`}
                >
                  {candidate.title}
                  {candidate.isDefault ? " · Drafting" : ""}
                </button>
              ))}
            </div>
          </div>
          {board ? (
            <div className="max-w-md text-right text-sm leading-6 text-muted-foreground">
              <p className="font-medium text-foreground">{board.title}</p>
              <p>{board.description || "A fresh drafting surface for your knowledge cards."}</p>
            </div>
          ) : null}
        </div>

        <ScrollArea className="w-full whitespace-nowrap rounded-[1.75rem] border border-border/60 bg-background/85 p-4">
          <div className="flex min-h-[62vh] gap-4 pb-2">
            {columns.map((column) => {
              const columnEntries = entriesByColumn.get(column.id) ?? [];
              const matchingType = commonplaceTypes.find((type) => type.colorToken === (column.colorToken ?? ""));

              return (
                <div
                  key={column.id}
                  className="flex w-[22rem] shrink-0 flex-col rounded-[1.6rem] border border-border/70 bg-card/80 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDropIntoColumn(column.id)}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-card-foreground">{column.title}</h2>
                        <Badge variant="outline" className="rounded-full px-2.5 py-0.5">
                          {columnEntries.length}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {matchingType ? `${matchingType.label} rhythm` : "Flexible lane"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCreateCard(column.id)}
                      className="rounded-full border border-border bg-background p-2 transition hover:bg-muted"
                    >
                      <Plus className="h-4 w-4 text-foreground" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {columnEntries.map((entry) => {
                      const config = getCommonplaceTypeConfig(entry.entryType);
                      const Icon = iconMap[entry.entryType];

                      return (
                        <button
                          key={entry.id}
                          type="button"
                          draggable
                          onDragStart={() => setDraggedEntryId(entry.id)}
                          onDragEnd={() => setDraggedEntryId(null)}
                          onClick={() => setEditor(deriveEditorState(entry))}
                          className="content-surface w-full rounded-[1.35rem] px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_18px_35px_rgba(15,23,42,0.14)]"
                          data-tone={entry.entryType}
                          style={{
                            background: `linear-gradient(180deg, ${config.softAccent}, rgba(255,255,255,0.88))`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span
                                  className="content-chip inline-flex items-center gap-1 px-2.5 py-1 text-[11px]"
                                  data-tone={entry.entryType}
                                  style={{ background: "rgba(255,255,255,0.75)" }}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                  {config.shortLabel}
                                </span>
                                {entry.tags ? <span className="text-xs text-slate-500">{entry.tags}</span> : null}
                              </div>
                              <h3 className="line-clamp-2 text-base font-semibold text-slate-950">{entry.title}</h3>
                            </div>
                            <GripVertical className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                          </div>
                          <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">
                            {buildEntryPreview(entry.content, entry.summary)}
                          </p>
                        </button>
                      );
                    })}

                    <Card className="rounded-[1.35rem] border border-dashed border-border bg-muted/30 p-4 shadow-none">
                      <button
                        type="button"
                        onClick={() => openCreateCard(column.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-[1rem] py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                      >
                        <Plus className="h-4 w-4" />
                        Add a card to {column.title}
                      </button>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </section>

      <Dialog open={editor.open} onOpenChange={(open) => setEditor((current) => ({ ...current, open }))}>
        <DialogContent className="max-h-[88vh] overflow-y-auto border-border bg-[#fbf8f3] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold tracking-tight text-slate-950">
              {editor.id ? "Edit card" : "Create card"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-slate-600">
              Each card is a single commonplace entry with its own content type, editing rhythm, and visual accent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {commonplaceTypes.map((type) => {
                const Icon = iconMap[type.value];
                const active = editor.entryType === type.value;

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setEditor((current) => ({ ...current, entryType: type.value }))}
                    className="content-chip rounded-full px-3 py-2 text-sm transition"
                    data-tone={type.value}
                    style={{
                      background: active ? type.softAccent : undefined,
                    }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-900">Title</label>
                <Input
                  value={editor.title}
                  onChange={(event) => setEditor((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Name the card with a phrase you will recognize later"
                  className="border-slate-300 bg-white text-slate-900"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-900">Summary</label>
                <Textarea
                  value={editor.summary}
                  onChange={(event) => setEditor((current) => ({ ...current, summary: event.target.value }))}
                  placeholder="What makes this fragment worth preserving?"
                  rows={3}
                  className="border-slate-300 bg-white text-slate-900"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-900">Tags</label>
                <Input
                  value={editor.tags}
                  onChange={(event) => setEditor((current) => ({ ...current, tags: event.target.value }))}
                  placeholder="comma, separated, tags"
                  className="border-slate-300 bg-white text-slate-900"
                />
              </div>
            </div>

            {editor.entryType === "bookmark" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-900">URL</label>
                  <Input
                    value={editor.sourceUrl}
                    onChange={(event) => setEditor((current) => ({ ...current, sourceUrl: event.target.value }))}
                    placeholder="https://"
                    className="border-slate-300 bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-900">Label or source</label>
                  <Input
                    value={editor.sourceLabel}
                    onChange={(event) => setEditor((current) => ({ ...current, sourceLabel: event.target.value }))}
                    placeholder="Publication, archive, or why this matters"
                    className="border-slate-300 bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-900">Annotation</label>
                  <Textarea
                    value={editor.markdown}
                    onChange={(event) => setEditor((current) => ({ ...current, markdown: event.target.value }))}
                    placeholder="Why did you save this bookmark?"
                    rows={6}
                    className="border-slate-300 bg-white text-slate-900"
                  />
                </div>
              </div>
            ) : editor.entryType === "list" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">List items</label>
                <Textarea
                  value={editor.listItems}
                  onChange={(event) => setEditor((current) => ({ ...current, listItems: event.target.value }))}
                  placeholder={"One item per line\nAnother item\nAnother item"}
                  rows={8}
                  className="border-slate-300 bg-white text-slate-900"
                />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-900">
                    {editor.entryType === "quote"
                      ? "Quote text"
                      : editor.entryType === "glossary_term"
                        ? "Definition or body"
                        : editor.entryType === "article"
                          ? "Abstract or synthesis"
                          : editor.entryType === "book"
                            ? "Notes"
                            : "Markdown body"}
                  </label>
                  <Textarea
                    value={editor.markdown}
                    onChange={(event) => setEditor((current) => ({ ...current, markdown: event.target.value }))}
                    placeholder="Draft in markdown, capture fragments, or shape the card into a polished record."
                    rows={10}
                    className="border-slate-300 bg-white font-mono text-sm text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">
                    {editor.entryType === "book"
                      ? "Status"
                      : editor.entryType === "article"
                        ? "Publication"
                        : editor.entryType === "quote"
                          ? "Source"
                          : editor.entryType === "glossary_term"
                            ? "Aliases"
                            : "Context"}
                  </label>
                  <Input
                    value={editor.sourceLabel}
                    onChange={(event) => setEditor((current) => ({ ...current, sourceLabel: event.target.value }))}
                    placeholder="Add the source, context, or editorial frame"
                    className="border-slate-300 bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">
                    {editor.entryType === "book"
                      ? "Author"
                      : editor.entryType === "article"
                        ? "Author"
                        : editor.entryType === "quote"
                          ? "Location"
                          : editor.entryType === "glossary_term"
                            ? "Etymology"
                            : "Reference"}
                  </label>
                  <Input
                    value={editor.secondaryText}
                    onChange={(event) => setEditor((current) => ({ ...current, secondaryText: event.target.value }))}
                    placeholder="Optional metadata to anchor recall"
                    className="border-slate-300 bg-white text-slate-900"
                  />
                </div>
                {editor.entryType === "article" ? (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-900">URL</label>
                    <Input
                      value={editor.sourceUrl}
                      onChange={(event) => setEditor((current) => ({ ...current, sourceUrl: event.target.value }))}
                      placeholder="https://"
                      className="border-slate-300 bg-white text-slate-900"
                    />
                  </div>
                ) : null}
              </div>
            )}

            {editor.id ? (
              <InsightPanel
                module="commonplace"
                recordId={editor.id}
                sourceTitle={editor.title || "Untitled commonplace card"}
                compact
              />
            ) : null}
          </div>

          <DialogFooter className="mt-6 flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <div className="flex gap-2">
              {editor.id ? (
                <Button
                  variant="outline"
                  onClick={() => deleteEntryMutation.mutate({ id: editor.id! })}
                  disabled={deleteEntryMutation.isPending}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditor(emptyEditorState())}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveCard}
                disabled={createEntryMutation.isPending || updateEntryMutation.isPending || !editor.title.trim()}
                className="bg-slate-950 text-white hover:bg-slate-800"
              >
                {editor.id ? "Save changes" : "Create card"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { v4 as uuidv4 } from "uuid";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import CategorySelect from "@/components/CategorySelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Bot,
  ChevronRight,
  FileText,
  Library,
  Link2,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { buildLexiconReferenceInsert, buildNotebookReferenceInsert } from "@shared/pkmFormatting";
import {
  defaultSemanticLinkPresetByTarget,
  formatSemanticLinkDisplay,
  formatSemanticLinkLabel,
  semanticLinkPresets,
  type SemanticLinkPresetKey,
} from "@shared/linkSemantics";

const statusColors: Record<string, string> = {
  draft: "#efb93a",
  in_progress: "#56c5ea",
  completed: "#bfd73d",
  archived: "#b55af3",
};

type ReferenceMode = "notebook" | "lexicon";

type InsertableReference = {
  id: number;
  title: string;
  preview: string;
  type: "notebook" | "lexicon";
  insertText: string;
};

export default function Documents() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [referenceMode, setReferenceMode] = useState<ReferenceMode>("notebook");
  const [referenceSearch, setReferenceSearch] = useState("");
  const [selectedRelationship, setSelectedRelationship] = useState<SemanticLinkPresetKey>("supports");
  const [editContent, setEditContent] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<Message[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    project: "",
    folder: "",
    status: "draft" as const,
    categoryId: undefined as number | undefined,
  });

  const { data: documents, isLoading, refetch } = trpc.documents.list.useQuery({
    status: undefined,
  });
  const { data: taxonomyTree } = trpc.taxonomy.getTree.useQuery();
  const { data: selectedDoc } = trpc.documents.get.useQuery(
    { id: selectedDocId! },
    { enabled: selectedDocId !== null }
  );
  const { data: notebookEntries } = trpc.notebook.list.useQuery({
    search: referenceSearch || undefined,
    sortBy: "recent",
  });
  const { data: lexiconEntries } = trpc.lexicon.list.useQuery({
    search: referenceSearch || undefined,
  });
  const { data: linkedReferences } = trpc.documents.linkedReferences.useQuery(
    { id: selectedDocId! },
    { enabled: selectedDocId !== null }
  );

  useEffect(() => {
    if (selectedDoc) {
      setEditContent(selectedDoc.content || "");
    }
  }, [selectedDoc?.id, selectedDoc?.content]);

  useEffect(() => {
    setAssistantMessages([]);
  }, [selectedDocId]);

  useEffect(() => {
    setSelectedRelationship(defaultSemanticLinkPresetByTarget[referenceMode]);
  }, [referenceMode]);

  const createMutation = trpc.documents.create.useMutation({
    onSuccess: () => {
      refetch();
      setFormData({
        title: "",
        project: "",
        folder: "",
        status: "draft",
        categoryId: undefined,
      });
      setShowForm(false);
    },
  });

  const updateMutation = trpc.documents.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        refetch(),
        selectedDocId ? utils.documents.get.invalidate({ id: selectedDocId }) : Promise.resolve(),
      ]);
    },
  });

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedDocId(null);
      setEditContent("");
      setAssistantMessages([]);
    },
  });

  const createLinkMutation = trpc.links.create.useMutation({
    onSuccess: async () => {
      if (selectedDocId) {
        await Promise.all([
          utils.links.list.invalidate({ sourceType: "document", sourceId: selectedDocId }),
          utils.documents.linkedReferences.invalidate({ id: selectedDocId }),
        ]);
      }
    },
  });

  const researchMutation = trpc.documents.researchAssist.useMutation({
    onSuccess: (result) => {
      setAssistantMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.response,
        },
      ]);
    },
    onError: (error) => {
      setAssistantMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `I couldn’t complete that research pass. ${error.message}`,
        },
      ]);
    },
  });

  const filteredDocs = documents?.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const notebookReferences = useMemo<InsertableReference[]>(
    () =>
      (notebookEntries || []).slice(0, 8).map((entry) => ({
        id: entry.id,
        title: entry.author ? `${entry.author}${entry.work ? ` — ${entry.work}` : ""}` : entry.work || "Notebook entry",
        preview: entry.text,
        type: "notebook",
        insertText: buildNotebookReferenceInsert({
          text: entry.text,
          author: entry.author,
          work: entry.work,
          note: entry.note,
        }),
      })),
    [notebookEntries]
  );

  const lexiconReferences = useMemo<InsertableReference[]>(
    () =>
      (lexiconEntries || []).slice(0, 8).map((entry) => ({
        id: entry.id,
        title: entry.term,
        preview: entry.definition || entry.notes || "No definition available.",
        type: "lexicon",
        insertText: buildLexiconReferenceInsert({
          term: entry.term,
          partOfSpeech: entry.partOfSpeech,
          definition: entry.definition,
          notes: entry.notes,
        }),
      })),
    [lexiconEntries]
  );

  const activeReferences = referenceMode === "notebook" ? notebookReferences : lexiconReferences;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    createMutation.mutate({
      ...formData,
      uuid: uuidv4(),
    });
  };

  const handleSaveContent = () => {
    if (!selectedDocId) return;

    updateMutation.mutate({
      id: selectedDocId,
      content: editContent,
    });
  };

  const handleInsertReference = async (reference: InsertableReference) => {
    if (!selectedDocId) return;

    setEditContent((current) => `${current.trim()}${current.trim() ? "\n\n" : ""}${reference.insertText}`);

    await createLinkMutation.mutateAsync({
      sourceType: "document",
      sourceId: selectedDocId,
      targetType: reference.type,
      targetId: reference.id,
      linkType: selectedRelationship,
    });
  };

  const handleResearchPrompt = (content: string) => {
    if (!selectedDocId) return;

    const nextMessages: Message[] = [
      ...assistantMessages,
      {
        role: "user",
        content,
      },
    ];

    setAssistantMessages(nextMessages);
    researchMutation.mutate({
      documentId: selectedDocId,
      messages: nextMessages.map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })),
    });
  };

  return (
    <div className="grid min-h-[calc(100vh-9rem)] gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <aside className="dev-card flex min-h-[40rem] flex-col overflow-hidden rounded-[1.6rem] p-0 shadow-none">
        <div className="border-b-2 border-black bg-[#116d6d] px-5 py-5 text-white">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Module 03</p>
              <h2 className="mt-1 text-[2rem] leading-none text-white">Research Studio</h2>
            </div>
            <Button
              size="sm"
              onClick={() => setShowForm((current) => !current)}
              className="h-10 rounded-full border-2 border-black bg-white px-4 text-black shadow-none hover:bg-[#f6f3ec]"
            >
              <Plus className="mr-1 h-4 w-4" />
              New
            </Button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
            <Input
              placeholder="Search documents"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 rounded-full border-2 border-black/70 bg-white pl-11 text-black shadow-none placeholder:text-black/45"
            />
          </div>
        </div>

        {showForm && (
          <div className="border-b border-black/10 bg-[#f6f3ec] p-4">
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Document title"
                className="rounded-full border-2 border-black/85 bg-white shadow-none"
                required
              />
              <Input
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                placeholder="Project"
                className="rounded-full border-2 border-black/85 bg-white shadow-none"
              />
              <Input
                value={formData.folder}
                onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                placeholder="Folder"
                className="rounded-full border-2 border-black/85 bg-white shadow-none"
              />
              <CategorySelect
                label="Johnny Decimal category"
                value={formData.categoryId}
                tree={taxonomyTree}
                placeholder="Assign this document to a seeded writing category"
                onChange={(categoryId) => setFormData({ ...formData, categoryId })}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="h-10 rounded-full border-2 border-black bg-[#e25b33] px-4 text-white shadow-none hover:bg-[#d6522d]"
                >
                  Create document
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  className="h-10 rounded-full border-2 border-black bg-white px-4 text-black shadow-none hover:bg-white"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-muted-foreground">Loading documents…</div>
          ) : filteredDocs && filteredDocs.length > 0 ? (
            <div className="space-y-3">
              {filteredDocs.map((doc, index) => {
                const active = selectedDocId === doc.id;
                const statusColor = statusColors[doc.status || "draft"] || "#efb93a";

                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full overflow-hidden rounded-[1.2rem] border-2 border-black bg-white text-left shadow-none transition ${active ? "-translate-y-0.5" : "hover:-translate-y-0.5"}`}
                  >
                    <div
                      className={`${index % 3 === 0 ? "dev-pattern-waves" : index % 3 === 1 ? "dev-pattern-dots" : "dev-pattern-diamonds"} flex items-center justify-between px-4 py-3`}
                      style={{ backgroundColor: active ? statusColor : "#f6f3ec" }}
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-black">
                        {doc.project || "Writing project"}
                      </span>
                      <ChevronRight className="h-4 w-4 text-black" />
                    </div>
                    <div className="space-y-2 px-4 py-4">
                      <p className="text-xl font-bold leading-tight text-foreground">{doc.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        <span>{doc.folder || "General"}</span>
                        <span>•</span>
                        <span>{(doc.status || "draft").replace("_", " ")}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.2rem] border border-black/10 bg-white p-5 text-sm leading-6 text-muted-foreground">
              No documents yet. Create your first research file to begin writing inside the studio.
            </div>
          )}
        </div>
      </aside>

      <section className="grid gap-6 lg:grid-rows-[auto_minmax(0,1fr)]">
        {selectedDocId && selectedDoc ? (
          <>
            <div className="dev-soft-card flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Editorial document</p>
                <h1 className="text-[3rem] leading-none">{selectedDoc.title}</h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedDoc.project && <span className="dev-chip">{selectedDoc.project}</span>}
                  {selectedDoc.folder && <span className="dev-chip">{selectedDoc.folder}</span>}
                  <span className="dev-chip">{(selectedDoc.status || "draft").replace("_", " ")}</span>
                  <span className="dev-chip">{linkedReferences?.length || 0} linked sources</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSaveContent}
                  disabled={updateMutation.isPending}
                  className="h-11 rounded-full border-2 border-black bg-[#116d6d] px-5 text-white shadow-none hover:bg-[#0f5959]"
                >
                  {updateMutation.isPending ? "Saving..." : "Save draft"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => deleteMutation.mutate({ id: selectedDocId })}
                  className="h-11 rounded-full border-2 border-black bg-white px-5 text-[#e25b33] shadow-none hover:bg-[#fff1eb]"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="grid min-h-[32rem] gap-6 2xl:grid-cols-[minmax(0,1fr)_24rem_24rem] xl:grid-cols-[minmax(0,1fr)_23rem]">
              <Card className="dev-card rounded-[1.6rem] p-0 shadow-none">
                <div className="border-b-2 border-black px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Markdown editor</p>
                </div>
                <div className="space-y-4 p-5">
                  <div className="rounded-[1.2rem] border border-black/10 bg-[#f6f3ec] p-4 text-sm leading-6 text-muted-foreground">
                    Draft with your document on the left, pull structured references from notebook or Clavis Aurea on the right, and use the assistant to synthesize what is already linked into this file.
                  </div>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Write your document in Markdown..."
                    className="min-h-[28rem] w-full resize-none rounded-[1.3rem] border-2 border-black/85 bg-white font-mono text-sm leading-7 shadow-none"
                  />
                </div>
              </Card>

              <aside className="space-y-6">
                <Card className="dev-card rounded-[1.6rem] p-5 shadow-none">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#56c5ea]">
                      <Link2 className="h-5 w-5 text-black" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Reference lane</p>
                      <p className="text-lg font-semibold text-foreground">Inline source pulling</p>
                    </div>
                  </div>

                  <div className="mb-4 flex gap-2">
                    <button
                      onClick={() => setReferenceMode("notebook")}
                      className={`flex-1 rounded-full border-2 border-black px-3 py-2 text-sm font-semibold transition ${referenceMode === "notebook" ? "bg-[#efb93a] text-black" : "bg-white text-black hover:bg-[#f6f3ec]"}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <BookOpen className="h-4 w-4" /> Notebook
                      </span>
                    </button>
                    <button
                      onClick={() => setReferenceMode("lexicon")}
                      className={`flex-1 rounded-full border-2 border-black px-3 py-2 text-sm font-semibold transition ${referenceMode === "lexicon" ? "bg-[#56c5ea] text-black" : "bg-white text-black hover:bg-[#f6f3ec]"}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Library className="h-4 w-4" /> Lexicon
                      </span>
                    </button>
                  </div>

                  <div className="mb-4 space-y-3">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Relationship meaning</p>
                      <div className="grid gap-2">
                        {semanticLinkPresets.map((preset) => {
                          const selected = selectedRelationship === preset.key;
                          return (
                            <button
                              key={preset.key}
                              type="button"
                              onClick={() => setSelectedRelationship(preset.key)}
                              className={`rounded-[1rem] border px-3 py-3 text-left transition ${selected ? "border-black bg-[#f6f3ec]" : "border-black/10 bg-white hover:border-black/40"}`}
                            >
                              <p className="font-semibold text-foreground">{formatSemanticLinkLabel(preset.key)}</p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">{preset.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={`Search ${referenceMode === "notebook" ? "notebook" : "Clavis Aurea"} references`}
                        value={referenceSearch}
                        onChange={(e) => setReferenceSearch(e.target.value)}
                        className="h-11 rounded-full border-2 border-black/85 bg-white pl-10 shadow-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {activeReferences.length > 0 ? (
                      activeReferences.map((reference, index) => (
                        <div key={`${reference.type}-${reference.id}`} className="overflow-hidden rounded-[1.2rem] border-2 border-black bg-white">
                          <div
                            className={`${index % 2 === 0 ? "dev-pattern-dots" : "dev-pattern-waves"} h-4 w-full`}
                            style={{ backgroundColor: reference.type === "notebook" ? "#efb93a" : "#56c5ea" }}
                          />
                          <div className="space-y-3 p-4">
                            <div>
                              <p className="text-base font-bold leading-tight text-foreground">{reference.title}</p>
                              <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{reference.preview}</p>
                            </div>
                            <Button
                              type="button"
                              onClick={() => void handleInsertReference(reference)}
                              className="h-10 w-full rounded-full border-2 border-black bg-white text-black shadow-none hover:bg-[#f6f3ec]"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Insert as {formatSemanticLinkLabel(selectedRelationship)}
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.1rem] border border-black/10 bg-[#f6f3ec] p-4 text-sm leading-6 text-muted-foreground">
                        No references match the current search. Try another keyword or switch source panels.
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="dev-card rounded-[1.6rem] p-5 shadow-none">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Linked references</p>
                      <p className="text-lg font-semibold text-foreground">Working context already attached</p>
                    </div>
                    <span className="rounded-full border border-black/15 bg-[#f6f3ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {linkedReferences?.length || 0} items
                    </span>
                  </div>

                  <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                    {linkedReferences && linkedReferences.length > 0 ? (
                      linkedReferences.slice(0, 8).map((link) => (
                        <div key={link.id} className="rounded-[1.1rem] border border-black/10 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-foreground">{link.targetTitle}</p>
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                {formatSemanticLinkDisplay(link.linkType, link.targetType)}
                              </p>
                            </div>
                            <span className="rounded-full border border-black/15 bg-[#f6f3ec] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              {link.targetType}
                            </span>
                          </div>
                          {link.targetMetadata ? (
                            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">{link.targetMetadata}</p>
                          ) : null}
                          <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">{link.targetPreview}</p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setLocation(link.targetHref)}
                            className="mt-3 h-9 w-full rounded-full border-2 border-black bg-white text-black shadow-none hover:bg-[#f6f3ec]"
                          >
                            Open linked source
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.1rem] border border-black/10 bg-[#f6f3ec] p-4">
                        Insert a notebook excerpt or Clavis Aurea term to create a richer contextual lane for this document.
                      </div>
                    )}
                  </div>
                </Card>
              </aside>

              <aside className="space-y-6 xl:col-span-1 2xl:col-span-1">
                <Card className="dev-card rounded-[1.6rem] p-5 shadow-none">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#bfd73d]">
                      <Bot className="h-5 w-5 text-black" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Research assistant</p>
                      <p className="text-lg font-semibold text-foreground">Interrogate the draft in context</p>
                    </div>
                  </div>
                  <div className="mb-4 rounded-[1.1rem] border border-black/10 bg-[#f6f3ec] p-4 text-sm leading-6 text-muted-foreground">
                    The assistant sees the current draft and up to eight linked references, so it can help outline arguments, compare sources, or identify missing evidence.
                  </div>
                  <AIChatBox
                    messages={assistantMessages}
                    onSendMessage={handleResearchPrompt}
                    isLoading={researchMutation.isPending}
                    height="34rem"
                    className="border-2 border-black shadow-none"
                    placeholder="Ask the assistant to synthesize, outline, compare, or critique this draft..."
                    emptyStateMessage="Ask for an outline, counterargument, synthesis, or evidence gap analysis."
                    suggestedPrompts={[
                      "Summarize the argument emerging from this draft and the linked sources.",
                      "Identify the strongest tension or contradiction across the linked references.",
                      "Propose a tighter outline for this piece using the current document and references.",
                    ]}
                  />
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.1rem] border border-black/10 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Context loaded</p>
                      <p className="mt-2 text-2xl font-bold text-foreground">{linkedReferences?.length || 0}</p>
                      <p className="mt-1 text-sm text-muted-foreground">linked sources available to the assistant</p>
                    </div>
                    <div className="rounded-[1.1rem] border border-black/10 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Draft state</p>
                      <p className="mt-2 inline-flex items-center gap-2 text-2xl font-bold text-foreground">
                        <Sparkles className="h-5 w-5 text-[#116d6d]" />
                        {(selectedDoc.status || "draft").replace("_", " ")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">document status reflected in the AI context packet</p>
                    </div>
                  </div>
                </Card>
              </aside>
            </div>
          </>
        ) : (
          <div className="dev-soft-card flex min-h-[32rem] flex-col items-center justify-center p-8 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-black bg-[#56c5ea]">
              <FileText className="h-7 w-7 text-black" />
            </div>
            <h1 className="mb-3 text-[3rem] leading-none">Select a document</h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              Choose a project draft from the left panel, or create a new document to begin writing inside the Devanomy research studio.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="mt-6 h-11 rounded-full border-2 border-black bg-[#e25b33] px-5 text-white shadow-none hover:bg-[#d6522d]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create new document
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { toast as sonnerToast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CategorySelect from "@/components/CategorySelect";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Lightbulb,
  Link2,
  Orbit,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  X,
  Library,
} from "lucide-react";

const ideaStatuses = [
  { value: "seed", label: "Seed", tone: "bg-[#56c5ea] text-black" },
  { value: "germinating", label: "Germinating", tone: "bg-[#bfd73d] text-black" },
  { value: "incubating", label: "Incubating", tone: "bg-[#efb93a] text-black" },
  { value: "developed", label: "Developed", tone: "bg-[#116d6d] text-white" },
  { value: "archived", label: "Archived", tone: "bg-[#d7d0c3] text-black" },
] as const;

const sparkTypes = [
  { value: "question", label: "Question", hint: "A live inquiry that still needs pressure and evidence." },
  { value: "theme", label: "Theme", hint: "A recurring pattern or motif emerging across your archive." },
  { value: "argument", label: "Argument", hint: "A claim or thesis that could become a draft or lesson." },
  { value: "framework", label: "Framework", hint: "A conceptual scaffold that organizes multiple notes or sources." },
  { value: "experiment", label: "Experiment", hint: "A speculative move to test through writing, teaching, or research." },
] as const;

const insightStages = [
  { value: "capture", label: "Capture" },
  { value: "connection", label: "Connection" },
  { value: "synthesis", label: "Synthesis" },
  { value: "expression", label: "Expression" },
] as const;

const sourceModules = [
  { value: "manual", label: "Manual" },
  { value: "notebook", label: "Notebook" },
  { value: "lexicon", label: "Lexicon" },
  { value: "documents", label: "Documents" },
  { value: "goals", label: "Goals" },
] as const;

const dikwTiers = ["data", "information", "knowledge", "wisdom"] as const;
const linkedEntryTypes = ["notebook", "lexicon", "document"] as const;

type IdeaStatus = (typeof ideaStatuses)[number]["value"];
type SparkType = (typeof sparkTypes)[number]["value"];
type InsightStage = (typeof insightStages)[number]["value"];
type SourceModule = (typeof sourceModules)[number]["value"];
type DikwTier = (typeof dikwTiers)[number];
type LinkedEntryType = (typeof linkedEntryTypes)[number];

type LinkedEntryReference = {
  type: LinkedEntryType;
  id: number;
};

type LinkedEntryOption = LinkedEntryReference & {
  title: string;
  preview: string;
};

type IdeaRecord = {
  id: number;
  title: string;
  summary?: string | null;
  status?: string | null;
  dikwTier?: string | null;
  sparkType?: string | null;
  sourceModule?: string | null;
  insightStage?: string | null;
  tags?: string | null;
  categoryId?: number | null;
  linkedGoalId?: number | null;
  linkedEntries?: string | null;
};

type IdeaFormState = {
  title: string;
  summary: string;
  status: IdeaStatus;
  dikwTier: DikwTier;
  sparkType: SparkType;
  sourceModule: SourceModule;
  insightStage: InsightStage;
  tags: string;
  linkedEntries: LinkedEntryReference[];
  categoryId: number | undefined;
  linkedGoalId: number | undefined;
};

const statusClassMap: Record<IdeaStatus, string> = {
  seed: "bg-[#56c5ea] text-black",
  germinating: "bg-[#bfd73d] text-black",
  incubating: "bg-[#efb93a] text-black",
  developed: "bg-[#116d6d] text-white",
  archived: "bg-[#d7d0c3] text-black",
};

const dikwClassMap: Record<DikwTier, string> = {
  data: "bg-[#d8eef8] text-[#0b5a7a]",
  information: "bg-[#fde6c9] text-[#91510d]",
  knowledge: "bg-[#f8d8d8] text-[#8e2f2f]",
  wisdom: "bg-[#e9dcfb] text-[#5b2aa7]",
};

function parseLinkedEntries(value?: string | null): LinkedEntryReference[] {
  if (!value?.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const type = (item as { type?: unknown }).type;
        const id = (item as { id?: unknown }).id;
        if (!linkedEntryTypes.includes(type as LinkedEntryType)) return null;
        if (typeof id !== "number" || Number.isNaN(id)) return null;
        return { type: type as LinkedEntryType, id };
      })
      .filter((item): item is LinkedEntryReference => Boolean(item));
  } catch {
    return [];
  }
}

function serializeLinkedEntries(entries: LinkedEntryReference[]): string {
  return JSON.stringify(entries);
}

function createIdeaFormState(idea?: IdeaRecord): IdeaFormState {
  return {
    title: idea?.title ?? "",
    summary: idea?.summary ?? "",
    status: (idea?.status as IdeaStatus | undefined) ?? "seed",
    dikwTier: (idea?.dikwTier as DikwTier | undefined) ?? "knowledge",
    sparkType: (idea?.sparkType as SparkType | undefined) ?? "theme",
    sourceModule: (idea?.sourceModule as SourceModule | undefined) ?? "manual",
    insightStage: (idea?.insightStage as InsightStage | undefined) ?? "capture",
    tags: idea?.tags ?? "",
    linkedEntries: parseLinkedEntries(idea?.linkedEntries),
    categoryId: idea?.categoryId ?? undefined,
    linkedGoalId: idea?.linkedGoalId ?? undefined,
  };
}

function getLinkedEntryTypeLabel(type: LinkedEntryType): string {
  return type === "document" ? "Document" : type === "lexicon" ? "Lexicon" : "Notebook";
}

function getLinkedEntryTypeIcon(type: LinkedEntryType) {
  if (type === "document") return FileText;
  if (type === "lexicon") return Library;
  return BookOpen;
}

function describeLinkedEntryReference(reference: LinkedEntryReference): string {
  return `${getLinkedEntryTypeLabel(reference.type)} #${reference.id}`;
}

function IdeaEditor({
  mode,
  formData,
  setFormData,
  taxonomyTree,
  goals,
  onSubmit,
  onCancel,
  submitLabel,
  isPending,
}: {
  mode: "create" | "edit";
  formData: IdeaFormState;
  setFormData: React.Dispatch<React.SetStateAction<IdeaFormState>>;
  taxonomyTree: any;
  goals: Array<{ id: number; title: string }>;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
  isPending: boolean;
}) {
  const [pickerMode, setPickerMode] = useState<LinkedEntryType>("notebook");
  const [pickerSearch, setPickerSearch] = useState("");

  const { data: notebookPage } = trpc.notebook.list.useQuery({
    search: pickerMode === "notebook" ? pickerSearch || undefined : undefined,
    sortBy: "recent",
    page: 1,
    pageSize: 25,
  });
  const notebookEntries = notebookPage?.items ?? [];
  const { data: lexiconEntries = [] } = trpc.lexicon.list.useQuery({
    search: pickerMode === "lexicon" ? pickerSearch || undefined : undefined,
  });
  const { data: documents = [] } = trpc.documents.list.useQuery({
    status: undefined,
  });

  const selectedReferenceOptions = useMemo<LinkedEntryOption[]>(() => {
    const notebookMap = new Map(
      notebookEntries.map((entry) => [
        `notebook-${entry.id}`,
        {
          type: "notebook" as const,
          id: entry.id,
          title: entry.author ? `${entry.author}${entry.work ? ` — ${entry.work}` : ""}` : entry.work || "Notebook entry",
          preview: entry.text || entry.note || "Notebook quotation or note",
        },
      ])
    );

    const lexiconMap = new Map(
      lexiconEntries.map((entry) => [
        `lexicon-${entry.id}`,
        {
          type: "lexicon" as const,
          id: entry.id,
          title: entry.term,
          preview: entry.definition || entry.notes || "Lexicon term",
        },
      ])
    );

    const documentMap = new Map(
      documents.map((entry) => [
        `document-${entry.id}`,
        {
          type: "document" as const,
          id: entry.id,
          title: entry.title,
          preview: entry.content || entry.project || "Writing Studio document",
        },
      ])
    );

    return formData.linkedEntries.map((reference) => {
      const key = `${reference.type}-${reference.id}`;
      const resolved = notebookMap.get(key) || lexiconMap.get(key) || documentMap.get(key);
      return (
        resolved || {
          ...reference,
          title: describeLinkedEntryReference(reference),
          preview: "This linked record is already attached, but its current preview is not loaded in the picker results.",
        }
      );
    });
  }, [documents, formData.linkedEntries, lexiconEntries, notebookEntries]);

  const availableOptions = useMemo<LinkedEntryOption[]>(() => {
    const normalizedSearch = pickerSearch.trim().toLowerCase();

    if (pickerMode === "notebook") {
      return notebookEntries.slice(0, 8).map((entry) => ({
        type: "notebook",
        id: entry.id,
        title: entry.author ? `${entry.author}${entry.work ? ` — ${entry.work}` : ""}` : entry.work || "Notebook entry",
        preview: entry.text || entry.note || "Notebook quotation or note",
      }));
    }

    if (pickerMode === "lexicon") {
      return lexiconEntries.slice(0, 8).map((entry) => ({
        type: "lexicon",
        id: entry.id,
        title: entry.term,
        preview: entry.definition || entry.notes || "Lexicon term",
      }));
    }

    return documents
      .filter((entry) => {
        if (!normalizedSearch) return true;
        const haystack = `${entry.title} ${entry.project || ""} ${entry.folder || ""} ${entry.content || ""}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
      .slice(0, 8)
      .map((entry) => ({
        type: "document",
        id: entry.id,
        title: entry.title,
        preview: entry.project || entry.folder || entry.content || "Writing Studio document",
      }));
  }, [documents, lexiconEntries, notebookEntries, pickerMode, pickerSearch]);

  const addLinkedEntry = (option: LinkedEntryOption) => {
    setFormData((current) => {
      const exists = current.linkedEntries.some((entry) => entry.type === option.type && entry.id === option.id);
      if (exists) return current;
      return {
        ...current,
        linkedEntries: [...current.linkedEntries, { type: option.type, id: option.id }],
        sourceModule: current.sourceModule === "manual" ? (option.type === "document" ? "documents" : option.type) : current.sourceModule,
      };
    });
  };

  const removeLinkedEntry = (reference: LinkedEntryReference) => {
    setFormData((current) => ({
      ...current,
      linkedEntries: current.linkedEntries.filter((entry) => !(entry.type === reference.type && entry.id === reference.id)),
    }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Idea title *</label>
            <Input
              aria-label={`${mode === "create" ? "Create" : "Edit"} idea title`}
              value={formData.title}
              onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
              placeholder="Name the pattern, argument, or possibility you want to develop"
              className="rounded-full border-2 border-black/85 bg-white shadow-none"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Emerging synthesis</label>
            <Textarea
              aria-label={`${mode === "create" ? "Create" : "Edit"} idea summary`}
              value={formData.summary}
              onChange={(event) => setFormData((current) => ({ ...current, summary: event.target.value }))}
              placeholder="Capture the connective thread, tension, or claim taking shape across your notes, terms, and drafts."
              rows={6}
              className="rounded-[1.2rem] border-2 border-black/85 bg-white shadow-none"
            />
          </div>
          <CategorySelect
            label="Johnny Decimal category"
            value={formData.categoryId}
            tree={taxonomyTree}
            placeholder="Assign this idea to a synthesis category"
            onChange={(categoryId) => setFormData((current) => ({ ...current, categoryId }))}
          />
          <div className="rounded-[1.3rem] border border-black/10 bg-[#faf6fd] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <label className="block text-sm font-semibold text-foreground">Linked records</label>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Attach notebook excerpts, Clavis Aurea terms, and Writing Studio drafts without touching JSON. Selections are still saved in the existing structured link format behind the scenes.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6c26b0]">
                {formData.linkedEntries.length} linked
              </span>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="space-y-3 rounded-[1.2rem] border border-black/10 bg-white p-4">
                <div className="flex flex-wrap gap-2">
                  {linkedEntryTypes.map((type) => {
                    const Icon = getLinkedEntryTypeIcon(type);
                    return (
                      <button
                        key={`${mode}-${type}`}
                        type="button"
                        onClick={() => setPickerMode(type)}
                        className={`inline-flex items-center gap-2 rounded-full border-2 border-black px-3 py-2 text-sm font-semibold ${pickerMode === type ? "bg-[#b55af3] text-white" : "bg-white text-black hover:bg-[#f6f3ec]"}`}
                      >
                        <Icon className="h-4 w-4" />
                        {type === "document" ? "Documents" : getLinkedEntryTypeLabel(type)}
                      </button>
                    );
                  })}
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label={`${mode === "create" ? "Create" : "Edit"} linked record search`}
                    value={pickerSearch}
                    onChange={(event) => setPickerSearch(event.target.value)}
                    placeholder={`Search ${pickerMode === "document" ? "documents" : pickerMode}`}
                    className="h-11 rounded-full border-2 border-black/85 bg-white pl-10 shadow-none"
                  />
                </div>
                <div className="space-y-3">
                  {availableOptions.length > 0 ? (
                    availableOptions.map((option, index) => {
                      const Icon = getLinkedEntryTypeIcon(option.type);
                      const isSelected = formData.linkedEntries.some((entry) => entry.type === option.type && entry.id === option.id);
                      return (
                        <div key={`${option.type}-${option.id}`} className="overflow-hidden rounded-[1.2rem] border-2 border-black bg-white">
                          <div
                            className={`${index % 2 === 0 ? "dev-pattern-diamonds" : "dev-pattern-waves"} h-4 w-full`}
                            style={{
                              backgroundColor:
                                option.type === "notebook" ? "#efb93a" : option.type === "lexicon" ? "#56c5ea" : "#b55af3",
                            }}
                          />
                          <div className="space-y-3 p-4">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              <Icon className="h-4 w-4" />
                              {getLinkedEntryTypeLabel(option.type)}
                            </div>
                            <div>
                              <p className="text-base font-bold leading-tight text-foreground">{option.title}</p>
                              <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{option.preview}</p>
                            </div>
                            <Button
                              type="button"
                              aria-label={`Add ${getLinkedEntryTypeLabel(option.type).toLowerCase()} record ${option.id}`}
                              onClick={() => addLinkedEntry(option)}
                              disabled={isSelected}
                              className="h-10 w-full rounded-full border-2 border-black bg-white text-black shadow-none hover:bg-[#f6f3ec] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isSelected ? "Already linked" : "Add link"}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-[1.1rem] border border-black/10 bg-[#f6f3ec] p-4 text-sm leading-6 text-muted-foreground">
                      No {pickerMode === "document" ? "documents" : pickerMode} match the current search yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 rounded-[1.2rem] border border-black/10 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Orbit className="h-4 w-4" />
                  Selected references
                </div>
                {selectedReferenceOptions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedReferenceOptions.map((reference) => {
                      const Icon = getLinkedEntryTypeIcon(reference.type);
                      return (
                        <div key={`${reference.type}-${reference.id}`} className="rounded-[1.1rem] border border-black/10 bg-[#f6f3ec] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                <Icon className="h-4 w-4" />
                                {getLinkedEntryTypeLabel(reference.type)}
                              </div>
                              <p className="mt-2 text-sm font-semibold text-foreground">{reference.title}</p>
                              <p className="mt-2 text-sm leading-6 text-muted-foreground">{reference.preview}</p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              aria-label={`Remove ${getLinkedEntryTypeLabel(reference.type).toLowerCase()} record ${reference.id}`}
                              onClick={() => removeLinkedEntry(reference)}
                              className="rounded-full border-2 border-black bg-white text-black shadow-none hover:bg-[#fff]"
                            >
                              <X className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-[1.1rem] border border-dashed border-black/15 bg-[#faf8f4] p-4 text-sm leading-6 text-muted-foreground">
                    No linked records selected yet. Use the picker on the left to attach source notes, lexicon entries, or draft documents.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Status</label>
            <div className="flex flex-wrap gap-2">
              {ideaStatuses.map((option) => (
                <button
                  key={`${mode}-${option.value}`}
                  type="button"
                  onClick={() => setFormData((current) => ({ ...current, status: option.value }))}
                  className={`rounded-full border-2 border-black px-3 py-2 text-sm font-semibold ${formData.status === option.value ? option.tone : "bg-white text-black hover:bg-[#f6f3ec]"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Spark type</label>
            <div className="grid gap-2">
              {sparkTypes.map((option) => (
                <button
                  key={`${mode}-${option.value}`}
                  type="button"
                  onClick={() => setFormData((current) => ({ ...current, sparkType: option.value }))}
                  className={`rounded-[1rem] border px-3 py-3 text-left transition ${formData.sparkType === option.value ? "border-black bg-[#f6f3ec]" : "border-black/10 bg-white hover:border-black/40"}`}
                >
                  <p className="font-semibold text-foreground">{option.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{option.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">DIKW tier</label>
            <div className="flex flex-wrap gap-2">
              {dikwTiers.map((tier) => (
                <button
                  key={`${mode}-${tier}`}
                  type="button"
                  onClick={() => setFormData((current) => ({ ...current, dikwTier: tier }))}
                  className={`rounded-full border-2 border-black px-3 py-2 text-sm font-semibold capitalize ${formData.dikwTier === tier ? dikwClassMap[tier] : "bg-white text-black hover:bg-[#f6f3ec]"}`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Insight stage</label>
              <select
                aria-label={`${mode === "create" ? "Create" : "Edit"} insight stage`}
                value={formData.insightStage}
                onChange={(event) => setFormData((current) => ({ ...current, insightStage: event.target.value as InsightStage }))}
                className="h-11 w-full rounded-full border-2 border-black/85 bg-white px-4 text-foreground shadow-none"
              >
                {insightStages.map((option) => (
                  <option key={`${mode}-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Source module</label>
              <select
                aria-label={`${mode === "create" ? "Create" : "Edit"} source module`}
                value={formData.sourceModule}
                onChange={(event) => setFormData((current) => ({ ...current, sourceModule: event.target.value as SourceModule }))}
                className="h-11 w-full rounded-full border-2 border-black/85 bg-white px-4 text-foreground shadow-none"
              >
                {sourceModules.map((option) => (
                  <option key={`${mode}-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Anchor goal</label>
            <select
              aria-label={`${mode === "create" ? "Create" : "Edit"} anchor goal`}
              value={formData.linkedGoalId ?? ""}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  linkedGoalId: event.target.value ? Number(event.target.value) : undefined,
                }))
              }
              className="h-11 w-full rounded-full border-2 border-black/85 bg-white px-4 text-foreground shadow-none"
            >
              <option value="">No anchor goal yet</option>
              {goals.map((goal) => (
                <option key={`${mode}-${goal.id}`} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Tags</label>
            <Input
              aria-label={`${mode === "create" ? "Create" : "Edit"} tags`}
              value={formData.tags}
              onChange={(event) => setFormData((current) => ({ ...current, tags: event.target.value }))}
              placeholder="Comma-separated tags"
              className="rounded-full border-2 border-black/85 bg-white shadow-none"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="h-11 rounded-full border-2 border-black bg-[#b55af3] px-5 text-white shadow-none hover:bg-[#9f42e3] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-11 rounded-full border-2 border-black bg-white px-5 text-black shadow-none hover:bg-[#f6f3ec]"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function Ideas() {
  const { data: taxonomyTree } = trpc.taxonomy.getTree.useQuery();
  const { data: goals = [] } = trpc.goals.list.useQuery({});
  const { data: ideas = [], isLoading, refetch } = trpc.ideas.list.useQuery({});
  const [showForm, setShowForm] = useState(false);
  const [editingIdeaId, setEditingIdeaId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | "all">("all");
  const [sparkFilter, setSparkFilter] = useState<SparkType | "all">("all");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error" | null>(null);
  const [formData, setFormData] = useState<IdeaFormState>(() => createIdeaFormState());
  const [editFormData, setEditFormData] = useState<IdeaFormState>(() => createIdeaFormState());

  const handleMutationError = (actionLabel: string, error: unknown) => {
    const message = error instanceof Error ? error.message : `${actionLabel} failed.`;
    setFeedbackTone("error");
    setFeedbackMessage(message);
    sonnerToast.error(actionLabel, { description: message });
  };

  const createMutation = trpc.ideas.create.useMutation({
    onSuccess: async () => {
      await refetch();
      setFormData(createIdeaFormState());
      setShowForm(false);
      setFeedbackTone("success");
      setFeedbackMessage("Idea captured successfully.");
      sonnerToast.success("Idea captured", { description: "The synthesis layer now has a new thread to develop." });
    },
    onError: (error) => handleMutationError("Could not create idea", error),
  });

  const updateMutation = trpc.ideas.update.useMutation({
    onSuccess: async () => {
      await refetch();
      setEditingIdeaId(null);
      setFeedbackTone("success");
      setFeedbackMessage("Idea updated successfully.");
      sonnerToast.success("Idea updated", { description: "Your synthesis thread has been revised." });
    },
    onError: (error) => handleMutationError("Could not update idea", error),
  });

  const deleteMutation = trpc.ideas.delete.useMutation({
    onSuccess: async () => {
      await refetch();
      setEditingIdeaId(null);
      setFeedbackTone("success");
      setFeedbackMessage("Idea deleted successfully.");
      sonnerToast.success("Idea deleted", { description: "The synthesis thread has been removed." });
    },
    onError: (error) => handleMutationError("Could not delete idea", error),
  });

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      if (statusFilter !== "all" && idea.status !== statusFilter) return false;
      if (sparkFilter !== "all" && idea.sparkType !== sparkFilter) return false;
      return true;
    });
  }, [ideas, sparkFilter, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: ideas.length,
      activeThreads: ideas.filter((idea) => idea.status !== "archived").length,
      developed: ideas.filter((idea) => idea.status === "developed").length,
      synthesisReady: ideas.filter((idea) => idea.insightStage === "expression" || idea.insightStage === "synthesis").length,
    };
  }, [ideas]);

  const goalOptions = goals.map((goal) => ({ id: goal.id, title: goal.title }));

  const resetCreatePanel = () => {
    setShowForm(false);
    setFormData(createIdeaFormState());
  };

  const handleCreateSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.title.trim()) return;

    const linkedEntries = serializeLinkedEntries(formData.linkedEntries);

    createMutation.mutate({
      title: formData.title,
      summary: formData.summary || undefined,
      categoryId: formData.categoryId,
      linkedGoalId: formData.linkedGoalId,
      status: formData.status,
      dikwTier: formData.dikwTier,
      sparkType: formData.sparkType,
      sourceModule: formData.sourceModule,
      insightStage: formData.insightStage,
      tags: formData.tags || undefined,
      linkedEntries: formData.linkedEntries.length > 0 ? linkedEntries : undefined,
    });
  };

  const handleEditSubmit = (ideaId: number) => (event: React.FormEvent) => {
    event.preventDefault();
    if (!editFormData.title.trim()) return;

    const linkedEntries = serializeLinkedEntries(editFormData.linkedEntries);

    updateMutation.mutate({
      id: ideaId,
      title: editFormData.title,
      summary: editFormData.summary || undefined,
      linkedGoalId: editFormData.linkedGoalId,
      status: editFormData.status,
      dikwTier: editFormData.dikwTier,
      sparkType: editFormData.sparkType,
      sourceModule: editFormData.sourceModule,
      insightStage: editFormData.insightStage,
      tags: editFormData.tags || undefined,
      linkedEntries: editFormData.linkedEntries.length > 0 ? linkedEntries : undefined,
    });
  };

  const beginEditing = (idea: IdeaRecord) => {
    setEditingIdeaId(idea.id);
    setEditFormData(createIdeaFormState(idea));
    setFeedbackMessage(null);
    setFeedbackTone(null);
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)]">
        <div className="dev-soft-card p-6 sm:p-8" style={{ backgroundColor: "#F5F3F0" }}>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">Synthesis layer</p>
              <h1 className="dev-hero-accent relative inline-block text-balance">Ideas Lab</h1>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
                Hold questions, frameworks, arguments, and experimental threads in one place so your archive can move from captured notes toward articulated insight.
              </p>
            </div>
            <Button
              onClick={() => {
                setShowForm((current) => !current);
                setEditingIdeaId(null);
                setFeedbackMessage(null);
                setFeedbackTone(null);
              }}
              className="h-11 rounded-full border-2 border-black bg-[#b55af3] px-5 text-white shadow-none hover:bg-[#9f42e3]"
            >
              {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {showForm ? "Close composer" : "Capture idea"}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total ideas", value: summary.total, accent: "#b55af3" },
              { label: "Active threads", value: summary.activeThreads, accent: "#56c5ea" },
              { label: "Developed", value: summary.developed, accent: "#116d6d" },
              { label: "Synthesis ready", value: summary.synthesisReady, accent: "#efb93a" },
            ].map((stat) => (
              <div key={stat.label} className="dev-stat-card" style={{ backgroundColor: "#F5F3F0" }}>
                <div className="h-3 w-full dev-pattern-diamonds" style={{ backgroundColor: stat.accent }} />
                <div className="space-y-2 px-5 py-4">
                  <div className="text-5xl font-black tracking-tight text-foreground">{String(stat.value).padStart(2, "0")}</div>
                  <p className="text-base font-medium text-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="dev-card p-5" style={{ backgroundColor: "#F5F3F0" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-black bg-[#b55af3] text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Development cadence</p>
              <h2 className="text-2xl">How ideas mature</h2>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {insightStages.map((stage) => (
              <div key={stage.value} className="rounded-[1.2rem] border border-black/10 bg-white px-4 py-3">
                <p className="font-semibold text-foreground">{stage.label}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {stage.value === "capture"
                    ? "Preserve the spark before it evaporates."
                    : stage.value === "connection"
                      ? "Tie the spark to related notes, terms, and live goals."
                      : stage.value === "synthesis"
                        ? "Clarify the shape of the emerging argument or framework."
                        : "Move the insight into a draft, lesson, or public-facing artifact."}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {feedbackMessage && (
        <div
          className={`rounded-[1.3rem] border-2 px-5 py-4 text-sm font-medium ${
            feedbackTone === "error"
              ? "border-[#e25b33] bg-[#fff0ea] text-[#8c2c0d]"
              : "border-[#116d6d] bg-[#edf8f6] text-[#0b5555]"
          }`}
        >
          {feedbackMessage}
        </div>
      )}

      {showForm && (
        <Card className="dev-card rounded-[1.5rem] p-6 shadow-none">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-black bg-[#f4e7ff] text-[#7b2fc1]">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Idea composer</p>
              <h2 className="text-2xl">Capture a new synthesis thread</h2>
            </div>
          </div>
          <IdeaEditor
            mode="create"
            formData={formData}
            setFormData={setFormData}
            taxonomyTree={taxonomyTree}
            goals={goalOptions}
            onSubmit={handleCreateSubmit}
            onCancel={resetCreatePanel}
            submitLabel="Save idea"
            isPending={createMutation.isPending}
          />
        </Card>
      )}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,18rem)]">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className="rounded-full border-2 border-black shadow-none"
          >
            All statuses
          </Button>
          {ideaStatuses.map((status) => (
            <Button
              key={status.value}
              variant={statusFilter === status.value ? "default" : "outline"}
              onClick={() => setStatusFilter(status.value)}
              className={`rounded-full border-2 border-black shadow-none ${statusFilter === status.value ? status.tone : "bg-white text-black"}`}
            >
              {status.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
          <Button
            variant={sparkFilter === "all" ? "default" : "outline"}
            onClick={() => setSparkFilter("all")}
            className="rounded-full border-2 border-black shadow-none"
          >
            All spark types
          </Button>
          {sparkTypes.map((spark) => (
            <Button
              key={spark.value}
              variant={sparkFilter === spark.value ? "default" : "outline"}
              onClick={() => setSparkFilter(spark.value)}
              className="rounded-full border-2 border-black bg-white text-black shadow-none"
            >
              {spark.label}
            </Button>
          ))}
        </div>
      </section>

      {isLoading ? (
        <Card className="dev-card rounded-[1.5rem] p-8 text-center shadow-none">
          <p className="text-sm leading-6 text-muted-foreground">Loading your synthesis threads…</p>
        </Card>
      ) : filteredIdeas.length === 0 ? (
        <Card className="dev-card rounded-[1.5rem] p-8 text-center shadow-none">
          <p className="text-base leading-7 text-muted-foreground">
            No ideas match the current filters yet. Capture a question, framework, or argument to begin populating the synthesis layer.
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredIdeas.map((idea) => {
            const isEditing = editingIdeaId === idea.id;
            const anchorGoal = goals.find((goal) => goal.id === idea.linkedGoalId);
            const statusValue = (idea.status as IdeaStatus | undefined) ?? "seed";
            const dikwTier = (idea.dikwTier as DikwTier | undefined) ?? "knowledge";
            const sparkLabel = sparkTypes.find((option) => option.value === idea.sparkType)?.label ?? "Theme";
            const parsedLinkedEntries = parseLinkedEntries(idea.linkedEntries);

            return (
              <Card key={idea.id} className="dev-card rounded-[1.5rem] p-5 shadow-none">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Editing idea</p>
                        <h3 className="text-2xl">Refine the thread</h3>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingIdeaId(null)}
                        className="rounded-full border-2 border-black bg-white text-black shadow-none hover:bg-[#f6f3ec]"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Close
                      </Button>
                    </div>
                    <IdeaEditor
                      mode="edit"
                      formData={editFormData}
                      setFormData={setEditFormData}
                      taxonomyTree={taxonomyTree}
                      goals={goalOptions}
                      onSubmit={handleEditSubmit(idea.id)}
                      onCancel={() => setEditingIdeaId(null)}
                      submitLabel="Save changes"
                      isPending={updateMutation.isPending}
                    />
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusClassMap[statusValue]}`}>
                            {statusValue}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${dikwClassMap[dikwTier]}`}>
                            {dikwTier}
                          </span>
                          <span className="rounded-full bg-[#f4e7ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6c26b0]">
                            {sparkLabel}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-[1.9rem] leading-none">{idea.title}</h3>
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {idea.summary?.trim() || "This idea is currently waiting for a fuller synthesis note."}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => beginEditing(idea)}
                          className="rounded-full border-2 border-black bg-white text-black shadow-none hover:bg-[#f6f3ec]"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit idea
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => deleteMutation.mutate({ id: idea.id })}
                          disabled={deleteMutation.isPending}
                          className="rounded-full border-2 border-black bg-white text-black shadow-none hover:bg-[#f6f3ec]"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.2rem] border border-black/10 bg-[#f7f3fb] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Source module</p>
                        <p className="mt-2 text-sm font-semibold capitalize text-foreground">{idea.sourceModule ?? "manual"}</p>
                      </div>
                      <div className="rounded-[1.2rem] border border-black/10 bg-[#f7f3fb] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Insight stage</p>
                        <p className="mt-2 text-sm font-semibold capitalize text-foreground">{idea.insightStage ?? "capture"}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <div className="rounded-[1.2rem] border border-black/10 bg-white px-4 py-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Target className="h-4 w-4" />
                          Anchor goal
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {anchorGoal ? anchorGoal.title : "No anchor goal attached yet."}
                        </p>
                      </div>
                      <div className="rounded-[1.2rem] border border-black/10 bg-white px-4 py-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Orbit className="h-4 w-4" />
                          Linked references
                        </div>
                        {parsedLinkedEntries.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {parsedLinkedEntries.map((reference) => (
                              <span key={`${idea.id}-${reference.type}-${reference.id}`} className="dev-chip">
                                {describeLinkedEntryReference(reference)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">No linked records attached yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {(idea.tags?.split(",") ?? [])
                          .map((tag) => tag.trim())
                          .filter(Boolean)
                          .map((tag) => (
                            <span key={`${idea.id}-${tag}`} className="dev-chip">
                              {tag}
                            </span>
                          ))}
                      </div>
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#6c26b0]">
                        <Link2 className="h-4 w-4" />
                        {parsedLinkedEntries.length > 0 ? `${parsedLinkedEntries.length} connected reference${parsedLinkedEntries.length === 1 ? "" : "s"}` : "Ready for connection"}
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Plus, Search } from "lucide-react";
import {
  EssaysIcon,
  NotesIcon,
  QuotationsIcon,
  ResearchIcon,
  VocabularyIcon,
} from "@/components/DevanomyIcons";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCommonplaceFeatureFlag } from "@/lib/featureFlags";

const modules = [
  {
    id: "atlas",
    title: "Atlas & Knowledge Base",
    description: "Navigate your Johnny Decimal taxonomy, topographical indexes, and interconnected knowledge nodes across all areas.",
    icon: ResearchIcon,
    route: "/search",
    accent: "#56c5ea",
    pattern: "dev-pattern-dots",
    chips: ["Atlas", "Taxonomy", "Johnny Decimal"],
  },
  {
    id: "notebook",
    title: "Commonplace Workspace",
    description: "Shape research notes, quotes, books, lists, bookmarks, and glossary fragments on a card-based drafting wall.",
    icon: QuotationsIcon,
    route: "/commonplace",
    accent: "#e04f2f",
    pattern: "dev-pattern-waves",
    chips: ["Research Notes", "Quotes", "Bookmarks"],
  },
  {
    id: "lexicon",
    title: "Clavis Aurea",
    description: "Browse, define, and connect your personal lexicon through concordance and etymological detail.",
    icon: VocabularyIcon,
    route: "/lexicon",
    accent: "#56c5ea",
    pattern: "dev-pattern-dots",
    chips: ["Vocabulary", "Etymology", "Concordance"],
  },
  {
    id: "documents",
    title: "Research & Writing Studio",
    description: "Organize research projects, build essays, and pull linked references directly into your drafts.",
    icon: EssaysIcon,
    route: "/documents",
    accent: "#e25b33",
    pattern: "dev-pattern-diamonds",
    chips: ["Projects", "Drafts", "Essays"],
  },
  {
    id: "goals",
    title: "Goals",
    description: "Keep immediate, seasonal, annual, and long-term aims visible so projects and tasks remain aligned with larger ends.",
    icon: NotesIcon,
    route: "/goals",
    accent: "#f03878",
    pattern: "dev-pattern-waves",
    chips: ["Action Layer", "Outcomes", "Horizon"],
  },
  {
    id: "ideas",
    title: "Ideas Lab",
    description: "Develop questions, frameworks, arguments, and synthesis threads that connect your archive to future writing and teaching.",
    icon: ResearchIcon,
    route: "/ideas",
    accent: "#5c61ff",
    pattern: "dev-pattern-diamonds",
    chips: ["Synthesis Layer", "Frameworks", "Questions"],
  },
  {
    id: "glossary",
    title: "Clavis Aurea Glossary",
    description: "Explore philosophical and literary vocabulary with AI-powered composition and thematic organization.",
    icon: VocabularyIcon,
    route: "/glossary",
    accent: "#5c61ff",
    pattern: "dev-pattern-stripes",
    chips: ["Lexicon", "Scribe", "Themes"],
  },
];

const knowledgeHighlights = [
  {
    title: "Definition, Synonym, Antonym",
    description: "Use Clavis Aurea as a living concordance with semantic relationships inspired by your Devanomy taxonomy system.",
    accent: "#efb93a",
    pattern: "dev-pattern-waves",
  },
  {
    title: "Research Linking Workflow",
    description: "Supports, contradicts, develops, questions, and synthesizes relationships are reflected in the workspace structure.",
    accent: "#56c5ea",
    pattern: "dev-pattern-dots",
  },
];

function StatusShape({ shape, color }: { shape: "circle" | "square" | "diamond"; color: string }) {
  const common = { backgroundColor: color };

  if (shape === "circle") {
    return <span className="h-4 w-4 rounded-full border border-black/70" style={common} />;
  }

  if (shape === "diamond") {
    return <span className="h-4 w-4 rotate-45 border border-black/70" style={common} />;
  }

  return <span className="h-4 w-4 rounded-[0.2rem] border border-black/70" style={common} />;
}

function formatStatValue(value: number | undefined, isLoading: boolean) {
  if (isLoading) {
    return "—";
  }

  return String(value ?? 0).padStart(2, "0");
}

export default function Home() {
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { commonplaceEnabled } = useCommonplaceFeatureFlag();

  const enableCommonplaceMutation = trpc.featureFlags.update.useMutation({
    onSuccess: async () => {
      await utils.featureFlags.list.invalidate();
      setLocation("/commonplace");
    },
  });

  const notebookQuery = trpc.notebook.list.useQuery({ page: 1, pageSize: 1 });
  const lexiconQuery = trpc.lexicon.list.useQuery({});
  const documentsQuery = trpc.documents.list.useQuery({});
  const goalsQuery = trpc.goals.list.useQuery({});
  const ideasQuery = trpc.ideas.list.useQuery({});
  const projectsQuery = trpc.projects.list.useQuery({});
  const tasksQuery = trpc.tasks.list.useQuery({});

  const stats = [
    {
      label: "Commonplace Cards",
      value: formatStatValue(notebookQuery.data?.pageInfo.total, notebookQuery.isLoading),
      tone: "#efb93a",
      pattern: "dev-pattern-waves",
    },
    {
      label: "Lexicon Terms",
      value: formatStatValue(lexiconQuery.data?.length, lexiconQuery.isLoading),
      tone: "#56c5ea",
      pattern: "dev-pattern-dots",
    },
    {
      label: "Documents",
      value: formatStatValue(documentsQuery.data?.length, documentsQuery.isLoading),
      tone: "#e25b33",
      pattern: "dev-pattern-stripes",
    },
    {
      label: "Ideas in Play",
      value: formatStatValue(ideasQuery.data?.filter((idea) => idea.status !== "archived").length, ideasQuery.isLoading),
      tone: "#5c61ff",
      pattern: "dev-pattern-diamonds",
    },
  ];

  const liveTasks = (tasksQuery.data ?? []).slice(0, 3).map((task) => ({
    label: task.title,
    date:
      task.dueDate instanceof Date
        ? task.dueDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : task.status === "completed"
          ? "Completed"
          : task.status === "blocked"
            ? "Blocked"
            : task.status === "in-progress"
              ? "In progress"
              : "Open",
    shape:
      task.priority === "urgent"
        ? "diamond"
        : task.priority === "high"
          ? "square"
          : "circle",
    color:
      task.priority === "urgent"
        ? "#e25b33"
        : task.priority === "high"
          ? "#efb93a"
          : task.status === "completed"
            ? "#5c61ff"
            : "#56c5ea",
  }));

  const tasks =
    liveTasks.length > 0
        ? liveTasks
      : [
          { label: "Import your first archive", date: "Start here", shape: "circle" as const, color: "#efb93a" },
          { label: "Define your first lexicon term", date: "Next", shape: "square" as const, color: "#56c5ea" },
          { label: "Set your first workspace goal", date: "Then", shape: "diamond" as const, color: "#5c61ff" },
        ];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="dev-soft-card overflow-hidden p-6 sm:p-8" style={{ backgroundColor: "rgba(249,246,239,0.9)" }}>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-5 flex items-center gap-4">
                <img src="/manus-storage/devanomy-logo-branding-refresh_2e8698f4.webp" alt="Devanomy" className="h-18 w-auto rounded-[1.35rem] shadow-[0_18px_30px_-24px_rgba(19,36,63,0.65)]" />
              </div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#6b7487]">
                Devanomy editorial workspace
              </p>
              <h1 className="dev-hero-accent dev-hero-striped relative inline-block pr-16 text-balance text-[#13243f]">
                Good morning, {user?.name?.split(" ")[0] || "Devaney"}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#48546a] sm:text-lg">
                An editorial command center for notes, concepts, drafts, and synthesis—now tuned to the off-white, indigo, coral, gold, and sky-blue Devanomy visual language.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
                              <Button
                onClick={() => {
                  if (commonplaceEnabled) {
                    setLocation("/commonplace");
                    return;
                  }

                  enableCommonplaceMutation.mutate({ flagKey: "commonplace_workspace", enabled: true });
                }}
                disabled={enableCommonplaceMutation.isPending}
                className="h-11 rounded-full border border-[#13243f]/15 bg-[#e85b3e] px-5 text-white shadow-[0_18px_30px_-22px_rgba(232,91,62,0.7)] hover:bg-[#d94d31]"
              >
                <Plus className="mr-2 h-4 w-4" />
                {commonplaceEnabled ? "Quick capture" : enableCommonplaceMutation.isPending ? "Enabling Commonplace…" : "Enable Commonplace"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/search")}
                className="h-11 rounded-full border border-[#13243f]/14 bg-white/88 px-5 text-[#13243f] shadow-[0_14px_30px_-24px_rgba(19,36,63,0.48)] hover:bg-[#fffaf2]"
              >
                <Search className="mr-2 h-4 w-4" />
                Unified search
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="dev-stat-card" style={{ backgroundColor: "rgba(255,255,255,0.92)" }}>
                <div className={`${stat.pattern} h-3 w-full`} style={{ backgroundColor: stat.tone }} />
                <div className="space-y-2 px-5 py-4">
                  <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#6b7487]">Live metric</p>
                  <div className="text-5xl font-black tracking-tight text-[#13243f]">{stat.value}</div>
                  <p className="text-base font-medium text-[#13243f]">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="dev-card overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.9)" }}>
          <div className="border-b-2 border-black px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Live task queue</p>
          </div>
          <div className="space-y-4 p-5">
            {tasks.map((task) => (
              <div key={`${task.label}-${task.date}`} className="rounded-[1.35rem] border border-[#13243f]/10 p-4 shadow-[0_12px_22px_-24px_rgba(19,36,63,0.35)]" style={{ backgroundColor: "rgba(249,246,239,0.82)" }}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">{task.date}</span>
                  <StatusShape shape={task.shape as "circle" | "square" | "diamond"} color={task.color} />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{task.label}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2>Explore your modules</h2>
          <Button
            variant="ghost"
            onClick={() => setLocation("/bulk-import")}
            className="rounded-full border-b-2 border-[#116d6d] px-0 text-[#116d6d] shadow-none hover:bg-transparent hover:text-[#0f5959]"
          >
            Import your archive
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.id}
                className="dev-card overflow-hidden rounded-[1.65rem] p-0 shadow-none transition-transform duration-200 hover:-translate-y-1.5"
              >
                <div
                  className={`dev-module-banner ${module.pattern} flex min-h-[9rem] items-end justify-between border-b-2 border-black px-5 py-5`}
                  style={{ backgroundColor: module.accent }}
                >
                  <Icon className="h-11 w-11" />
                    <span className="rounded-full border border-[#13243f]/14 bg-white/86 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#13243f] shadow-[0_8px_18px_-18px_rgba(19,36,63,0.6)]">

                    {module.id}
                  </span>
                </div>
                <div className="space-y-5 p-5">
                  <div>
                    <h3 className="mb-2 text-[1.9rem] leading-none">{module.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{module.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {module.chips.map((chip) => (
                      <span key={chip} className="dev-chip">
                        {chip}
                      </span>
                    ))}
                  </div>
                  <Button
                    onClick={() => {
                      if (module.id === "notebook" && !commonplaceEnabled) {
                        enableCommonplaceMutation.mutate({ flagKey: "commonplace_workspace", enabled: true });
                        return;
                      }

                      setLocation(module.route);
                    }}
                    disabled={module.id === "notebook" && enableCommonplaceMutation.isPending}
                    className="h-11 w-full rounded-full border border-[#13243f]/14 bg-white/86 text-[#13243f] shadow-[0_14px_28px_-24px_rgba(19,36,63,0.52)] hover:bg-[#fffaf2]"
                  >
                    {module.id === "notebook" && !commonplaceEnabled
                      ? enableCommonplaceMutation.isPending
                        ? "Enabling workspace…"
                        : "Enable workspace"
                      : "Open module"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-6 lg:grid-cols-2">
          {knowledgeHighlights.map((item) => (
            <div key={item.title} className="dev-card overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.86)" }}>
              <div className={`${item.pattern} h-5 w-full`} style={{ backgroundColor: item.accent }} />
              <div className="space-y-3 p-5">
                <h3 className="text-[2rem] leading-none">{item.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="dev-soft-card p-5" style={{ backgroundColor: "rgba(249,246,239,0.88)" }}>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#13243f]/14 bg-[#54b5dd] shadow-[0_16px_28px_-24px_rgba(84,181,221,0.75)]">
              <NotesIcon className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Knowledge rhythm</p>
              <p className="text-lg font-semibold text-foreground">Weekly scholarly cadence</p>
            </div>
          </div>
          <div className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Capture primary sources in the notebook, distill terminology in Clavis Aurea, then translate insights into structured documents.
            </p>
            <p>
              The sidebar taxonomy now reflects your real category structure, so area, category, and activity remain legible at every step.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/documents")}
            className="mt-5 h-11 w-full rounded-full border border-[#13243f]/14 bg-[#0d706b] text-white shadow-[0_18px_30px_-24px_rgba(13,112,107,0.72)] hover:bg-[#0a5e5b]"
          >
            Open writing studio
          </Button>
        </div>
      </section>
    </div>
  );
}

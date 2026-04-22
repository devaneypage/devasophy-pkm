import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Compass, Plus, Search } from "lucide-react";
import {
  EssaysIcon,
  NotesIcon,
  QuotationsIcon,
  VocabularyIcon,
} from "@/components/DevanomyIcons";
import { useLocation } from "wouter";

const stats = [
  {
    label: "Active Projects",
    value: "03",
    tone: "#116d6d",
    pattern: "dev-pattern-waves",
  },
  {
    label: "Notes Captured",
    value: "48",
    tone: "#e25b33",
    pattern: "dev-pattern-dots",
  },
  {
    label: "Terms Tracked",
    value: "354",
    tone: "#56c5ea",
    pattern: "dev-pattern-stripes",
  },
  {
    label: "Knowledge Links",
    value: "126",
    tone: "#bfd73d",
    pattern: "dev-pattern-diamonds",
  },
];

const modules = [
  {
    id: "notebook",
    title: "Commonplace Notebook",
    description: "Capture quotations, passages, annotations, and source metadata in a richly structured notebook.",
    icon: QuotationsIcon,
    route: "/notebook",
    accent: "#efb93a",
    pattern: "dev-pattern-waves",
    chips: ["Quotes", "Passages", "Observations"],
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

const tasks = [
  { label: "Review imported quotations", date: "Today", shape: "circle", color: "#bfd73d" },
  { label: "Refine lexicon cross-links", date: "Tomorrow", shape: "square", color: "#56c5ea" },
  { label: "Draft essay outline", date: "This week", shape: "diamond", color: "#efb93a" },
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

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="dev-soft-card p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                Devanomy workspace
              </p>
              <h1 className="dev-hero-accent dev-hero-striped relative inline-block pr-16 text-balance">
                Good morning, {user?.name?.split(" ")[0] || "Devaney"}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                A light, editorial workspace for quotations, vocabulary, and writing projects—organized through a visible taxonomy and expressive visual cues.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setLocation("/notebook")}
                className="h-11 rounded-full border-2 border-black bg-[#e25b33] px-5 text-white shadow-none hover:bg-[#d6522d]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Quick capture
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/search")}
                className="h-11 rounded-full border-2 border-black bg-white px-5 shadow-none hover:bg-[#f6f3ec]"
              >
                <Search className="mr-2 h-4 w-4" />
                Unified search
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="dev-stat-card">
                <div className={`${stat.pattern} h-3 w-full`} style={{ backgroundColor: stat.tone }} />
                <div className="space-y-2 px-5 py-4">
                  <div className="text-5xl font-black tracking-tight text-foreground">{stat.value}</div>
                  <p className="text-base font-medium text-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="dev-card overflow-hidden">
          <div className="border-b-2 border-black px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Upcoming tasks</p>
          </div>
          <div className="space-y-4 p-5">
            {tasks.map((task) => (
              <div key={task.label} className="rounded-2xl border border-black/10 bg-white p-4">
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
                className="dev-card overflow-hidden rounded-[1.5rem] p-0 shadow-none transition-transform hover:-translate-y-1"
              >
                <div
                  className={`dev-module-banner ${module.pattern} flex min-h-[9rem] items-end justify-between border-b-2 border-black px-5 py-5`}
                  style={{ backgroundColor: module.accent }}
                >
                  <Icon className="h-11 w-11" />
                  <span className="rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-black">
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
                    onClick={() => setLocation(module.route)}
                    className="h-11 w-full rounded-full border-2 border-black bg-white text-black shadow-none hover:bg-[#f6f3ec]"
                  >
                    Open module
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
            <div key={item.title} className="dev-card overflow-hidden">
              <div className={`${item.pattern} h-5 w-full`} style={{ backgroundColor: item.accent }} />
              <div className="space-y-3 p-5">
                <h3 className="text-[2rem] leading-none">{item.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="dev-soft-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#56c5ea]">
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
              The sidebar taxonomy keeps area, category, and ID visible so your knowledge architecture remains legible at every step.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/documents")}
            className="mt-5 h-11 w-full rounded-full border-2 border-black bg-[#116d6d] text-white shadow-none hover:bg-[#0f5959]"
          >
            Open writing studio
          </Button>
        </div>
      </section>
    </div>
  );
}

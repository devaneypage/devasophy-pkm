import React from "react";
import { ArrowRight, CalendarDays, FolderKanban, NotebookPen, Plus, Sparkles, Target } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/../src/_core/hooks/useAuth";

function formatStatValue(value: number | undefined, isLoading: boolean) {
  if (isLoading) return "—";
  return String(value ?? 0).padStart(2, "0");
}

function normalizeDate(value?: Date | string | null) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const notebookQuery = trpc.notebook.list.useQuery({});
  const lexiconQuery = trpc.lexicon.list.useQuery({});
  const documentsQuery = trpc.documents.list.useQuery({});
  const goalsQuery = trpc.goals.list.useQuery({});
  const ideasQuery = trpc.ideas.list.useQuery({});
  const projectsQuery = trpc.projects.list.useQuery({});
  const tasksQuery = trpc.tasks.list.useQuery({});

  const stats = [
    {
      label: "Notebook entries",
      value: formatStatValue(notebookQuery.data?.length, notebookQuery.isLoading),
      tone: "#efb93a",
    },
    {
      label: "Lexicon terms",
      value: formatStatValue(lexiconQuery.data?.length, lexiconQuery.isLoading),
      tone: "#56c5ea",
    },
    {
      label: "Drafts in studio",
      value: formatStatValue(documentsQuery.data?.length, documentsQuery.isLoading),
      tone: "#e25b33",
    },
    {
      label: "Ideas in play",
      value: formatStatValue(ideasQuery.data?.filter((idea: any) => idea.status !== "archived").length, ideasQuery.isLoading),
      tone: "#5c61ff",
    },
  ];

  const activeProjects = (projectsQuery.data ?? [])
    .filter((project: any) => project.status !== "archived")
    .slice(0, 3)
    .map((project: any) => {
      const projectTasks = (tasksQuery.data ?? []).filter((task: any) => task.projectId === project.id);
      const completedTasks = projectTasks.filter((task: any) => task.status === "completed").length;
      const progress = projectTasks.length === 0 ? 0 : Math.round((completedTasks / projectTasks.length) * 100);
      return {
        ...project,
        progress,
        taskCount: projectTasks.length,
      };
    });

  const docket = (tasksQuery.data ?? [])
    .slice()
    .sort((a: any, b: any) => {
      const left = normalizeDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const right = normalizeDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return left - right;
    })
    .slice(0, 4)
    .map((task: any) => ({
      id: task.id,
      title: task.title,
      due: normalizeDate(task.dueDate),
      status: task.status,
      priority: task.priority,
    }));

  const recentNotes = (notebookQuery.data ?? []).slice(0, 4);
  const upcomingDates = [
    ...docket.map((item) => item.due).filter(Boolean),
    ...(projectsQuery.data ?? []).flatMap((project: any) => [normalizeDate(project.startDate), normalizeDate(project.endDate)]).filter(Boolean),
  ] as Date[];

  const dashboardLinks = [
    { label: "Open Writing Studio", description: "Draft essays and research notes.", path: "/documents", icon: FolderKanban, accent: "#e25b33" },
    { label: "Open Goals", description: "Track immediate and long-range aims.", path: "/goals", icon: Target, accent: "#f03878" },
    { label: "Open Ideas Lab", description: "Develop frameworks and synthesis threads.", path: "/ideas", icon: Sparkles, accent: "#5c61ff" },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="dev-soft-card overflow-hidden p-6 sm:p-8" style={{ backgroundColor: "rgba(249,246,239,0.9)" }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#6b7487]">Launchpad dashboard</p>
              <h1 className="dev-hero-accent relative inline-block pr-10 text-balance text-[#13243f]">
                Good morning, {user?.name?.split(" ")[0] || "Devaney"}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#48546a] sm:text-lg">
                A dashboard for active projects, immediate docket items, current notes, and the calendar layer that coordinates your Devanomy workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setLocation("/notes")} className="h-11 rounded-full border border-[#13243f]/15 bg-[#e85b3e] px-5 text-white shadow-[0_18px_30px_-22px_rgba(232,91,62,0.7)] hover:bg-[#d94d31]">
                <Plus className="mr-2 h-4 w-4" />
                Quick capture
              </Button>
              <Button variant="outline" onClick={() => setLocation("/knowledge-base")} className="h-11 rounded-full border border-[#13243f]/14 bg-white/88 px-5 text-[#13243f] shadow-[0_14px_30px_-24px_rgba(19,36,63,0.48)] hover:bg-[#fffaf2]">
                <ArrowRight className="mr-2 h-4 w-4" />
                Explore knowledge base
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="dev-stat-card" style={{ backgroundColor: "rgba(255,255,255,0.92)" }}>
                <div className="h-3 w-full" style={{ backgroundColor: stat.tone }} />
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
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Docket</p>
          </div>
          <div className="space-y-4 p-5">
            {docket.length === 0 ? (
              <div className="rounded-[1.35rem] border border-[#13243f]/10 p-4 text-sm leading-6 text-muted-foreground" style={{ backgroundColor: "rgba(249,246,239,0.82)" }}>
                Your next commitments will appear here once projects and tasks carry due dates.
              </div>
            ) : (
              docket.map((task) => (
                <div key={task.id} className="rounded-[1.35rem] border border-[#13243f]/10 p-4 shadow-[0_12px_22px_-24px_rgba(19,36,63,0.35)]" style={{ backgroundColor: "rgba(249,246,239,0.82)" }}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-foreground">{task.due ? task.due.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "TBD"}</span>
                    <span className="rounded-full border border-black/10 px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {task.priority || task.status}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{task.title}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="dev-card rounded-[1.8rem] p-6 shadow-none">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Active projects</p>
              <h2 className="mt-2 text-2xl text-foreground">Projects in motion</h2>
            </div>
            <Button variant="outline" className="rounded-full border-black/10 bg-[#fcfaf6]" onClick={() => setLocation("/projects")}>Open projects</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeProjects.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-black/12 bg-[#fcfaf6] p-5 text-sm leading-6 text-muted-foreground xl:col-span-3">
                No active projects yet. Start in the Projects workspace to define the initiatives that should drive your dashboard.
              </div>
            ) : (
              activeProjects.map((project: any) => (
                <div key={project.id} className="rounded-[1.4rem] border border-black/10 bg-[#fcfaf6] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{project.title}</p>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{project.description || "No description yet."}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-[#fbe0d8]">
                      <FolderKanban className="h-4 w-4 text-[#e25b33]" />
                    </div>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-black/5">
                    <div className="h-full rounded-full bg-[#e25b33]" style={{ width: `${project.progress}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    <span>{project.status || "active"}</span>
                    <span>{project.taskCount} tasks · {project.progress}% complete</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="dev-card rounded-[1.8rem] p-5 shadow-none">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-[#d8ecfb]">
                <CalendarDays className="h-5 w-5 text-[#13243f]" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Mini calendar</p>
                <h2 className="mt-1 text-xl text-foreground">This month</h2>
              </div>
            </div>
            <Calendar
              mode="single"
              selected={new Date()}
              modifiers={{ hasEvent: upcomingDates }}
              modifiersClassNames={{ hasEvent: "relative after:absolute after:bottom-1.5 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-[#e25b33]" }}
              className="w-full rounded-[1.4rem] border border-black/10 bg-[#fcfaf6] p-4"
            />
            <Button variant="outline" className="mt-4 w-full rounded-2xl border-black/10 bg-[#fcfaf6]" onClick={() => setLocation("/calendar")}>Open full calendar</Button>
          </Card>

          <Card className="dev-card rounded-[1.8rem] p-5 shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Notes preview</p>
            <div className="mt-4 space-y-3">
              {recentNotes.length === 0 ? (
                <p className="text-sm leading-6 text-muted-foreground">Your recent notes and quotations will appear here once the notebook begins to fill.</p>
              ) : (
                recentNotes.map((entry: any) => (
                  <button key={entry.id} onClick={() => setLocation(`/notebook/${entry.id}`)} className="block w-full rounded-[1.25rem] border border-black/10 bg-[#fcfaf6] p-4 text-left transition hover:border-black/20">
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-3 text-sm leading-6 text-foreground">{entry.text}</p>
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-black/10 bg-[#f8e9b7]">
                        <NotebookPen className="h-4 w-4 text-[#13243f]" />
                      </div>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">{entry.collections || entry.author || "Commonplace Notebook"}</p>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {dashboardLinks.map((link) => (
          <button key={link.path} onClick={() => setLocation(link.path)} className="dev-card rounded-[1.6rem] p-5 text-left shadow-none transition hover:-translate-y-0.5 hover:border-black/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Nested destination</p>
                <h3 className="mt-2 text-xl text-foreground">{link.label}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{link.description}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10" style={{ backgroundColor: `${link.accent}24` }}>
                <link.icon className="h-5 w-5" style={{ color: link.accent }} />
              </div>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}

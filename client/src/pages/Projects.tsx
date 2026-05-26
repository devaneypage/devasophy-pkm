import React from "react";
import { BookOpen, CalendarDays, FolderKanban, Search, Sparkles, X } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type StatusFilter = "all" | "active" | "completed" | "on-hold" | "archived";

export default function Projects() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedProjectId, setSelectedProjectId] = React.useState<number | null>(null);

  const { data: projects = [], isLoading } = trpc.projects.list.useQuery({});
  const { data: tasks = [] } = trpc.tasks.list.useQuery({});

  const filteredProjects = React.useMemo(() => {
    return projects.filter((project: any) => {
      const matchesStatus = statusFilter === "all" ? true : project.status === statusFilter;
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        project.title?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.tags?.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [projects, searchTerm, statusFilter]);

  const selectedProject = filteredProjects.find((project: any) => project.id === selectedProjectId) ?? projects.find((project: any) => project.id === selectedProjectId) ?? null;

  const projectMeta = React.useMemo(() => {
    const map = new Map<number, { taskCount: number; completedCount: number }>();
    for (const project of projects as any[]) {
      const projectTasks = tasks.filter((task: any) => task.projectId === project.id);
      map.set(project.id, {
        taskCount: projectTasks.length,
        completedCount: projectTasks.filter((task: any) => task.status === "completed").length,
      });
    }
    return map;
  }, [projects, tasks]);

  const statusOptions: StatusFilter[] = ["all", "active", "completed", "on-hold", "archived"];

  return (
    <div className="space-y-6">
      <section className="dev-soft-card p-6 sm:p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Program launchpad</p>
        <h1 className="mb-4">Projects</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Organize active initiatives through a filterable grid, then open a detail modal to inspect timing, tags, and related project actions without leaving the launchpad surface.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Filter by title, description, or tags" className="dev-search h-14 pl-12 text-base shadow-none" />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => {
              const active = status === statusFilter;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? "border-[#13243f] bg-[#13243f] text-white" : "border-black/10 bg-white text-[#13243f] hover:bg-[#fcfaf6]"}`}
                >
                  {status === "all" ? "All" : status}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {isLoading ? (
        <Card className="dev-card rounded-[1.6rem] p-10 text-center shadow-none">
          <p className="text-muted-foreground">Loading projects...</p>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card className="dev-card rounded-[1.6rem] p-10 text-center shadow-none">
          <p className="text-lg font-semibold text-foreground">No projects match the current filters.</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Try broadening the status filter or searching for a different keyword.</p>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project: any) => {
            const meta = projectMeta.get(project.id) ?? { taskCount: 0, completedCount: 0 };
            const progress = meta.taskCount === 0 ? 0 : Math.round((meta.completedCount / meta.taskCount) * 100);
            return (
              <button key={project.id} onClick={() => setSelectedProjectId(project.id)} className="dev-card rounded-[1.7rem] p-5 text-left shadow-none transition hover:-translate-y-0.5 hover:border-black/15">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{project.status || "active"}</p>
                    <h2 className="mt-2 text-xl text-foreground">{project.title}</h2>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-[#fbe0d8]">
                    <FolderKanban className="h-5 w-5 text-[#e25b33]" />
                  </div>
                </div>
                <p className="mt-4 line-clamp-4 text-sm leading-6 text-muted-foreground">{project.description || "No description yet."}</p>
                <div className="mt-5 h-2 rounded-full bg-black/5">
                  <div className="h-full rounded-full bg-[#e25b33]" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <span>{meta.taskCount} tasks</span>
                  <span>{progress}% complete</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(project.tags?.split(",") ?? []).filter(Boolean).slice(0, 3).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="rounded-full border-black/10 bg-[#fcfaf6]">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </button>
            );
          })}
        </section>
      )}

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#13243f]/45 px-4 py-6 backdrop-blur-sm" onClick={() => setSelectedProjectId(null)}>
          <Card className="dev-card relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] p-6 shadow-none" onClick={(event) => event.stopPropagation()}>
            <button onClick={() => setSelectedProjectId(null)} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white">
              <X className="h-4 w-4" />
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Project detail</p>
            <h2 className="mt-3 text-3xl text-foreground">{selectedProject.title}</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{selectedProject.description || "No project description has been written yet."}</p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.4rem] border border-black/10 bg-[#fcfaf6] p-4">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-[#e25b33]" />
                  <p className="text-sm font-semibold text-foreground">Timeline</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : "No start date"}
                  {selectedProject.endDate ? ` → ${new Date(selectedProject.endDate).toLocaleDateString()}` : " · No end date"}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-black/10 bg-[#fcfaf6] p-4">
                <div className="flex items-center gap-3">
                  <FolderKanban className="h-4 w-4 text-[#e25b33]" />
                  <p className="text-sm font-semibold text-foreground">Task load</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {(projectMeta.get(selectedProject.id)?.taskCount ?? 0)} total tasks · {(projectMeta.get(selectedProject.id)?.completedCount ?? 0)} completed
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(selectedProject.tags?.split(",") ?? []).filter(Boolean).length > 0 ? (
                  (selectedProject.tags?.split(",") ?? []).filter(Boolean).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="rounded-full border-black/10 bg-[#fcfaf6]">
                      {tag.trim()}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No tags added yet.</p>
                )}
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Button variant="outline" className="rounded-2xl border-black/10 bg-[#fcfaf6]" onClick={() => setLocation("/documents")}>
                <BookOpen className="mr-2 h-4 w-4" />
                Writing Studio
              </Button>
              <Button variant="outline" className="rounded-2xl border-black/10 bg-[#fcfaf6]" onClick={() => setLocation("/goals")}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Goals
              </Button>
              <Button variant="outline" className="rounded-2xl border-black/10 bg-[#fcfaf6]" onClick={() => setLocation("/calendar")}>
                <Sparkles className="mr-2 h-4 w-4" />
                Calendar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

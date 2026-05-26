import React from "react";
import { Calendar as CalendarIcon, Clock3, FolderKanban, Target } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { trpc } from "@/lib/trpc";

type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  type: "project" | "goal" | "task";
  meta: string;
  accent: string;
};

function normalizeDate(value?: Date | string | null) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function CalendarPage() {
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const { data: projects = [] } = trpc.projects.list.useQuery({});
  const { data: goals = [] } = trpc.goals.list.useQuery({});
  const { data: tasks = [] } = trpc.tasks.list.useQuery({});

  const events = React.useMemo<CalendarEvent[]>(() => {
    const projectEvents = projects.flatMap((project: any) => {
      const start = normalizeDate(project.startDate);
      const end = normalizeDate(project.endDate);
      return [
        start
          ? {
              id: `project-start-${project.id}`,
              title: `${project.title} opens`,
              date: start,
              type: "project" as const,
              meta: project.status || "project",
              accent: "#e25b33",
            }
          : null,
        end
          ? {
              id: `project-end-${project.id}`,
              title: `${project.title} due`,
              date: end,
              type: "project" as const,
              meta: "project deadline",
              accent: "#efb93a",
            }
          : null,
      ].filter(Boolean) as CalendarEvent[];
    });

    const goalEvents = goals
      .map((goal: any) => {
        const review = normalizeDate(goal.targetDate ?? goal.reviewDate ?? goal.createdAt);
        if (!review) return null;
        return {
          id: `goal-${goal.id}`,
          title: goal.title,
          date: review,
          type: "goal" as const,
          meta: goal.horizon || goal.status || "goal",
          accent: "#5c61ff",
        };
      })
      .filter(Boolean) as CalendarEvent[];

    const taskEvents = tasks
      .map((task: any) => {
        const due = normalizeDate(task.dueDate);
        if (!due) return null;
        return {
          id: `task-${task.id}`,
          title: task.title,
          date: due,
          type: "task" as const,
          meta: task.priority || task.status || "task",
          accent: task.priority === "urgent" ? "#e25b33" : "#56c5ea",
        };
      })
      .filter(Boolean) as CalendarEvent[];

    return [...projectEvents, ...goalEvents, ...taskEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [goals, projects, tasks]);

  const selectedKey = selectedDate?.toDateString();
  const selectedEvents = events.filter((event) => event.date.toDateString() === selectedKey);
  const upcomingEvents = events.filter((event) => event.date >= new Date()).slice(0, 6);

  const modifiers = React.useMemo(
    () => ({
      hasEvent: events.map((event) => event.date),
    }),
    [events]
  );

  return (
    <div className="space-y-6">
      <section className="dev-soft-card p-6 sm:p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Temporal launchpad</p>
        <h1 className="mb-4">Calendar</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Survey project openings, deadlines, goals, and task due dates inside a single monthly grid, then move outward to the deeper project and goal workspaces as needed.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="dev-card rounded-[1.8rem] p-5 shadow-none">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Month view</p>
              <h2 className="mt-2 text-2xl text-foreground">Editorial calendar</h2>
            </div>
            <span className="rounded-full border border-black/10 bg-[#f6f3ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {events.length} plotted events
            </span>
          </div>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={modifiers}
            modifiersClassNames={{
              hasEvent: "relative after:absolute after:bottom-1.5 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-[#e25b33]",
            }}
            className="w-full rounded-[1.5rem] border border-black/10 bg-[#fcfaf6] p-4"
          />
        </Card>

        <div className="space-y-6">
          <Card className="dev-card rounded-[1.8rem] p-5 shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Selected day</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-[#efb93a]">
                <CalendarIcon className="h-5 w-5 text-[#13243f]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{selectedDate?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h3>
                <p className="text-sm text-muted-foreground">{selectedEvents.length === 0 ? "No scheduled items" : `${selectedEvents.length} scheduled item${selectedEvents.length === 1 ? "" : "s"}`}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {selectedEvents.length === 0 ? (
                <div className="rounded-[1.4rem] border border-dashed border-black/12 bg-[#fcfaf6] p-4 text-sm leading-6 text-muted-foreground">
                  This day is currently quiet. Use Projects or Goals to add time-bound commitments that will appear here.
                </div>
              ) : (
                selectedEvents.map((event) => (
                  <div key={event.id} className="rounded-[1.3rem] border border-black/10 bg-[#fcfaf6] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{event.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{event.meta}</p>
                      </div>
                      <span className="h-3.5 w-3.5 rounded-full border border-black/40" style={{ backgroundColor: event.accent }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="dev-card rounded-[1.8rem] p-5 shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Upcoming docket</p>
            <div className="mt-4 space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm leading-6 text-muted-foreground">Once projects, tasks, and goals have dates, they will appear here as your next scheduled commitments.</p>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 rounded-[1.25rem] border border-black/10 bg-[#fcfaf6] p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10" style={{ backgroundColor: `${event.accent}22` }}>
                      <Clock3 className="h-4 w-4" style={{ color: event.accent }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.date.toLocaleDateString()} · {event.meta}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="dev-card rounded-[1.8rem] p-5 shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Nested destinations</p>
            <div className="mt-4 grid gap-3">
              <Button variant="outline" className="justify-start rounded-2xl border-black/10 bg-[#fcfaf6]" onClick={() => setLocation("/projects")}>
                <FolderKanban className="mr-2 h-4 w-4" />
                Open Projects workspace
              </Button>
              <Button variant="outline" className="justify-start rounded-2xl border-black/10 bg-[#fcfaf6]" onClick={() => setLocation("/goals")}>
                <Target className="mr-2 h-4 w-4" />
                Open Goals workspace
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

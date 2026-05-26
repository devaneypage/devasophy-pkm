import React, { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CategorySelect from "@/components/CategorySelect";
import { Calendar, Compass, Flag, PauseCircle, Plus, Target, Trash2 } from "lucide-react";

const goalStatuses = [
  { value: "active", label: "Active", tone: "bg-[#116d6d] text-white" },
  { value: "achieved", label: "Achieved", tone: "bg-[#bfd73d] text-black" },
  { value: "paused", label: "Paused", tone: "bg-[#efb93a] text-black" },
  { value: "archived", label: "Archived", tone: "bg-[#d7d0c3] text-black" },
] as const;

const goalHorizons = [
  { value: "immediate", label: "Immediate", hint: "For what should move in the next few weeks." },
  { value: "seasonal", label: "Seasonal", hint: "For the current quarter or active season of work." },
  { value: "annual", label: "Annual", hint: "For outcomes that should define this year." },
  { value: "long_term", label: "Long term", hint: "For durable arc-setting intentions." },
] as const;

type GoalStatus = (typeof goalStatuses)[number]["value"];
type GoalHorizon = (typeof goalHorizons)[number]["value"];

const statusClassMap: Record<GoalStatus, string> = {
  active: "bg-[#116d6d] text-white",
  achieved: "bg-[#bfd73d] text-black",
  paused: "bg-[#efb93a] text-black",
  archived: "bg-[#d7d0c3] text-black",
};

const horizonAccentMap: Record<GoalHorizon, string> = {
  immediate: "#56c5ea",
  seasonal: "#efb93a",
  annual: "#e25b33",
  long_term: "#b55af3",
};

export default function Goals() {
  const { data: taxonomyTree } = trpc.taxonomy.getTree.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery({});
  const { data: goals = [], isLoading, refetch } = trpc.goals.list.useQuery({});
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<GoalStatus | "all">("all");
  const [horizonFilter, setHorizonFilter] = useState<GoalHorizon | "all">("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "active" as GoalStatus,
    horizon: "seasonal" as GoalHorizon,
    targetDate: "",
    tags: "",
    categoryId: undefined as number | undefined,
    linkedProjectId: undefined as number | undefined,
  });

  const createMutation = trpc.goals.create.useMutation({
    onSuccess: async () => {
      await refetch();
      setFormData({
        title: "",
        description: "",
        status: "active",
        horizon: "seasonal",
        targetDate: "",
        tags: "",
        categoryId: undefined,
        linkedProjectId: undefined,
      });
      setShowForm(false);
    },
  });

  const updateMutation = trpc.goals.update.useMutation({
    onSuccess: async () => {
      await refetch();
    },
  });

  const deleteMutation = trpc.goals.delete.useMutation({
    onSuccess: async () => {
      await refetch();
    },
  });

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      if (statusFilter !== "all" && goal.status !== statusFilter) return false;
      if (horizonFilter !== "all" && goal.horizon !== horizonFilter) return false;
      return true;
    });
  }, [goals, horizonFilter, statusFilter]);

  const summary = useMemo(() => {
    const activeCount = goals.filter((goal) => goal.status === "active").length;
    const achievedCount = goals.filter((goal) => goal.status === "achieved").length;
    const immediateCount = goals.filter((goal) => goal.horizon === "immediate").length;
    const longTermCount = goals.filter((goal) => goal.horizon === "long_term").length;

    return { activeCount, achievedCount, immediateCount, longTermCount };
  }, [goals]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.title.trim()) return;

    createMutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      status: formData.status,
      horizon: formData.horizon,
      targetDate: formData.targetDate ? new Date(formData.targetDate) : undefined,
      tags: formData.tags || undefined,
      categoryId: formData.categoryId,
      linkedProjectId: formData.linkedProjectId,
    });
  };

  const cycleGoalStatus = (goal: { id: number; status: GoalStatus; horizon: GoalHorizon; title: string }) => {
    const order: GoalStatus[] = ["active", "paused", "achieved", "archived"];
    const currentIndex = order.indexOf(goal.status);
    const nextStatus = order[(currentIndex + 1) % order.length];

    updateMutation.mutate({ id: goal.id, status: nextStatus });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <Card className="dev-soft-card p-6 shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Action layer</p>
              <h1 className="mt-2 text-[3rem] leading-none">Goals</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                Keep your active ambitions visible before they dissolve into scattered tasks. Goals clarify what matters now, what belongs to the current season, and what should remain on the long arc.
              </p>
            </div>
            <Button
              onClick={() => setShowForm((current) => !current)}
              className="h-11 rounded-full border-2 border-black bg-[#116d6d] px-5 text-white shadow-none hover:bg-[#0f5959]"
            >
              <Plus className="mr-2 h-4 w-4" />
              {showForm ? "Close composer" : "New goal"}
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="dev-stat-card bg-[#f5f3f0]">
              <div className="dev-pattern-waves h-3 w-full bg-[#116d6d]" />
              <div className="space-y-2 px-5 py-4">
                <div className="text-5xl font-black tracking-tight text-foreground">{String(summary.activeCount).padStart(2, "0")}</div>
                <p className="text-base font-medium text-foreground">Active goals</p>
              </div>
            </div>
            <div className="dev-stat-card bg-[#f5f3f0]">
              <div className="dev-pattern-dots h-3 w-full bg-[#efb93a]" />
              <div className="space-y-2 px-5 py-4">
                <div className="text-5xl font-black tracking-tight text-foreground">{String(summary.immediateCount).padStart(2, "0")}</div>
                <p className="text-base font-medium text-foreground">Immediate focus</p>
              </div>
            </div>
            <div className="dev-stat-card bg-[#f5f3f0]">
              <div className="dev-pattern-stripes h-3 w-full bg-[#e25b33]" />
              <div className="space-y-2 px-5 py-4">
                <div className="text-5xl font-black tracking-tight text-foreground">{String(summary.achievedCount).padStart(2, "0")}</div>
                <p className="text-base font-medium text-foreground">Achieved</p>
              </div>
            </div>
            <div className="dev-stat-card bg-[#f5f3f0]">
              <div className="dev-pattern-diamonds h-3 w-full bg-[#b55af3]" />
              <div className="space-y-2 px-5 py-4">
                <div className="text-5xl font-black tracking-tight text-foreground">{String(summary.longTermCount).padStart(2, "0")}</div>
                <p className="text-base font-medium text-foreground">Long term</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="dev-card p-5 shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Goal filters</p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Status</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`rounded-full border-2 border-black px-3 py-2 text-sm font-semibold ${statusFilter === "all" ? "bg-black text-white" : "bg-white text-black hover:bg-[#f6f3ec]"}`}
                >
                  All
                </button>
                {goalStatuses.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={`rounded-full border-2 border-black px-3 py-2 text-sm font-semibold ${statusFilter === option.value ? option.tone : "bg-white text-black hover:bg-[#f6f3ec]"}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Horizon</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setHorizonFilter("all")}
                  className={`rounded-full border-2 border-black px-3 py-2 text-sm font-semibold ${horizonFilter === "all" ? "bg-black text-white" : "bg-white text-black hover:bg-[#f6f3ec]"}`}
                >
                  All
                </button>
                {goalHorizons.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setHorizonFilter(option.value)}
                    className={`rounded-full border-2 border-black px-3 py-2 text-sm font-semibold ${horizonFilter === option.value ? "bg-[#f6f3ec] text-black" : "bg-white text-black hover:bg-[#f6f3ec]"}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {showForm && (
        <Card className="dev-card rounded-[1.6rem] bg-[#f5f3f0] p-6 shadow-none">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Goal title *</label>
                  <Input
                    value={formData.title}
                    onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                    placeholder="Name the outcome you are steering toward"
                    className="rounded-full border-2 border-black/85 bg-white shadow-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Why this matters</label>
                  <Textarea
                    value={formData.description}
                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                    placeholder="Describe the meaning, criteria, or tension that makes this goal worth keeping in view."
                    rows={4}
                    className="rounded-[1.2rem] border-2 border-black/85 bg-white shadow-none"
                  />
                </div>
                <CategorySelect
                  label="Johnny Decimal category"
                  value={formData.categoryId}
                  tree={taxonomyTree}
                  placeholder="Assign this goal to a seeded action category"
                  onChange={(categoryId) => setFormData({ ...formData, categoryId })}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {goalStatuses.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, status: option.value })}
                        className={`rounded-full border-2 border-black px-3 py-2 text-sm font-semibold ${formData.status === option.value ? option.tone : "bg-white text-black hover:bg-[#f6f3ec]"}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Horizon</label>
                  <div className="grid gap-2">
                    {goalHorizons.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, horizon: option.value })}
                        className={`rounded-[1rem] border px-3 py-3 text-left transition ${formData.horizon === option.value ? "border-black bg-[#f6f3ec]" : "border-black/10 bg-white hover:border-black/40"}`}
                      >
                        <p className="font-semibold text-foreground">{option.label}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{option.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Target date</label>
                  <Input
                    type="date"
                    value={formData.targetDate}
                    onChange={(event) => setFormData({ ...formData, targetDate: event.target.value })}
                    className="rounded-full border-2 border-black/85 bg-white shadow-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Anchor project</label>
                  <select
                    value={formData.linkedProjectId ?? ""}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        linkedProjectId: event.target.value ? Number(event.target.value) : undefined,
                      })
                    }
                    className="h-11 w-full rounded-full border-2 border-black/85 bg-white px-4 text-foreground shadow-none"
                  >
                    <option value="">No anchor project yet</option>
                    {projects.map((project: { id: number; title: string }) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Tags</label>
                  <Input
                    value={formData.tags}
                    onChange={(event) => setFormData({ ...formData, tags: event.target.value })}
                    placeholder="Comma-separated tags"
                    className="rounded-full border-2 border-black/85 bg-white shadow-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="h-11 rounded-full border-2 border-black bg-[#116d6d] px-5 text-white shadow-none hover:bg-[#0f5959]"
              >
                {createMutation.isPending ? "Saving..." : "Create goal"}
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

      <section className="grid gap-4 xl:grid-cols-2">
        {isLoading ? (
          <Card className="dev-card rounded-[1.6rem] p-10 text-center shadow-none xl:col-span-2">
            <p className="text-muted-foreground">Loading goals...</p>
          </Card>
        ) : filteredGoals.length === 0 ? (
          <Card className="dev-card rounded-[1.6rem] p-10 text-center shadow-none xl:col-span-2">
            <p className="text-muted-foreground">No goals match the current filters yet. Create one to shape the next layer of action.</p>
          </Card>
        ) : (
          filteredGoals.map((goal) => (
            <Card key={goal.id} className="dev-card overflow-hidden rounded-[1.6rem] p-0 shadow-none">
              <div className="flex items-center justify-between border-b-2 border-black px-5 py-4" style={{ backgroundColor: horizonAccentMap[(goal.horizon as GoalHorizon | undefined) || "seasonal"] }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/70">{(goal.horizon || "seasonal").replace("_", " ")}</p>
                  <p className="mt-1 text-lg font-semibold text-black">{goal.title}</p>
                </div>
                <span className={`rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusClassMap[(goal.status as GoalStatus | undefined) || "active"]}`}>
                  {goal.status || "active"}
                </span>
              </div>
              <div className="space-y-4 p-5">
                <p className="text-sm leading-7 text-muted-foreground">
                  {goal.description || "No description yet. Use this goal as a visible anchor for projects and tasks that should remain aligned with a bigger outcome."}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.1rem] border border-black/10 bg-[#f6f3ec] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Horizon</p>
                    <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-foreground">
                      <Compass className="h-4 w-4 text-[#116d6d]" />
                      {(goal.horizon || "seasonal").replace("_", " ")}
                    </p>
                  </div>
                  <div className="rounded-[1.1rem] border border-black/10 bg-[#f6f3ec] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Target date</p>
                    <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-foreground">
                      <Calendar className="h-4 w-4 text-[#e25b33]" />
                      {goal.targetDate instanceof Date ? goal.targetDate.toLocaleDateString() : "No date set"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {goal.tags
                    ? goal.tags.split(",").map((tag) => (
                        <span key={`${goal.id}-${tag}`} className="dev-chip">
                          {tag.trim()}
                        </span>
                      ))
                    : <span className="dev-chip">untagged</span>}
                  {goal.linkedProjectId ? <span className="dev-chip">Anchored to project #{goal.linkedProjectId}</span> : null}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={() => cycleGoalStatus({ id: goal.id, status: (goal.status as GoalStatus | undefined) || "active", horizon: (goal.horizon as GoalHorizon | undefined) || "seasonal", title: goal.title })}
                    className="h-10 rounded-full border-2 border-black bg-white px-4 text-black shadow-none hover:bg-[#f6f3ec]"
                  >
                    {goal.status === "paused" ? <PauseCircle className="mr-2 h-4 w-4" /> : <Target className="mr-2 h-4 w-4" />}
                    Advance status
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => deleteMutation.mutate({ id: goal.id })}
                    className="h-10 rounded-full border-2 border-black bg-white px-4 text-[#e25b33] shadow-none hover:bg-[#fff1eb]"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </section>

      <Card className="dev-card rounded-[1.6rem] p-5 shadow-none">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#bfd73d]">
            <Flag className="h-5 w-5 text-black" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Action guidance</p>
            <p className="mt-2 text-base leading-7 text-muted-foreground">
              A goal is useful when it changes what you choose to do next. Use the immediate and seasonal horizons to direct active projects, and reserve annual or long-term horizons for the ambitions that should keep shaping the knowledge system over time.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

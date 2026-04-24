import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trash2, CheckCircle2, Circle } from "lucide-react";

export default function Tasks() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    tags: "",
  });

  const { data: tasks = [], isLoading, refetch } = trpc.tasks.list.useQuery({});
  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      setFormData({ title: "", description: "", priority: "medium", dueDate: "", tags: "" });
      setShowForm(false);
      refetch();
    },
  });

  const updateMutation = trpc.tasks.update.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      priority: (formData.priority as any) || "medium",
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      tags: formData.tags || undefined,
    });
  };

  const priorityColors: Record<string, string> = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };

  const statusColors: Record<string, string> = {
    todo: "bg-gray-100 text-gray-800",
    "in-progress": "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    blocked: "bg-red-100 text-red-800",
  };

  const toggleComplete = (task: any) => {
    updateMutation.mutate({
      id: task.id,
      status: task.status === "completed" ? "todo" : "completed",
      completedDate: task.status === "completed" ? undefined : new Date(),
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="h-11 rounded-full border-2 border-black bg-[#059669] px-5 text-white shadow-none hover:bg-[#047857]"
        >
          {showForm ? "Cancel" : "+ New Task"}
        </Button>
      </div>

      {showForm && (
        <Card className="dev-card rounded-[1.5rem] bg-[#F5F3F0] p-6 shadow-none">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title"
                className="rounded-full border-2 border-black/85 bg-white shadow-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task details and context"
                rows={3}
                className="rounded-[1.2rem] border-2 border-black/85 bg-white shadow-none"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="h-10 w-full rounded-full border-2 border-black/85 bg-white px-4 text-foreground shadow-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Due Date</label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="rounded-full border-2 border-black/85 bg-white shadow-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Tags</label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Comma-separated tags"
                className="rounded-full border-2 border-black/85 bg-white shadow-none"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="h-11 rounded-full border-2 border-black bg-[#059669] px-5 text-white shadow-none hover:bg-[#047857]"
              >
                {createMutation.isPending ? "Creating..." : "Create Task"}
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
            <p className="text-muted-foreground">Loading tasks...</p>
          </Card>
        ) : tasks.length === 0 ? (
          <Card className="dev-card rounded-[1.5rem] p-12 text-center shadow-none">
            <p className="text-muted-foreground">No tasks yet. Create one to get started.</p>
          </Card>
        ) : (
          tasks.map((task: any) => (
            <Card
              key={task.id}
              className={`dev-card rounded-[1.5rem] bg-[#F5F3F0] p-4 shadow-none transition-all ${
                task.status === "completed" ? "opacity-60" : ""
              } hover:shadow-md`}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleComplete(task)}
                  className="mt-1 flex-shrink-0 text-muted-foreground hover:text-foreground"
                >
                  {task.status === "completed" ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <Circle className="h-6 w-6" />
                  )}
                </button>
                <div className="flex-1">
                  <h3
                    className={`text-lg font-bold ${
                      task.status === "completed"
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={statusColors[task.status] || "bg-gray-100 text-gray-800"}>
                      {task.status}
                    </Badge>
                    <Badge className={priorityColors[task.priority] || "bg-gray-100 text-gray-800"}>
                      {task.priority}
                    </Badge>
                    {task.tags && (
                      <>
                        {task.tags.split(",").map((tag: string) => (
                          <Badge key={tag} variant="outline" className="rounded-full">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </>
                    )}
                  </div>
                  {task.dueDate && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 flex-shrink-0 p-0 hover:bg-red-100"
                  onClick={() => deleteMutation.mutate({ id: task.id })}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}

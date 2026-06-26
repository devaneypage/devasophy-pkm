import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trash2, Edit2 } from "lucide-react";

export default function Projects() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    tags: "",
  });

  const { data: projects = [], isLoading, refetch } = trpc.projects.list.useQuery({});
  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      setFormData({ title: "", description: "", startDate: "", endDate: "", tags: "" });
      setShowForm(false);
      refetch();
    },
  });

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      tags: formData.tags || undefined,
    });
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    archived: "bg-gray-100 text-gray-800",
    "on-hold": "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Projects</h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="h-11 rounded-full border-2 border-black bg-[#7c3aed] px-5 text-white shadow-none hover:bg-[#6d28d9]"
        >
          {showForm ? "Cancel" : "+ New Project"}
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
                placeholder="Project title"
                className="rounded-full border-2 border-black/85 bg-white shadow-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project description and goals"
                rows={3}
                className="rounded-[1.2rem] border-2 border-black/85 bg-white shadow-none"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Start Date</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="rounded-full border-2 border-black/85 bg-white shadow-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">End Date</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
                className="h-11 rounded-full border-2 border-black bg-[#7c3aed] px-5 text-white shadow-none hover:bg-[#6d28d9]"
              >
                {createMutation.isPending ? "Creating..." : "Create Project"}
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
            <p className="text-muted-foreground">Loading projects...</p>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="dev-card rounded-[1.5rem] p-12 text-center shadow-none">
            <p className="text-muted-foreground">No projects yet. Create one to get started.</p>
          </Card>
        ) : (
          projects.map((project: any) => (
            <Card
              key={project.id}
              className="dev-card rounded-[1.5rem] bg-[#F5F3F0] p-4 shadow-none transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{project.title}</h3>
                  {project.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={statusColors[project.status] || "bg-gray-100 text-gray-800"}>
                      {project.status}
                    </Badge>
                    {project.tags && (
                      <>
                        {project.tags.split(",").map((tag: string) => (
                          <Badge key={tag} variant="outline" className="rounded-full">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </>
                    )}
                  </div>
                  {(project.startDate || project.endDate) && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {project.startDate && new Date(project.startDate).toLocaleDateString()}
                      {project.endDate && ` → ${new Date(project.endDate).toLocaleDateString()}`}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-red-100"
                    onClick={() => deleteMutation.mutate({ id: project.id })}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}

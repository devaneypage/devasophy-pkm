import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, Trash2, CheckCircle2, Circle } from "lucide-react";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "active" as const,
    startDate: "",
    endDate: "",
  });

  const projectId = params?.id ? parseInt(params.id) : null;
  const { data: project } = trpc.projects.get.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  const updateMutation = trpc.projects.update.useMutation();
  const deleteMutation = trpc.projects.delete.useMutation();

  const handleEdit = () => {
    if (project) {
      setFormData({
        title: project.title,
        description: project.description || "",
        status: project.status || "active",
        startDate: project.startDate ? new Date(project.startDate as number).toISOString().split("T")[0] : "",
        endDate: project.endDate ? new Date(project.endDate as number).toISOString().split("T")[0] : "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (projectId) {
      await updateMutation.mutateAsync({
        id: projectId,
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).getTime() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).getTime() : undefined,
      });
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (projectId && confirm("Are you sure you want to delete this project?")) {
      await deleteMutation.mutateAsync({ id: projectId });
      window.location.href = "/projects";
    }
  };

  if (!project) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="mt-6 text-center text-gray-500">Project not found</div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    archived: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {isEditing ? (
        <Card className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {project.title}
            </h1>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  statusColors[project.status || "active"]
                }`}
              >
                {project.status || "active"}
              </span>
              {project.status === "completed" && (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              )}
            </div>
          </div>

          {project.description && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Description
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {project.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {project.startDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Start Date
                </h3>
                <p className="text-gray-900">
                  {new Date(project.startDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {project.endDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  End Date
                </h3>
                <p className="text-gray-900">
                  {new Date(project.endDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Created
            </h3>
            <p className="text-gray-900">
              {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

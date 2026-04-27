import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, Trash2, CheckCircle2, Circle, AlertCircle } from "lucide-react";

export default function TaskDetail() {
  const [, params] = useRoute("/tasks/:id");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo" as const,
    priority: "medium" as const,
    dueDate: "",
    projectId: 0,
  });

  const taskId = params?.id ? parseInt(params.id) : null;
  const { data: task } = trpc.tasks.get.useQuery(
    { id: taskId! },
    { enabled: !!taskId }
  );
  const { data: projects } = trpc.projects.list.useQuery({});

  const updateMutation = trpc.tasks.update.useMutation();
  const deleteMutation = trpc.tasks.delete.useMutation();

  const handleEdit = () => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        dueDate: task.dueDate ? new Date(task.dueDate as number).toISOString().split("T")[0] : "",
        projectId: task.projectId || 0,
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (taskId) {
      await updateMutation.mutateAsync({
        id: taskId,
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() as any : undefined,
      });
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (taskId && confirm("Are you sure you want to delete this task?")) {
      await deleteMutation.mutateAsync({ id: taskId });
      window.location.href = "/tasks";
    }
  };

  if (!task) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="mt-6 text-center text-gray-500">Task not found</div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    todo: "bg-gray-100 text-gray-800",
    "in-progress": "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    blocked: "bg-red-100 text-red-800",
  };

  const priorityColors: Record<string, string> = {
    low: "text-green-600",
    medium: "text-yellow-600",
    high: "text-orange-600",
    urgent: "text-red-600",
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
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project
              </label>
              <select
                value={formData.projectId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    projectId: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value={0}>No Project</option>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
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
              {task.title}
            </h1>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  statusColors[task.status || "todo"]
                }`}
              >
                {task.status?.replace("-", " ") || "todo"}
              </span>
              <span className={`text-sm font-semibold ${priorityColors[task.priority || "medium"]}`}>
                {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1) || "Medium"} Priority
              </span>
              {task.status === "completed" && (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              )}
              {task.status === "blocked" && (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
          </div>

          {task.description && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Description
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {task.dueDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Due Date
                </h3>
                <p className="text-gray-900">
                  {new Date(task.dueDate as number).toLocaleDateString()}
                </p>
              </div>
            )}
            {task.projectId && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Project
                </h3>
                <p className="text-gray-900">
                  {projects?.find((p: any) => p.id === task.projectId)?.title || "Unknown"}
                </p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Created
            </h3>
            <p className="text-gray-900">
              {new Date(task.createdAt).toLocaleDateString()}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

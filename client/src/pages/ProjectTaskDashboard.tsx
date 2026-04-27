import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export default function ProjectTaskDashboard() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const { data: projects } = trpc.projects.list.useQuery({});
  const { data: tasks } = trpc.tasks.list.useQuery({});

  // Calculate project statistics
  const projectStats = projects?.map((project) => {
    const projectTasks = tasks?.filter((t) => t.projectId === project.id) || [];
    const completed = projectTasks.filter((t) => t.status === "completed").length;
    const inProgress = projectTasks.filter((t) => t.status === "in-progress").length;
    const blocked = projectTasks.filter((t) => t.status === "blocked").length;
    const todo = projectTasks.filter((t) => t.status === "todo").length;

    return {
      ...project,
      taskCount: projectTasks.length,
      completed,
      inProgress,
      blocked,
      todo,
      progress: projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0,
    };
  }) || [];

  // Get tasks for selected project
  const selectedProjectTasks = selectedProject
    ? tasks?.filter((t) => t.projectId === selectedProject) || []
    : [];

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
      <div className="flex items-center gap-2">
        <BarChart3 className="w-8 h-8 text-amber-600" />
        <h1 className="text-3xl font-bold">Project Task Dashboard</h1>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-sm text-blue-700 font-medium mb-1">Total Projects</div>
          <div className="text-3xl font-bold text-blue-900">{projects?.length || 0}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
          <div className="text-sm text-green-700 font-medium mb-1">Total Tasks</div>
          <div className="text-3xl font-bold text-green-900">{tasks?.length || 0}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="text-sm text-orange-700 font-medium mb-1">In Progress</div>
          <div className="text-3xl font-bold text-orange-900">
            {tasks?.filter((t) => t.status === "in-progress").length || 0}
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="text-sm text-purple-700 font-medium mb-1">Completed</div>
          <div className="text-3xl font-bold text-purple-900">
            {tasks?.filter((t) => t.status === "completed").length || 0}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Projects</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {projectStats.length === 0 ? (
                <p className="text-gray-500 text-sm">No projects yet</p>
              ) : (
                projectStats.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedProject === project.id
                        ? "bg-amber-100 border-2 border-amber-600"
                        : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-medium text-gray-900 truncate">{project.title}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {project.taskCount} tasks • {project.progress}% complete
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-amber-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Tasks for Selected Project */}
        <div className="lg:col-span-2">
          {selectedProject ? (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Tasks for {projectStats.find((p) => p.id === selectedProject)?.title}
              </h2>

              {selectedProjectTasks.length === 0 ? (
                <p className="text-gray-500 text-sm">No tasks for this project</p>
              ) : (
                <div className="space-y-3">
                  {selectedProjectTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                        {task.status === "completed" && (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                        )}
                        {task.status === "blocked" && (
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 ml-2" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                            statusColors[task.status || "todo"]
                          }`}
                        >
                          {task.status?.replace("-", " ") || "todo"}
                        </span>
                        <span className={`text-xs font-semibold ${priorityColors[task.priority || "medium"]}`}>
                          {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1) || "Medium"}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(task.dueDate as number).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 flex items-center justify-center h-96">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a project to view its tasks</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Task Status Overview */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Task Status Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 font-medium mb-2">To Do</div>
            <div className="text-2xl font-bold text-gray-900">
              {tasks?.filter((t) => t.status === "todo").length || 0}
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 font-medium mb-2">In Progress</div>
            <div className="text-2xl font-bold text-blue-900">
              {tasks?.filter((t) => t.status === "in-progress").length || 0}
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-600 font-medium mb-2">Completed</div>
            <div className="text-2xl font-bold text-green-900">
              {tasks?.filter((t) => t.status === "completed").length || 0}
            </div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-sm text-red-600 font-medium mb-2">Blocked</div>
            <div className="text-2xl font-bold text-red-900">
              {tasks?.filter((t) => t.status === "blocked").length || 0}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

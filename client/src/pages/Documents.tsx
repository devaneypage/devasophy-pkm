import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Trash2, ChevronRight } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function Documents() {
  const [showForm, setShowForm] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    project: "",
    folder: "",
    status: "draft" as const,
  });
  const [editContent, setEditContent] = useState("");

  const { data: documents, isLoading, refetch } = trpc.documents.list.useQuery({
    status: undefined,
  });

  const { data: selectedDoc } = trpc.documents.get.useQuery(
    { id: selectedDocId! },
    { enabled: selectedDocId !== null }
  );

  const createMutation = trpc.documents.create.useMutation({
    onSuccess: () => {
      refetch();
      setFormData({
        title: "",
        project: "",
        folder: "",
        status: "draft",
      });
      setShowForm(false);
    },
  });

  const updateMutation = trpc.documents.update.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedDocId(null);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    createMutation.mutate({
      ...formData,
      uuid: uuidv4(),
    });
  };

  const handleSaveContent = () => {
    if (selectedDocId) {
      updateMutation.mutate({
        id: selectedDocId,
        content: editContent,
      });
    }
  };

  const filteredDocs = documents?.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar - Documents List */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Documents</h2>
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus size={16} />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 text-muted-foreground" size={16} />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="p-4 border-b border-border space-y-3 bg-background/50">
            <form onSubmit={handleCreateSubmit} className="space-y-2">
              <div>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Document title"
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div>
                <Input
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  placeholder="Project"
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1">
                  Create
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : filteredDocs && filteredDocs.length > 0 ? (
            <div className="space-y-1 p-2">
              {filteredDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                    selectedDocId === doc.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate font-medium">{doc.title}</span>
                    <ChevronRight size={16} />
                  </div>
                  {doc.project && (
                    <div className="text-xs text-muted-foreground mt-1">{doc.project}</div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No documents yet
            </div>
          )}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {selectedDocId && selectedDoc ? (
          <>
            {/* Document Header */}
            <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{selectedDoc.title}</h1>
                {selectedDoc.project && (
                  <p className="text-sm text-muted-foreground">{selectedDoc.project}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveContent}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => deleteMutation.mutate({ id: selectedDocId })}
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 p-6 overflow-hidden">
              <Textarea
                value={editContent || selectedDoc.content || ""}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Write your document in Markdown..."
                className="w-full h-full resize-none font-mono text-sm"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Select a document to edit</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus size={20} className="mr-2" />
                Create New Document
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, FileText, Plus, Search, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const statusColors: Record<string, string> = {
  draft: "#efb93a",
  in_progress: "#56c5ea",
  completed: "#bfd73d",
  archived: "#b55af3",
};

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

  useEffect(() => {
    if (selectedDoc) {
      setEditContent(selectedDoc.content || "");
    }
  }, [selectedDoc?.id, selectedDoc?.content]);

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
      setEditContent("");
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
    if (!selectedDocId) return;

    updateMutation.mutate({
      id: selectedDocId,
      content: editContent,
    });
  };

  const filteredDocs = documents?.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid min-h-[calc(100vh-9rem)] gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <aside className="dev-card flex min-h-[40rem] flex-col overflow-hidden rounded-[1.6rem] p-0 shadow-none">
        <div className="border-b-2 border-black bg-[#116d6d] px-5 py-5 text-white">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Module 03</p>
              <h2 className="mt-1 text-[2rem] leading-none text-white">Research Studio</h2>
            </div>
            <Button
              size="sm"
              onClick={() => setShowForm((current) => !current)}
              className="h-10 rounded-full border-2 border-black bg-white px-4 text-black shadow-none hover:bg-[#f6f3ec]"
            >
              <Plus className="mr-1 h-4 w-4" />
              New
            </Button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
            <Input
              placeholder="Search documents"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 rounded-full border-2 border-black/70 bg-white pl-11 text-black shadow-none placeholder:text-black/45"
            />
          </div>
        </div>

        {showForm && (
          <div className="border-b border-black/10 bg-[#f6f3ec] p-4">
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Document title"
                className="rounded-full border-2 border-black/85 bg-white shadow-none"
                required
              />
              <Input
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                placeholder="Project"
                className="rounded-full border-2 border-black/85 bg-white shadow-none"
              />
              <Input
                value={formData.folder}
                onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                placeholder="Folder"
                className="rounded-full border-2 border-black/85 bg-white shadow-none"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="h-10 rounded-full border-2 border-black bg-[#e25b33] px-4 text-white shadow-none hover:bg-[#d6522d]"
                >
                  Create document
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  className="h-10 rounded-full border-2 border-black bg-white px-4 text-black shadow-none hover:bg-white"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-muted-foreground">Loading documents…</div>
          ) : filteredDocs && filteredDocs.length > 0 ? (
            <div className="space-y-3">
              {filteredDocs.map((doc, index) => {
                const active = selectedDocId === doc.id;
                const statusColor = statusColors[doc.status || "draft"] || "#efb93a";
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full overflow-hidden rounded-[1.2rem] border-2 border-black bg-white text-left shadow-none transition ${active ? "-translate-y-0.5" : "hover:-translate-y-0.5"}`}
                  >
                    <div
                      className={`${index % 3 === 0 ? "dev-pattern-waves" : index % 3 === 1 ? "dev-pattern-dots" : "dev-pattern-diamonds"} flex items-center justify-between px-4 py-3`}
                      style={{ backgroundColor: active ? statusColor : "#f6f3ec" }}
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-black">
                        {doc.project || "Writing project"}
                      </span>
                      <ChevronRight className="h-4 w-4 text-black" />
                    </div>
                    <div className="space-y-2 px-4 py-4">
                      <p className="text-xl font-bold leading-tight text-foreground">{doc.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        <span>{doc.folder || "General"}</span>
                        <span>•</span>
                        <span>{(doc.status || "draft").replace("_", " ")}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.2rem] border border-black/10 bg-white p-5 text-sm leading-6 text-muted-foreground">
              No documents yet. Create your first research file to begin writing inside the studio.
            </div>
          )}
        </div>
      </aside>

      <section className="grid gap-6 lg:grid-rows-[auto_minmax(0,1fr)]">
        {selectedDocId && selectedDoc ? (
          <>
            <div className="dev-soft-card flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Editorial document</p>
                <h1 className="text-[3rem] leading-none">{selectedDoc.title}</h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedDoc.project && <span className="dev-chip">{selectedDoc.project}</span>}
                  {selectedDoc.folder && <span className="dev-chip">{selectedDoc.folder}</span>}
                  <span className="dev-chip">{(selectedDoc.status || "draft").replace("_", " ")}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSaveContent}
                  disabled={updateMutation.isPending}
                  className="h-11 rounded-full border-2 border-black bg-[#116d6d] px-5 text-white shadow-none hover:bg-[#0f5959]"
                >
                  {updateMutation.isPending ? "Saving..." : "Save draft"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => deleteMutation.mutate({ id: selectedDocId })}
                  className="h-11 rounded-full border-2 border-black bg-white px-5 text-[#e25b33] shadow-none hover:bg-[#fff1eb]"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="grid min-h-[32rem] gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
              <Card className="dev-card rounded-[1.6rem] p-0 shadow-none">
                <div className="border-b-2 border-black px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Markdown editor</p>
                </div>
                <div className="p-5">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Write your document in Markdown..."
                    className="min-h-[28rem] w-full resize-none rounded-[1.3rem] border-2 border-black/85 bg-white font-mono text-sm leading-7 shadow-none"
                  />
                </div>
              </Card>

              <aside className="dev-card rounded-[1.6rem] p-5 shadow-none">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#56c5ea]">
                    <FileText className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Reference lane</p>
                    <p className="text-lg font-semibold text-foreground">Linked writing context</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <div className="rounded-[1.1rem] border border-black/10 bg-[#f6f3ec] p-4">
                    Pull notebook excerpts, Clavis Aurea terms, and project notes into the editor as you draft.
                  </div>
                  <div className="rounded-[1.1rem] border border-black/10 bg-white p-4">
                    Project: <span className="font-semibold text-foreground">{selectedDoc.project || "General research"}</span>
                  </div>
                  <div className="rounded-[1.1rem] border border-black/10 bg-white p-4">
                    Folder: <span className="font-semibold text-foreground">{selectedDoc.folder || "Working drafts"}</span>
                  </div>
                </div>
              </aside>
            </div>
          </>
        ) : (
          <div className="dev-soft-card flex min-h-[32rem] flex-col items-center justify-center p-8 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-black bg-[#56c5ea]">
              <FileText className="h-7 w-7 text-black" />
            </div>
            <h1 className="mb-3 text-[3rem] leading-none">Select a document</h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              Choose a project draft from the left panel, or create a new document to begin writing inside the Devanomy research studio.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="mt-6 h-11 rounded-full border-2 border-black bg-[#e25b33] px-5 text-white shadow-none hover:bg-[#d6522d]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create new document
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

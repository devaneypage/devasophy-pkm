import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Edit2, Trash2, Link2 } from "lucide-react";

export default function NotebookDetail() {
  const [, params] = useRoute("/notebook/:id");
  const entryId = params?.id ? parseInt(params.id) : null;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    text: "",
    author: "",
    work: "",
    sourceType: "",
    location: "",
    note: "",
    tags: "",
  });

  const { data: entry, isLoading } = trpc.notebook.get.useQuery(
    { id: entryId! },
    { enabled: entryId !== null }
  );

  const updateMutation = trpc.notebook.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
    },
  });

  const deleteMutation = trpc.notebook.delete.useMutation();

  const { data: linkedEntries } = trpc.links.list.useQuery(
    { sourceType: "notebook", sourceId: entryId! },
    { enabled: entryId !== null }
  );

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!entry) {
    return <div className="p-6">Entry not found</div>;
  }

  const handleSave = () => {
    if (entryId) {
      updateMutation.mutate({
        id: entryId,
        ...editData,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-2xl font-bold">Entry Detail</h1>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <Button onClick={() => {
                setEditData({
                  text: entry.text,
                  author: entry.author || "",
                  work: entry.work || "",
                  sourceType: entry.sourceType || "",
                  location: entry.location || "",
                  note: entry.note || "",
                  tags: entry.tags || "",
                });
                setIsEditing(true);
              }}>
                <Edit2 size={16} className="mr-2" />
                Edit
              </Button>
              <Button variant="outline" onClick={() => deleteMutation.mutate({ id: entryId! })}>
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {isEditing ? (
          // Edit Mode
          <div className="space-y-6">
            <Card className="bg-card border-border p-6">
              <h2 className="text-lg font-bold mb-4">Edit Entry</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Quote or Passage</label>
                  <Textarea
                    value={editData.text}
                    onChange={(e) => setEditData({ ...editData, text: e.target.value })}
                    className="h-32"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Author</label>
                    <Input
                      value={editData.author}
                      onChange={(e) => setEditData({ ...editData, author: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Work</label>
                    <Input
                      value={editData.work}
                      onChange={(e) => setEditData({ ...editData, work: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Source Type</label>
                    <Input
                      value={editData.sourceType}
                      onChange={(e) => setEditData({ ...editData, sourceType: e.target.value })}
                      placeholder="Book, Article, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <Input
                      value={editData.location}
                      onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                      placeholder="Page, timestamp, etc."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <Input
                    value={editData.tags}
                    onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                    placeholder="Comma-separated tags"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <Textarea
                    value={editData.note}
                    onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                    className="h-24"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          // View Mode
          <div className="space-y-6">
            {/* Main Quote */}
            <Card className="bg-card border-border p-8 border-l-4 border-l-primary">
              <blockquote className="text-2xl font-serif italic text-foreground mb-4">
                "{entry.text}"
              </blockquote>
              {entry.author && (
                <p className="text-sm text-muted-foreground">— {entry.author}</p>
              )}
            </Card>

            {/* Metadata */}
            <Card className="bg-card border-border p-6">
              <h2 className="text-lg font-bold mb-4">Source Information</h2>
              <div className="grid grid-cols-2 gap-4">
                {entry.work && (
                  <div>
                    <p className="text-sm text-muted-foreground">Work</p>
                    <p className="font-medium">{entry.work}</p>
                  </div>
                )}
                {entry.sourceType && (
                  <div>
                    <p className="text-sm text-muted-foreground">Source Type</p>
                    <p className="font-medium">{entry.sourceType}</p>
                  </div>
                )}
                {entry.location && (
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{entry.location}</p>
                  </div>
                )}
                {entry.createdAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Added</p>
                    <p className="font-medium">{new Date(entry.createdAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Tags */}
            {entry.tags && (
              <Card className="bg-card border-border p-6">
                <h2 className="text-lg font-bold mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {entry.tags.split(",").map((tag) => (
                    <span
                      key={tag.trim()}
                      className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Notes */}
            {entry.note && (
              <Card className="bg-card border-border p-6">
                <h2 className="text-lg font-bold mb-4">Notes</h2>
                <p className="text-foreground whitespace-pre-wrap">{entry.note}</p>
              </Card>
            )}

            {/* Linked References */}
            {linkedEntries && linkedEntries.length > 0 && (
              <Card className="bg-card border-border p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Link2 size={20} />
                  Linked References
                </h2>
                <div className="space-y-2">
                  {linkedEntries.map((link: any) => (
                    <div
                      key={link.id}
                      className="p-3 bg-background rounded border border-border hover:border-primary transition-colors"
                    >
                      <p className="text-sm text-muted-foreground">{link.linkType}</p>
                      <p className="font-medium">{link.targetType}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

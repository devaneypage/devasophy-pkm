import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Trash2, Heart } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function Notebook() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    text: "",
    author: "",
    work: "",
    sourceType: "",
    location: "",
    note: "",
    tags: "",
    collections: "",
    favorite: false,
  });

  const { data: entries, isLoading, refetch } = trpc.notebook.list.useQuery({
    search: searchTerm,
  });

  const createMutation = trpc.notebook.create.useMutation({
    onSuccess: () => {
      refetch();
      setFormData({
        text: "",
        author: "",
        work: "",
        sourceType: "",
        location: "",
        note: "",
        tags: "",
        collections: "",
        favorite: false,
      });
      setShowForm(false);
    },
  });

  const deleteMutation = trpc.notebook.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim()) return;

    createMutation.mutate({
      ...formData,
      uuid: uuidv4(),
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Commonplace Notebook</h1>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus size={20} className="mr-2" />
              New Entry
            </Button>
          </div>
          <p className="text-muted-foreground">
            Capture quotes, passages, and observations with full source metadata
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
            <Input
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card className="bg-card border-border p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">New Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quote or Passage *</label>
                <Textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Enter the quote or passage..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Author</label>
                  <Input
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Author name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Work/Source</label>
                  <Input
                    value={formData.work}
                    onChange={(e) => setFormData({ ...formData, work: e.target.value })}
                    placeholder="Book, article, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Source Type</label>
                  <Input
                    value={formData.sourceType}
                    onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                    placeholder="Book, Article, Web, Video, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Page number, timestamp, URL"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Personal Notes</label>
                <Textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Your thoughts and reflections..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Comma-separated tags"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Collection</label>
                  <Input
                    value={formData.collections}
                    onChange={(e) => setFormData({ ...formData, collections: e.target.value })}
                    placeholder="Collection name"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Entry"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Entries List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading entries...</p>
            </div>
          ) : entries && entries.length > 0 ? (
            entries.map((entry) => (
              <Card
                key={entry.id}
                className="bg-card border-border p-6 hover:border-primary transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-lg mb-2 italic text-foreground">"{entry.text}"</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                      {entry.author && <span>— {entry.author}</span>}
                      {entry.work && <span>from {entry.work}</span>}
                      {entry.location && <span>({entry.location})</span>}
                    </div>
                    {entry.note && (
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Note:</strong> {entry.note}
                      </p>
                    )}
                    {entry.tags && (
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.split(",").map((tag) => (
                          <span
                            key={tag}
                            className="inline-block px-2 py-1 bg-primary/20 text-primary text-xs rounded"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-background rounded-md transition-colors">
                      <Heart
                        size={20}
                        className={entry.favorite ? "fill-primary text-primary" : "text-muted-foreground"}
                      />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate({ id: entry.id })}
                      className="p-2 hover:bg-background rounded-md transition-colors text-destructive"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="bg-card/50 border-border p-12 text-center">
              <p className="text-muted-foreground">No entries yet. Create your first entry to get started!</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

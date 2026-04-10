import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Trash2, ChevronDown } from "lucide-react";

export default function Lexicon() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    term: "",
    partOfSpeech: "",
    definition: "",
    etymology: "",
    origin: "",
    sourceType: "",
    imageNum: "",
    notes: "",
  });

  const { data: entries, isLoading, refetch } = trpc.lexicon.list.useQuery({
    search: searchTerm,
  });

  const createMutation = trpc.lexicon.create.useMutation({
    onSuccess: () => {
      refetch();
      setFormData({
        term: "",
        partOfSpeech: "",
        definition: "",
        etymology: "",
        origin: "",
        sourceType: "",
        imageNum: "",
        notes: "",
      });
      setShowForm(false);
    },
  });

  const deleteMutation = trpc.lexicon.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.term.trim()) return;

    createMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Clavis Aurea</h1>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus size={20} className="mr-2" />
              New Term
            </Button>
          </div>
          <p className="text-muted-foreground">
            Personal lexicon and concordance with alphabetical indexing and cross-references
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
              placeholder="Search terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card className="bg-card border-border p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">New Lexicon Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Term *</label>
                  <Input
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    placeholder="Enter the term..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Part of Speech</label>
                  <Input
                    value={formData.partOfSpeech}
                    onChange={(e) => setFormData({ ...formData, partOfSpeech: e.target.value })}
                    placeholder="noun, verb, adjective, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Definition</label>
                <Textarea
                  value={formData.definition}
                  onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                  placeholder="Enter the definition..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Etymology</label>
                  <Textarea
                    value={formData.etymology}
                    onChange={(e) => setFormData({ ...formData, etymology: e.target.value })}
                    placeholder="Word origin and history..."
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Origin</label>
                  <Input
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="Language or source of origin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Source Type</label>
                  <Input
                    value={formData.sourceType}
                    onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                    placeholder="Book, Article, Web, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Image Number</label>
                  <Input
                    value={formData.imageNum}
                    onChange={(e) => setFormData({ ...formData, imageNum: e.target.value })}
                    placeholder="Reference image number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes and examples..."
                  rows={2}
                />
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

        {/* Terms List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading terms...</p>
            </div>
          ) : entries && entries.length > 0 ? (
            entries.map((entry) => (
              <Card
                key={entry.id}
                className="bg-card border-border hover:border-primary transition-all"
              >
                <div
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-primary">{entry.term}</h3>
                      {entry.partOfSpeech && (
                        <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                          {entry.partOfSpeech}
                        </span>
                      )}
                    </div>
                    {entry.definition && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {entry.definition}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate({ id: entry.id });
                      }}
                      className="p-2 hover:bg-background rounded-md transition-colors text-destructive"
                    >
                      <Trash2 size={20} />
                    </button>
                    <ChevronDown
                      size={20}
                      className={`transition-transform ${expandedId === entry.id ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>

                {expandedId === entry.id && (
                  <div className="border-t border-border px-4 py-4 space-y-3 bg-background/50">
                    {entry.definition && (
                      <div>
                        <h4 className="text-sm font-semibold text-primary mb-1">Definition</h4>
                        <p className="text-sm text-foreground">{entry.definition}</p>
                      </div>
                    )}
                    {entry.etymology && (
                      <div>
                        <h4 className="text-sm font-semibold text-primary mb-1">Etymology</h4>
                        <p className="text-sm text-foreground">{entry.etymology}</p>
                      </div>
                    )}
                    {entry.origin && (
                      <div>
                        <h4 className="text-sm font-semibold text-primary mb-1">Origin</h4>
                        <p className="text-sm text-foreground">{entry.origin}</p>
                      </div>
                    )}
                    {entry.notes && (
                      <div>
                        <h4 className="text-sm font-semibold text-primary mb-1">Notes</h4>
                        <p className="text-sm text-foreground">{entry.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card className="bg-card/50 border-border p-12 text-center">
              <p className="text-muted-foreground">No terms yet. Add your first lexicon entry!</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

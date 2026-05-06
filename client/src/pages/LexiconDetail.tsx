import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Edit2, Trash2, Link2 } from "lucide-react";
import ZettelkastenIdDisplay from "@/components/ZettelkastenIdDisplay";
import { formatSemanticLinkDisplay } from "@shared/linkSemantics";

export default function LexiconDetail() {
  const [, params] = useRoute("/lexicon/:id");
  const termId = params?.id ? parseInt(params.id) : null;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    term: "",
    partOfSpeech: "",
    definition: "",
    etymology: "",
    origin: "",
    sourceType: "",
    notes: "",
  });

  const { data: term, isLoading } = trpc.lexicon.get.useQuery(
    { id: termId! },
    { enabled: termId !== null }
  );

  const updateMutation = trpc.lexicon.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
    },
  });

  const deleteMutation = trpc.lexicon.delete.useMutation();

  const { data: linkedEntries } = trpc.links.list.useQuery(
    { sourceType: "lexicon", sourceId: termId! },
    { enabled: termId !== null }
  );

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!term) {
    return <div className="p-6">Term not found</div>;
  }

  const handleSave = () => {
    if (termId) {
      updateMutation.mutate({
        id: termId,
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
          <h1 className="text-2xl font-bold">Term Detail</h1>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <Button onClick={() => {
                setEditData({
                  term: term.term,
                  partOfSpeech: term.partOfSpeech || "",
                  definition: term.definition || "",
                  etymology: term.etymology || "",
                  origin: term.origin || "",
                  sourceType: term.sourceType || "",
                  notes: term.notes || "",
                });
                setIsEditing(true);
              }}>
                <Edit2 size={16} className="mr-2" />
                Edit
              </Button>
              <Button variant="outline" onClick={() => deleteMutation.mutate({ id: termId! })}>
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
              <h2 className="text-lg font-bold mb-4">Edit Term</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Term</label>
                  <Input
                    value={editData.term}
                    onChange={(e) => setEditData({ ...editData, term: e.target.value })}
                    className="text-lg font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Part of Speech</label>
                    <Input
                      value={editData.partOfSpeech}
                      onChange={(e) => setEditData({ ...editData, partOfSpeech: e.target.value })}
                      placeholder="noun, verb, adjective, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Source Type</label>
                    <Input
                      value={editData.sourceType}
                      onChange={(e) => setEditData({ ...editData, sourceType: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Definition</label>
                  <Textarea
                    value={editData.definition}
                    onChange={(e) => setEditData({ ...editData, definition: e.target.value })}
                    className="h-24"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Etymology</label>
                    <Textarea
                      value={editData.etymology}
                      onChange={(e) => setEditData({ ...editData, etymology: e.target.value })}
                      className="h-20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Origin</label>
                    <Input
                      value={editData.origin}
                      onChange={(e) => setEditData({ ...editData, origin: e.target.value })}
                      placeholder="Language or region"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <Textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
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
            {/* Term Header */}
            <div>
              <h1 className="text-4xl font-bold font-serif mb-2">{term.term}</h1>
              {term.partOfSpeech && (
                <p className="text-sm text-muted-foreground italic">{term.partOfSpeech}</p>
              )}
            </div>

            {/* Zettelkasten ID */}
            <Card className="bg-card border-border p-6">
              <h2 className="text-lg font-bold mb-4">Identifier</h2>
              <ZettelkastenIdDisplay zettelkastenId={term.zettelkastenId} />
            </Card>

            {/* Definition */}
            {term.definition && (
              <Card className="bg-card border-border p-6 border-l-4 border-l-primary">
                <h2 className="text-lg font-bold mb-2">Definition</h2>
                <p className="text-foreground leading-relaxed">{term.definition}</p>
              </Card>
            )}

            {/* Etymology & Origin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {term.etymology && (
                <Card className="bg-card border-border p-6">
                  <h2 className="text-lg font-bold mb-2">Etymology</h2>
                  <p className="text-foreground text-sm leading-relaxed">{term.etymology}</p>
                </Card>
              )}
              {term.origin && (
                <Card className="bg-card border-border p-6">
                  <h2 className="text-lg font-bold mb-2">Origin</h2>
                  <p className="text-foreground text-sm">{term.origin}</p>
                </Card>
              )}
            </div>

            {/* Metadata */}
            <Card className="bg-card border-border p-6">
              <h2 className="text-lg font-bold mb-4">Information</h2>
              <div className="grid grid-cols-2 gap-4">
                {term.sourceType && (
                  <div>
                    <p className="text-sm text-muted-foreground">Source Type</p>
                    <p className="font-medium">{term.sourceType}</p>
                  </div>
                )}
                {term.createdAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Added</p>
                    <p className="font-medium">{new Date(term.createdAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Notes */}
            {term.notes && (
              <Card className="bg-card border-border p-6">
                <h2 className="text-lg font-bold mb-4">Notes</h2>
                <p className="text-foreground whitespace-pre-wrap">{term.notes}</p>
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
                      <p className="text-sm text-muted-foreground">Relationship</p>
                      <p className="font-medium">{formatSemanticLinkDisplay(link.linkType, link.targetType)}</p>
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

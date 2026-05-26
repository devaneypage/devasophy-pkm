import React from "react";
import { BookOpen, Library, Network, PenSquare, Search as SearchIcon, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type ConstellationNode = {
  id: string;
  kind: "notebook" | "lexicon" | "document";
  title: string;
  preview: string;
  tags: string[];
  accent: string;
  linkedLabel: string;
};

const moduleMeta = {
  notebook: {
    label: "Commonplace Notebook",
    icon: BookOpen,
    accent: "#efb93a",
  },
  lexicon: {
    label: "Clavis Aurea",
    icon: Library,
    accent: "#56c5ea",
  },
  document: {
    label: "Writing Studio",
    icon: PenSquare,
    accent: "#e25b33",
  },
} as const;

function tokenize(value?: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

export default function Search() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState<string>("all");
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

  const { data: notebook = [] } = trpc.notebook.list.useQuery({});
  const { data: lexicon = [] } = trpc.lexicon.list.useQuery({});
  const { data: documents = [] } = trpc.documents.list.useQuery({});

  const nodes = React.useMemo<ConstellationNode[]>(() => {
    return [
      ...notebook.slice(0, 24).map((entry: any) => ({
        id: `notebook-${entry.id}`,
        kind: "notebook" as const,
        title: entry.text?.slice(0, 72) || "Untitled note",
        preview: entry.note || entry.text || "",
        tags: [...tokenize(entry.tags), ...tokenize(entry.collections)],
        accent: moduleMeta.notebook.accent,
        linkedLabel: entry.author || entry.collections || "Notebook entry",
      })),
      ...lexicon.slice(0, 24).map((entry: any) => ({
        id: `lexicon-${entry.id}`,
        kind: "lexicon" as const,
        title: entry.term,
        preview: entry.definition || entry.notes || "",
        tags: [...tokenize(entry.notes), entry.dikwTier].filter(Boolean) as string[],
        accent: moduleMeta.lexicon.accent,
        linkedLabel: entry.partOfSpeech || entry.dikwTier || "Lexicon term",
      })),
      ...documents.slice(0, 24).map((entry: any) => ({
        id: `document-${entry.id}`,
        kind: "document" as const,
        title: entry.title,
        preview: entry.content?.slice(0, 180) || "",
        tags: tokenize(entry.tags),
        accent: moduleMeta.document.accent,
        linkedLabel: entry.dikwTier || "Document",
      })),
    ];
  }, [documents, lexicon, notebook]);

  const popularTags = React.useMemo(() => {
    const frequency = new Map<string, number>();
    for (const node of nodes) {
      for (const tag of node.tags) {
        const normalized = tag.toLowerCase();
        frequency.set(normalized, (frequency.get(normalized) ?? 0) + 1);
      }
    }
    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag]) => tag);
  }, [nodes]);

  const filteredNodes = React.useMemo(() => {
    return nodes.filter((node) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        search.length === 0 ||
        node.title.toLowerCase().includes(search) ||
        node.preview.toLowerCase().includes(search) ||
        node.tags.some((tag) => tag.toLowerCase().includes(search));
      const matchesTag = selectedTag === "all" || node.tags.some((tag) => tag.toLowerCase() === selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [nodes, searchTerm, selectedTag]);

  const selectedNode = filteredNodes.find((node) => node.id === selectedNodeId) ?? nodes.find((node) => node.id === selectedNodeId) ?? null;

  const relatedNodes = React.useMemo(() => {
    if (!selectedNode) return [] as ConstellationNode[];
    const selectedTags = new Set(selectedNode.tags.map((tag) => tag.toLowerCase()));
    return nodes
      .filter((node) => node.id !== selectedNode.id)
      .filter((node) => node.tags.some((tag) => selectedTags.has(tag.toLowerCase())))
      .slice(0, 5);
  }, [nodes, selectedNode]);

  return (
    <div className="space-y-6">
      <section className="dev-soft-card p-6 sm:p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Knowledge constellation browser</p>
        <h1 className="mb-4">Knowledge Base</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Browse tagged constellations across notes, lexicon entries, and writing artifacts. Open a detail modal to inspect one node while keeping the larger web of associations in view.
        </p>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search across concepts, notes, and tags" className="dev-search h-14 pl-12 text-base shadow-none" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedTag("all")} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedTag === "all" ? "border-[#13243f] bg-[#13243f] text-white" : "border-black/10 bg-white text-[#13243f] hover:bg-[#fcfaf6]"}`}>
              All tags
            </button>
            {popularTags.map((tag) => (
              <button key={tag} onClick={() => setSelectedTag(tag)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedTag === tag ? "border-[#13243f] bg-[#13243f] text-white" : "border-black/10 bg-white text-[#13243f] hover:bg-[#fcfaf6]"}`}>
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredNodes.length === 0 ? (
          <Card className="dev-card rounded-[1.6rem] p-10 text-center shadow-none md:col-span-2 xl:col-span-3">
            <p className="text-lg font-semibold text-foreground">No constellations match the current search.</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Try a broader keyword or switch back to all tags.</p>
          </Card>
        ) : (
          filteredNodes.map((node) => {
            const Icon = moduleMeta[node.kind].icon;
            return (
              <button key={node.id} onClick={() => setSelectedNodeId(node.id)} className="dev-card rounded-[1.7rem] p-5 text-left shadow-none transition hover:-translate-y-0.5 hover:border-black/15">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10" style={{ backgroundColor: `${node.accent}24` }}>
                    <Icon className="h-5 w-5" style={{ color: node.accent }} />
                  </div>
                  <Badge variant="outline" className="rounded-full border-black/10 bg-[#fcfaf6]">
                    {moduleMeta[node.kind].label}
                  </Badge>
                </div>
                <h2 className="mt-4 text-xl text-foreground">{node.title}</h2>
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">{node.preview || "No preview text available."}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">{node.linkedLabel}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {node.tags.slice(0, 4).map((tag) => (
                    <Badge key={`${node.id}-${tag}`} variant="outline" className="rounded-full border-black/10 bg-[#fcfaf6]">{tag}</Badge>
                  ))}
                </div>
              </button>
            );
          })
        )}
      </section>

      <Card className="dev-card rounded-[1.7rem] p-5 shadow-none">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Nested destinations</p>
            <h2 className="mt-2 text-2xl text-foreground">Deep knowledge surfaces</h2>
          </div>
          <Network className="h-6 w-6 text-[#13243f]" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Button variant="outline" className="justify-start rounded-2xl border-black/10 bg-[#fcfaf6]" onClick={() => setLocation("/lexicon")}>Open Lexicon</Button>
          <Button variant="outline" className="justify-start rounded-2xl border-black/10 bg-[#fcfaf6]" onClick={() => setLocation("/ideas")}>Open Ideas Lab</Button>
          <Button variant="outline" className="justify-start rounded-2xl border-black/10 bg-[#fcfaf6]" onClick={() => setLocation("/glossary")}>Open Glossary</Button>
        </div>
      </Card>

      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#13243f]/45 px-4 py-6 backdrop-blur-sm" onClick={() => setSelectedNodeId(null)}>
          <Card className="dev-card relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] p-6 shadow-none" onClick={(event) => event.stopPropagation()}>
            <button onClick={() => setSelectedNodeId(null)} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white">
              <X className="h-4 w-4" />
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Constellation detail</p>
            <h2 className="mt-3 text-3xl text-foreground">{selectedNode.title}</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{selectedNode.preview || "No extended preview is available for this item yet."}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {selectedNode.tags.length > 0 ? selectedNode.tags.map((tag) => <Badge key={tag} variant="outline" className="rounded-full border-black/10 bg-[#fcfaf6]">{tag}</Badge>) : <p className="text-sm text-muted-foreground">No tags attached yet.</p>}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-black/10 bg-[#fcfaf6] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Module origin</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{moduleMeta[selectedNode.kind].label}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedNode.linkedLabel}</p>
              </div>
              <div className="rounded-[1.5rem] border border-black/10 bg-[#fcfaf6] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Related nodes</p>
                <div className="mt-3 space-y-2">
                  {relatedNodes.length === 0 ? (
                    <p className="text-sm leading-6 text-muted-foreground">No directly tagged neighbors were found yet.</p>
                  ) : (
                    relatedNodes.map((node) => (
                      <div key={node.id} className="rounded-[1rem] border border-black/10 bg-white p-3">
                        <p className="text-sm font-semibold text-foreground">{node.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{moduleMeta[node.kind].label}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

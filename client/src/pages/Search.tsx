import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Library, PenSquare, Search as SearchIcon } from "lucide-react";

const moduleMeta = {
  notebook: {
    label: "Commonplace Notebook",
    icon: BookOpen,
    accent: "#efb93a",
    pattern: "dev-pattern-waves",
  },
  lexicon: {
    label: "Clavis Aurea",
    icon: Library,
    accent: "#56c5ea",
    pattern: "dev-pattern-dots",
  },
  document: {
    label: "Research Studio",
    icon: PenSquare,
    accent: "#e25b33",
    pattern: "dev-pattern-diamonds",
  },
} as const;

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<"all" | "notebook" | "lexicon" | "document">("all");

  const { data: results, isLoading } = trpc.search.unified.useQuery(
    {
      query: searchQuery,
      moduleFilter: moduleFilter === "all" ? undefined : moduleFilter,
    },
    { enabled: searchQuery.length > 0 }
  );

  const flatResults = useMemo(
    () =>
      results
        ? [
            ...results.notebook.map((r) => ({
              type: "notebook" as const,
              title: r.text.substring(0, 100),
              preview: r.text,
              date: r.createdAt,
              author: r.author,
            })),
            ...results.lexicon.map((r) => ({
              type: "lexicon" as const,
              title: r.term,
              preview: r.definition,
              date: r.createdAt,
            })),
            ...results.documents.map((r) => ({
              type: "document" as const,
              title: r.title,
              preview: r.content?.substring(0, 150),
              date: r.createdAt,
            })),
          ]
        : [],
    [results]
  );

  return (
    <div className="space-y-6">
      <section className="dev-soft-card p-6 sm:p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Global discovery</p>
        <h1 className="mb-4">Unified Search</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Search across notes, quotations, terminology, and active writing projects from a single Devanomy search surface.
        </p>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search your knowledge base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dev-search h-14 pl-12 text-base shadow-none"
              autoFocus
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "notebook", "lexicon", "document"] as const).map((filter) => {
              const isActive = moduleFilter === filter;
              const meta = filter === "all" ? null : moduleMeta[filter];
              return (
                <button
                  key={filter}
                  onClick={() => setModuleFilter(filter)}
                  className={`rounded-full border-2 border-black px-4 py-2 text-sm font-semibold transition ${isActive ? "bg-black text-white" : "bg-white text-black hover:bg-[#f6f3ec]"}`}
                >
                  <span className="inline-flex items-center gap-2">
                    {meta && <meta.icon className="h-4 w-4" />}
                    {filter === "all" ? "All Modules" : meta?.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {searchQuery.length === 0 ? (
        <Card className="dev-card rounded-[1.5rem] p-12 text-center shadow-none">
          <p className="text-lg font-semibold text-foreground">Begin with a keyword, author, term, or project.</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Results will be grouped visually by module so you can distinguish quotations, lexicon entries, and documents at a glance.
          </p>
        </Card>
      ) : isLoading ? (
        <Card className="dev-card rounded-[1.5rem] p-12 text-center shadow-none">
          <p className="text-muted-foreground">Searching across your Devanomy workspace...</p>
        </Card>
      ) : results && flatResults.length > 0 ? (
        <div className="space-y-4">
          {flatResults.map((result, idx) => {
            const meta = moduleMeta[result.type];
            const Icon = meta.icon;
            return (
              <Card key={idx} className="dev-card overflow-hidden rounded-[1.5rem] p-0 shadow-none">
                <div className={`${meta.pattern} h-4 w-full`} style={{ backgroundColor: meta.accent }} />
                <div className="flex items-start gap-4 p-5">
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-black"
                    style={{ backgroundColor: meta.accent }}
                  >
                    <Icon className="h-5 w-5 text-black" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-[1.7rem] leading-none text-foreground">{result.title}</h3>
                      <span className="dev-chip">{meta.label}</span>
                      {"author" in result && result.author ? <span className="dev-chip">{result.author}</span> : null}
                    </div>
                    {result.preview && (
                      <p className="mb-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{result.preview}</p>
                    )}
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {result.date ? `Added ${new Date(result.date).toLocaleDateString()}` : "Undated result"}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="dev-card rounded-[1.5rem] p-12 text-center shadow-none">
          <p className="text-lg font-semibold text-foreground">No results found.</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Try another keyword, broaden the module filter, or search by author, tag, term, or project title.
          </p>
        </Card>
      )}
    </div>
  );
}

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, BookOpen, Scroll, PenTool } from "lucide-react";

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

  const flatResults = results
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
    : [];

  const getModuleIcon = (type: string) => {
    switch (type) {
      case "notebook":
        return <BookOpen size={20} className="text-amber-500" />;
      case "lexicon":
        return <Scroll size={20} className="text-amber-600" />;
      case "document":
        return <PenTool size={20} className="text-amber-400" />;
      default:
        return null;
    }
  };

  const getModuleLabel = (type: string) => {
    switch (type) {
      case "notebook":
        return "Commonplace Notebook";
      case "lexicon":
        return "Clavis Aurea";
      case "document":
        return "Research Studio";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Unified Search</h1>
          <p className="text-muted-foreground">
            Search across all your notes, vocabulary, and documents
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Search Input */}
        <div className="mb-8">
          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-3 text-muted-foreground" size={20} />
            <Input
              placeholder="Search your knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
              autoFocus
            />
          </div>

          {/* Module Filter */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "notebook", "lexicon", "document"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setModuleFilter(filter)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  moduleFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:border-primary"
                }`}
              >
                {filter === "all" ? "All Modules" : getModuleLabel(filter)}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {searchQuery.length === 0 ? (
          <Card className="bg-card/50 border-border p-12 text-center">
            <p className="text-muted-foreground">Enter a search term to get started</p>
          </Card>
        ) : isLoading ? (
          <Card className="bg-card/50 border-border p-12 text-center">
            <p className="text-muted-foreground">Searching...</p>
          </Card>
        ) : results && flatResults.length > 0 ? (
          <div className="space-y-4">
            {flatResults.map((result, idx) => (
              <Card
                key={idx}
                className="bg-card border-border p-6 hover:border-primary transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getModuleIcon(result.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-foreground">
                        {result.title}
                      </h3>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        {getModuleLabel(result.type)}
                      </span>
                    </div>
                    {result.preview && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {result.preview}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {result.date && (
                        <span>
                          Added {new Date(result.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card/50 border-border p-12 text-center">
            <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
          </Card>
        )}
      </div>
    </div>
  );
}

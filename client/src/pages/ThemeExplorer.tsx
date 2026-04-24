import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Grid3x3, Layers } from "lucide-react";

interface DikwNode {
  tier: "wisdom" | "knowledge" | "information" | "data";
  count: number;
  entries: any[];
  color: string;
  bgColor: string;
}

export default function ThemeExplorer() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "hierarchy">("grid");

  const { data: lexiconEntries } = trpc.lexicon.list.useQuery({});
  const { data: notebookEntries } = trpc.notebook.list.useQuery({});
  const glossaryEntries: any[] = [];

  // Build DIKW hierarchy
  const dikwNodes: DikwNode[] = useMemo(() => {
    const tiers: Record<string, DikwNode> = {
      wisdom: {
        tier: "wisdom",
        count: 0,
        entries: [],
        color: "text-amber-900",
        bgColor: "bg-amber-100",
      },
      knowledge: {
        tier: "knowledge",
        count: 0,
        entries: [],
        color: "text-orange-900",
        bgColor: "bg-orange-100",
      },
      information: {
        tier: "information",
        count: 0,
        entries: [],
        color: "text-pink-900",
        bgColor: "bg-pink-100",
      },
      data: {
        tier: "data",
        count: 0,
        entries: [],
        color: "text-blue-900",
        bgColor: "bg-blue-100",
      },
    };

    // Categorize lexicon entries
    lexiconEntries?.forEach((entry: any) => {
      const tier = entry.dikwTier || "information";
      if (tiers[tier]) {
        tiers[tier].count++;
        tiers[tier].entries.push({
          id: `lexicon-${entry.id}`,
          type: "lexicon",
          title: entry.term,
          tier,
        });
      }
    });

    // Categorize glossary entries
    glossaryEntries?.forEach((entry: any) => {
      const tier = entry.dikwTier || "information";
      if (tiers[tier]) {
        tiers[tier].count++;
        tiers[tier].entries.push({
          id: `glossary-${entry.id}`,
          type: "glossary",
          title: entry.term,
          tier,
        });
      }
    });

    return Object.values(tiers);
  }, [lexiconEntries, glossaryEntries]);

  // Calculate relationships between tiers
  const tierRelationships = useMemo(() => {
    const relationships: Record<string, number> = {};

    dikwNodes.forEach((node) => {
      node.entries.forEach((entry) => {
        // Count shared tags between entries of different tiers
        const key = `${entry.tier}-connections`;
        relationships[key] = (relationships[key] || 0) + 1;
      });
    });

    return relationships;
  }, [dikwNodes]);

  const getTierDescription = (tier: string) => {
    const descriptions: Record<string, string> = {
      wisdom: "Principles, axioms, and universal truths",
      knowledge: "Epistemological frameworks and models",
      information: "Vocabulary, definitions, and facts",
      data: "Raw datasets and structured information",
    };
    return descriptions[tier] || "";
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "wisdom":
        return "🧠";
      case "knowledge":
        return "📚";
      case "information":
        return "📋";
      case "data":
        return "📊";
      default:
        return "📌";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Layers className="w-8 h-8 text-amber-600" />
            Theme Explorer
          </h1>
          <p className="text-gray-600 mt-1">Visualize your knowledge across DIKW tiers</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
            size="sm"
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            Grid
          </Button>
          <Button
            variant={viewMode === "hierarchy" ? "default" : "outline"}
            onClick={() => setViewMode("hierarchy")}
            size="sm"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Hierarchy
          </Button>
        </div>
      </div>

      {/* DIKW Hierarchy Overview */}
      <Card className="p-6 bg-gradient-to-r from-amber-50 to-blue-50 border-0">
        <h2 className="text-lg font-semibold mb-4">DIKW Knowledge Hierarchy</h2>
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <p className="font-semibold mb-2">Data → Information → Knowledge → Wisdom</p>
            <p>Your knowledge base is organized across four tiers, from raw data to universal principles.</p>
          </div>
        </div>
      </Card>

      {/* DIKW Tier Cards */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dikwNodes.map((node) => (
            <Card
              key={node.tier}
              className={`p-6 cursor-pointer transition hover:shadow-lg border-l-4 ${
                selectedTier === node.tier
                  ? "ring-2 ring-amber-600"
                  : ""
              } ${node.bgColor}`}
              onClick={() => setSelectedTier(selectedTier === node.tier ? null : node.tier)}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">{getTierIcon(node.tier)}</span>
                <span className="text-3xl font-bold text-gray-700">{node.count}</span>
              </div>
              <h3 className="text-lg font-semibold capitalize mb-2 text-gray-900">
                {node.tier}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{getTierDescription(node.tier)}</p>
              <div className="text-xs font-medium text-gray-500">
                {node.count} {node.count === 1 ? "entry" : "entries"}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {dikwNodes.map((node, idx) => (
            <div key={node.tier} className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center text-3xl" style={{backgroundColor: node.bgColor}}>
                  {getTierIcon(node.tier)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold capitalize">{node.tier}</h3>
                  <p className="text-gray-600">{getTierDescription(node.tier)}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{node.count}</div>
                  <div className="text-sm text-gray-500">entries</div>
                </div>
              </div>
              {selectedTier === node.tier && node.entries.length > 0 && (
                <div className="ml-20 space-y-2 max-h-64 overflow-y-auto">
                  {node.entries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="text-sm p-2 bg-white rounded border border-gray-200">
                      <div className="font-medium text-gray-900">{entry.title}</div>
                      <div className="text-xs text-gray-500">{entry.type}</div>
                    </div>
                  ))}
                  {node.entries.length > 5 && (
                    <div className="text-xs text-gray-500 p-2">
                      +{node.entries.length - 5} more...
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="text-sm text-amber-700 font-medium mb-1">Total Entries</div>
          <div className="text-3xl font-bold text-amber-900">
            {dikwNodes.reduce((sum, n) => sum + n.count, 0)}
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-sm text-blue-700 font-medium mb-1">Most Populated Tier</div>
          <div className="text-2xl font-bold text-blue-900 capitalize">
            {dikwNodes.reduce((max, n) => (n.count > max.count ? n : max)).tier}
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-pink-50 to-pink-100">
          <div className="text-sm text-pink-700 font-medium mb-1">Avg per Tier</div>
          <div className="text-3xl font-bold text-pink-900">
            {Math.round((dikwNodes.reduce((sum, n) => sum + n.count, 0) / dikwNodes.length) * 10) / 10}
          </div>
        </Card>
      </div>

      {/* Tier Relationships */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Tier Relationships</h2>
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <p className="mb-3">Entries are organized hierarchically from concrete data to abstract wisdom.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dikwNodes.map((node, idx) => (
              <div key={node.tier} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{backgroundColor: node.bgColor}}>
                  {getTierIcon(node.tier)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold capitalize text-gray-900">{node.tier}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-amber-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((node.count / Math.max(...dikwNodes.map(n => n.count), 1)) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
                <div className="text-right font-semibold text-gray-900">{node.count}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Network, Zap } from "lucide-react";

interface ConnectionNode {
  id: string;
  type: "notebook" | "lexicon" | "glossary";
  title: string;
  dikwTier?: string;
  tags?: string[];
  connections: number;
}

interface Connection {
  from: ConnectionNode;
  to: ConnectionNode;
  strength: "strong" | "medium" | "weak";
  reason: string;
}

export default function Synthesis() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNode, setSelectedNode] = useState<ConnectionNode | null>(null);
  const [filterByDikw, setFilterByDikw] = useState<string | null>(null);

  const { data: notebookPage } = trpc.notebook.list.useQuery({ page: 1, pageSize: 100, sortBy: "recent" });
  const notebookEntries = notebookPage?.items ?? [];
  const { data: lexiconEntries } = trpc.lexicon.list.useQuery({});
  const glossaryEntries: any[] = [];

  // Build connection graph
  const nodes: ConnectionNode[] = useMemo(() => {
    const allNodes: ConnectionNode[] = [];

    // Add notebook entries
    notebookEntries?.forEach((entry: any) => {
      allNodes.push({
        id: `notebook-${entry.id}`,
        type: "notebook",
        title: entry.text || entry.title || "Untitled",
        tags: entry.tags?.split(",").map((t: string) => t.trim()),
        connections: 0,
      });
    });

    // Add lexicon entries
    lexiconEntries?.forEach((entry: any) => {
      allNodes.push({
        id: `lexicon-${entry.id}`,
        type: "lexicon",
        title: entry.term,
        dikwTier: entry.dikwTier || "information",
        tags: entry.notes?.split(",").map((t: string) => t.trim()),
        connections: 0,
      });
    });

    // Add glossary entries
    glossaryEntries?.forEach((entry: any) => {
      allNodes.push({
        id: `glossary-${entry.id}`,
        type: "glossary",
        title: entry.term,
        dikwTier: entry.dikwTier || "information",
        tags: entry.tags?.split(",").map((t: string) => t.trim()),
        connections: 0,
      });
    });

    return allNodes;
  }, [notebookEntries, lexiconEntries, glossaryEntries]);

  // Discover connections based on shared tags and DIKW tiers
  const connections: Connection[] = useMemo(() => {
    const discovered: Connection[] = [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        // Check for shared tags
        const sharedTags = (nodeA.tags || []).filter((tag) =>
          (nodeB.tags || []).includes(tag)
        );

        // Check for DIKW tier relationships
        const sameDikw = nodeA.dikwTier && nodeB.dikwTier && nodeA.dikwTier === nodeB.dikwTier;

        // Check for title/content similarity
        const titleSimilarity =
          nodeA.title.toLowerCase().includes(nodeB.title.toLowerCase()) ||
          nodeB.title.toLowerCase().includes(nodeA.title.toLowerCase());

        if (sharedTags.length > 0 || sameDikw || titleSimilarity) {
          let strength: "strong" | "medium" | "weak" = "weak";
          let reason = "";

          if (sharedTags.length >= 2) {
            strength = "strong";
            reason = `Shared tags: ${sharedTags.join(", ")}`;
          } else if (sharedTags.length === 1 && sameDikw) {
            strength = "strong";
            reason = `Shared tag and DIKW tier`;
          } else if (sharedTags.length === 1 || sameDikw) {
            strength = "medium";
            reason = sharedTags.length > 0 ? `Shared tag: ${sharedTags[0]}` : `Same DIKW tier: ${nodeA.dikwTier}`;
          } else if (titleSimilarity) {
            strength = "weak";
            reason = "Similar titles";
          }

          discovered.push({
            from: nodeA,
            to: nodeB,
            strength,
            reason,
          });

          nodeA.connections++;
          nodeB.connections++;
        }
      }
    }

    return discovered;
  }, [nodes]);

  // Filter connections
  const filteredConnections = useMemo(() => {
    let filtered = connections;

    if (searchTerm) {
      filtered = filtered.filter(
        (conn) =>
          conn.from.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conn.to.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterByDikw) {
      filtered = filtered.filter(
        (conn) =>
          (conn.from.dikwTier === filterByDikw || conn.to.dikwTier === filterByDikw)
      );
    }

    return filtered;
  }, [connections, searchTerm, filterByDikw]);

  const getConnectionColor = (strength: string) => {
    switch (strength) {
      case "strong":
        return "border-amber-600 bg-amber-50";
      case "medium":
        return "border-amber-400 bg-amber-100";
      case "weak":
        return "border-gray-300 bg-gray-50";
      default:
        return "border-gray-300";
    }
  };

  const getDikwColor = (tier?: string) => {
    switch (tier) {
      case "wisdom":
        return "bg-amber-100 text-amber-800";
      case "knowledge":
        return "bg-orange-100 text-orange-800";
      case "information":
        return "bg-pink-100 text-pink-800";
      case "data":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="w-8 h-8 text-amber-600" />
            Synthesis Engine
          </h1>
          <p className="text-gray-600 mt-1">Discover hidden connections between your entries</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 bg-white">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search connections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterByDikw === null ? "default" : "outline"}
              onClick={() => setFilterByDikw(null)}
              size="sm"
            >
              All Tiers
            </Button>
            {["wisdom", "knowledge", "information", "data"].map((tier) => (
              <Button
                key={tier}
                variant={filterByDikw === tier ? "default" : "outline"}
                onClick={() => setFilterByDikw(tier)}
                size="sm"
                className={filterByDikw === tier ? getDikwColor(tier) : ""}
              >
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="text-3xl font-bold text-amber-900">{nodes.length}</div>
          <div className="text-sm text-amber-700">Total Entries</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="text-3xl font-bold text-orange-900">{connections.length}</div>
          <div className="text-sm text-orange-700">Connections Found</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-pink-50 to-pink-100">
          <div className="text-3xl font-bold text-pink-900">
            {connections.filter((c) => c.strength === "strong").length}
          </div>
          <div className="text-sm text-pink-700">Strong Connections</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-3xl font-bold text-blue-900">
            {Math.round((nodes.reduce((sum, n) => sum + n.connections, 0) / (nodes.length || 1)) * 10) / 10}
          </div>
          <div className="text-sm text-blue-700">Avg Connections/Entry</div>
        </Card>
      </div>

      {/* Connections List */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Network className="w-6 h-6 text-amber-600" />
          Discovered Connections ({filteredConnections.length})
        </h2>

        {filteredConnections.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <p>No connections found. Try adjusting your filters or search term.</p>
          </Card>
        ) : (
          filteredConnections.map((connection, idx) => (
            <Card
              key={idx}
              className={`p-4 border-l-4 cursor-pointer transition hover:shadow-md ${getConnectionColor(
                connection.strength
              )}`}
              onClick={() => setSelectedNode(connection.from)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-900">{connection.from.title}</span>
                    <span className="text-gray-400">↔</span>
                    <span className="font-semibold text-gray-900">{connection.to.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-white rounded text-gray-700">
                      {connection.from.type}
                    </span>
                    <span className="px-2 py-1 bg-white rounded text-gray-700">
                      {connection.to.type}
                    </span>
                    {connection.from.dikwTier && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDikwColor(connection.from.dikwTier)}`}>
                        {connection.from.dikwTier}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{connection.reason}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    connection.strength === "strong"
                      ? "bg-amber-600 text-white"
                      : connection.strength === "medium"
                        ? "bg-amber-500 text-white"
                        : "bg-gray-400 text-white"
                  }`}
                >
                  {connection.strength}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

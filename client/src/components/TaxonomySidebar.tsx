import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface TaxonomyArea {
  id: number;
  name: string;
  categories: TaxonomyCategory[];
}

interface TaxonomyCategory {
  id: number;
  name: string;
  count?: number;
}

const TAXONOMY_STRUCTURE: TaxonomyArea[] = [
  {
    id: 10,
    name: "Knowledge Capture",
    categories: [
      { id: 11, name: "Quotes & Passages", count: 0 },
      { id: 12, name: "Observations", count: 0 },
      { id: 13, name: "Insights", count: 0 },
    ],
  },
  {
    id: 20,
    name: "Vocabulary & Language",
    categories: [
      { id: 21, name: "Terms", count: 0 },
      { id: 22, name: "Etymology", count: 0 },
      { id: 23, name: "Concordance", count: 0 },
    ],
  },
  {
    id: 30,
    name: "Writing & Research",
    categories: [
      { id: 31, name: "Projects", count: 0 },
      { id: 32, name: "Drafts", count: 0 },
      { id: 33, name: "Published", count: 0 },
    ],
  },
  {
    id: 40,
    name: "Cross-Module Linking",
    categories: [
      { id: 41, name: "References", count: 0 },
      { id: 42, name: "Connections", count: 0 },
      { id: 43, name: "Backlinks", count: 0 },
    ],
  },
];

export default function TaxonomySidebar() {
  const [expandedAreas, setExpandedAreas] = useState<number[]>([10, 20, 30]);

  const toggleArea = (areaId: number) => {
    setExpandedAreas((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]
    );
  };

  return (
    <div className="w-full bg-card border-r border-border">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Johnny Decimal Taxonomy
        </h3>
      </div>

      <div className="space-y-1 p-2">
        {TAXONOMY_STRUCTURE.map((area) => (
          <div key={area.id} className="space-y-1">
            {/* Area Header */}
            <button
              onClick={() => toggleArea(area.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm font-medium"
            >
              {expandedAreas.includes(area.id) ? (
                <ChevronDown size={16} className="text-muted-foreground" />
              ) : (
                <ChevronRight size={16} className="text-muted-foreground" />
              )}
              <span className="font-bold text-primary">{area.id}</span>
              <span className="flex-1 text-left">{area.name}</span>
            </button>

            {/* Categories */}
            {expandedAreas.includes(area.id) && (
              <div className="ml-6 space-y-1">
                {area.categories.map((category) => (
                  <button
                    key={category.id}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent/50 transition-colors text-xs text-muted-foreground hover:text-foreground"
                  >
                    <span className="font-mono font-bold text-primary/70">{category.id}</span>
                    <span className="flex-1 text-left">{category.name}</span>
                    {category.count !== undefined && category.count > 0 && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {category.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-border text-xs text-muted-foreground space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">10–19</span>
          <span>Knowledge Capture</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">20–29</span>
          <span>Vocabulary</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">30–39</span>
          <span>Writing</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">40–49</span>
          <span>Linking</span>
        </div>
      </div>
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, LayoutList } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function TaxonomySidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedAreas, setExpandedAreas] = useState<number[]>([]);
  const taxonomyQuery = trpc.taxonomy.getTree.useQuery(undefined, {
    staleTime: 60_000,
  });

  const areas = taxonomyQuery.data ?? [];

  const totals = useMemo(() => {
    const areaCount = areas.length;
    const categoryCount = areas.reduce((sum, area) => sum + area.categories.length, 0);
    const filledCategoryCount = areas.reduce(
      (sum, area) => sum + area.categories.filter((category) => (category.count ?? 0) > 0).length,
      0
    );
    const activeEntryCount = areas.reduce((sum, area) => sum + (area.count ?? 0), 0);

    return { areaCount, categoryCount, filledCategoryCount, activeEntryCount };
  }, [areas]);

  const toggleArea = (areaId: number) => {
    setExpandedAreas((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]
    );
  };

  return (
    <div className="w-full overflow-hidden rounded-[1.15rem] bg-transparent text-sidebar-foreground">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/6"
        aria-expanded={isOpen}
        aria-controls="taxonomy-outline-panel"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/10 text-white">
          <LayoutList className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/60">
            Taxonomy outline
          </p>
          <p className="truncate text-sm font-semibold text-white">Johnny Decimal</p>
          <p className="text-xs text-white/62">
            {taxonomyQuery.isLoading
              ? "Loading your taxonomy…"
              : `${totals.areaCount} areas · ${totals.categoryCount} categories${totals.activeEntryCount > 0 ? ` · ${totals.activeEntryCount} live entries` : ""}`}
          </p>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-white/70" />
        ) : (
          <ChevronRight className="h-4 w-4 text-white/70" />
        )}
      </button>

      {isOpen && (
        <div id="taxonomy-outline-panel" className="border-t border-white/10 px-3 pb-3 pt-2">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2">
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/55">Areas</p>
              <p className="mt-1 text-lg font-semibold text-white">{totals.areaCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2">
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/55">Active categories</p>
              <p className="mt-1 text-lg font-semibold text-white">{totals.filledCategoryCount}</p>
            </div>
          </div>

          {taxonomyQuery.isError ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-3 py-4 text-xs leading-5 text-white/70">
              The taxonomy outline could not be loaded right now. Refresh the page to retry.
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                {areas.map((area) => {
                  const expanded = expandedAreas.includes(area.id);

                  return (
                    <div key={area.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      <button
                        type="button"
                        onClick={() => toggleArea(area.id)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-white/6"
                        aria-expanded={expanded}
                      >
                        {expanded ? (
                          <ChevronDown size={15} className="shrink-0 text-white/60" />
                        ) : (
                          <ChevronRight size={15} className="shrink-0 text-white/60" />
                        )}
                        <span className="w-8 shrink-0 text-sm font-bold text-[#56c5ea]">{area.areaNumber}</span>
                        <span className="min-w-0 flex-1 text-sm font-medium text-white">{area.areaName}</span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.7rem] text-white/65">
                          {area.count ?? 0}
                        </span>
                      </button>

                      {expanded && (
                        <div className="space-y-1 border-t border-white/8 px-3 py-2">
                          {area.categories.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs text-white/70 transition hover:bg-white/7 hover:text-white"
                            >
                              <span className="w-8 shrink-0 font-mono font-bold text-white/82">{category.categoryNumber}</span>
                              <span className="min-w-0 flex-1 truncate">{category.categoryName}</span>
                              <span className="rounded-full bg-[#56c5ea]/20 px-2 py-0.5 text-[0.68rem] font-medium text-[#9fe8ff]">
                                {category.count ?? 0}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[0.7rem] text-white/58">
                {areas.map((area) => (
                  <div key={area.id} className="rounded-xl border border-white/8 bg-white/5 px-2.5 py-2">
                    {area.areaNumber}–{area.areaNumber + 9} · {area.areaName}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

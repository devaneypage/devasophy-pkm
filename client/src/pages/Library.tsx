import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  ArrowUpRight,
  BookOpenText,
  Bookmark,
  Brain,
  FileText,
  LibraryBig,
  ListChecks,
  Quote,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import {
  buildEntryPreview,
  commonplaceTypes,
  getCommonplaceTypeConfig,
  type CommonplaceTypeValue,
} from "@/lib/commonplace";

type BoardRecord = {
  id: number;
  title: string;
};

type ColumnRecord = {
  id: number;
  title: string;
};

type ArtifactRecord = {
  id: number;
  boardId: number;
  columnId: number;
  entryType: CommonplaceTypeValue;
  title: string;
  summary: string | null;
  content: unknown;
  metadata: unknown;
  tags: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type ArtifactIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

const artifactIcons: Record<CommonplaceTypeValue, ArtifactIcon> = {
  research_note: FileText,
  bookmark: Bookmark,
  idea: Sparkles,
  quote: Quote,
  book: LibraryBig,
  article: BookOpenText,
  glossary_term: Brain,
  list: ListChecks,
};

function contentRecord(content: unknown): Record<string, unknown> {
  return content && typeof content === "object" && !Array.isArray(content)
    ? (content as Record<string, unknown>)
    : {};
}

function artifactSource(entry: ArtifactRecord) {
  const content = contentRecord(entry.content);
  const candidates = [content.source, content.publication, content.author, content.label, content.context];
  const source = candidates.find((value) => typeof value === "string" && value.trim());
  return typeof source === "string" ? source : "Personal archive";
}

function artifactTags(entry: ArtifactRecord) {
  return (entry.tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function formatArtifactDate(value: Date | string | undefined) {
  if (!value) return "In working index";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "In working index";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default function Library() {
  const [, setLocation] = useLocation();
  const snapshotQuery = trpc.commonplace.bootstrap.useQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeType, setActiveType] = useState<CommonplaceTypeValue | "all">("all");
  const [starredIds, setStarredIds] = useState<Set<number>>(() => new Set());
  const [starredOnly, setStarredOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const snapshot = snapshotQuery.data;
  const board = snapshot?.board as BoardRecord | undefined;
  const columns = (snapshot?.columns ?? []) as ColumnRecord[];
  const entries = (snapshot?.entries ?? []) as ArtifactRecord[];

  const columnLabels = useMemo(
    () => new Map(columns.map((column) => [column.id, column.title])),
    [columns]
  );

  const typeCounts = useMemo(() => {
    return entries.reduce<Record<string, number>>((counts, entry) => {
      counts[entry.entryType] = (counts[entry.entryType] ?? 0) + 1;
      return counts;
    }, {});
  }, [entries]);

  const matchingEntries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return entries
      .filter((entry) => {
        if (activeType !== "all" && entry.entryType !== activeType) return false;
        if (starredOnly && !starredIds.has(entry.id)) return false;
        if (!query) return true;

        const searchable = [
          entry.title,
          entry.summary ?? "",
          entry.tags ?? "",
          artifactSource(entry),
          buildEntryPreview(entry.content, entry.summary),
          columnLabels.get(entry.columnId) ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      })
      .sort((left, right) => {
        const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
        const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
        return rightTime - leftTime || left.title.localeCompare(right.title);
      });
  }, [activeType, columnLabels, entries, searchTerm, starredIds, starredOnly]);

  const selectedArtifact = matchingEntries.find((entry) => entry.id === selectedId) ?? matchingEntries[0];
  const hasFilters = Boolean(searchTerm.trim()) || activeType !== "all" || starredOnly;

  const clearFilters = () => {
    setSearchTerm("");
    setActiveType("all");
    setStarredOnly(false);
  };

  const toggleStar = (id: number) => {
    setStarredIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="library-index space-y-6 pb-10">
      <section className="library-hero relative overflow-hidden px-6 py-7 sm:px-8 sm:py-9 lg:px-10">
        <div className="library-hero-grid" aria-hidden="true" />
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_16rem] xl:items-end">
          <div className="max-w-4xl">
            <p className="library-kicker">Library · Artifact Index</p>
            <h1 className="mt-3 max-w-3xl text-[clamp(3rem,6vw,5.75rem)] font-serif leading-[0.9] tracking-[-0.055em] text-[#13243f]">
              A reading room for working knowledge.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#48546a] sm:text-lg">
              A quiet index for the texts, terms, fragments, and frameworks worth returning to. Search by language, trace by type, then take the selected artifact back to the drafting wall when it is ready to be worked on.
            </p>
          </div>
          <div className="library-index-mark rounded-[1.5rem] px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#48546a]">Current shelf</p>
            <p className="mt-2 font-serif text-3xl font-bold tracking-[-0.04em] text-[#13243f]">{entries.length}</p>
            <p className="mt-1 text-sm leading-5 text-[#48546a]">artifacts across {columns.length || 1} working regions</p>
          </div>
        </div>
      </section>

      <section className="library-query-surface px-5 py-5 sm:px-6" aria-label="Library filters">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-3xl flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#59657a]" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search the artifact index"
                placeholder="Search titles, sources, regions, tags, and fragments"
                className="library-search h-14 w-full pl-12 pr-12 text-base text-[#13243f] outline-none"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#59657a] transition hover:bg-[#13243f]/8 hover:text-[#13243f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c61ff]"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setLocation("/commonplace")}
              className="library-new-artifact inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold"
            >
              Add to Commonplace
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4 border-t border-[#13243f]/10 pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2" aria-label="Artifact types">
              <button
                type="button"
                aria-pressed={activeType === "all"}
                onClick={() => setActiveType("all")}
                className={`library-filter ${activeType === "all" ? "library-filter-active" : ""}`}
              >
                All <span>{entries.length}</span>
              </button>
              {commonplaceTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  aria-pressed={activeType === type.value}
                  onClick={() => setActiveType((current) => (current === type.value ? "all" : type.value))}
                  className={`library-filter ${activeType === type.value ? "library-filter-active" : ""}`}
                  style={{ "--library-accent": type.accent } as React.CSSProperties}
                >
                  {type.shortLabel} <span>{typeCounts[type.value] ?? 0}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-pressed={starredOnly}
                onClick={() => setStarredOnly((current) => !current)}
                className={`library-star-filter ${starredOnly ? "library-star-filter-active" : ""}`}
              >
                <Star className="h-3.5 w-3.5" fill={starredOnly ? "currentColor" : "none"} />
                Starred {starredIds.size ? <span>{starredIds.size}</span> : null}
              </button>
              {hasFilters ? (
                <button type="button" onClick={clearFilters} className="library-clear-filter">
                  Reset view
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-3 text-sm text-[#59657a]">
            <p>
              <span className="font-semibold text-[#13243f]">{matchingEntries.length}</span> of {entries.length} artifacts
              {board ? <span> · indexed from {board.title}</span> : null}
            </p>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em]">Master Classification Key</p>
          </div>
        </div>
      </section>

      {snapshotQuery.isLoading ? (
        <section className="library-loading px-6 py-16" aria-live="polite">
          <div className="library-loading-line w-24" />
          <div className="library-loading-line mt-4 w-full" />
          <div className="library-loading-line mt-3 w-[86%]" />
          <p className="mt-8 text-sm text-[#59657a]">Opening the catalogues…</p>
        </section>
      ) : null}

      {!snapshotQuery.isLoading && matchingEntries.length === 0 ? (
        <section className="library-empty px-6 py-14 text-center">
          <p className="library-kicker">No matching artifacts</p>
          <h2 className="mt-3 text-3xl text-[#13243f]">The shelf is clear from this angle.</h2>
          <p className="mx-auto mt-3 max-w-md leading-6 text-[#59657a]">
            Adjust the terms or return to the full index. New records can be shaped in the Commonplace workspace.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={clearFilters} className="library-secondary-action">Return to full index</button>
            <button type="button" onClick={() => setLocation("/commonplace")} className="library-new-artifact rounded-full px-5 py-2.5 text-sm font-semibold">Open Commonplace</button>
          </div>
        </section>
      ) : null}

      {!snapshotQuery.isLoading && matchingEntries.length > 0 ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="library-catalogue overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-[#13243f]/12 px-5 py-4 sm:px-6">
              <div>
                <p className="library-kicker">Catalogue view</p>
                <p className="mt-1 text-sm text-[#59657a]">Comparative index with source context and regional placement.</p>
              </div>
              <span className="hidden rounded-full border border-[#13243f]/12 bg-white/65 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#48546a] sm:block">
                Recent first
              </span>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="library-table w-full text-left">
                <thead>
                  <tr>
                    <th scope="col">Artifact</th>
                    <th scope="col">Type</th>
                    <th scope="col">Region</th>
                    <th scope="col">Source</th>
                    <th scope="col" className="text-right">Index</th>
                  </tr>
                </thead>
                <tbody>
                  {matchingEntries.map((entry) => {
                    const type = getCommonplaceTypeConfig(entry.entryType);
                    const Icon = artifactIcons[entry.entryType];
                    const isSelected = selectedArtifact?.id === entry.id;
                    const isStarred = starredIds.has(entry.id);
                    return (
                      <tr
                        key={entry.id}
                        data-selected={isSelected || undefined}
                        className="group"
                      >
                        <td>
                          <button
                            type="button"
                            onClick={() => setSelectedId(entry.id)}
                            className="flex min-w-[17rem] items-start gap-3 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5c61ff]"
                            aria-current={isSelected ? "true" : undefined}
                            aria-label={`Read ${entry.title} in the reader margin`}
                          >
                            <span className="mt-1 h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: type.accent }} aria-hidden="true" />
                            <div className="min-w-0">
                              <p className="line-clamp-1 font-semibold text-[#13243f]">{entry.title}</p>
                              <p className="mt-1 line-clamp-1 text-sm text-[#59657a]">{buildEntryPreview(entry.content, entry.summary)}</p>
                              {artifactTags(entry).length ? <p className="mt-2 text-xs text-[#6a7486]">{artifactTags(entry).join(" · ")}</p> : null}
                            </div>
                          </button>
                        </td>
                        <td>
                          <span className="library-type-label" style={{ "--library-accent": type.accent } as React.CSSProperties}>
                            <Icon className="h-3.5 w-3.5" /> {type.shortLabel}
                          </span>
                        </td>
                        <td><span className="text-sm text-[#48546a]">{columnLabels.get(entry.columnId) ?? "Unfiled"}</span></td>
                        <td><span className="line-clamp-1 max-w-[11rem] text-sm text-[#48546a]">{artifactSource(entry)}</span></td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-[#6a7486]">{formatArtifactDate(entry.updatedAt ?? entry.createdAt)}</span>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleStar(entry.id);
                              }}
                              aria-label={`${isStarred ? "Unstar" : "Star"} ${entry.title}`}
                              className="library-row-star"
                            >
                              <Star className="h-3.5 w-3.5" fill={isStarred ? "currentColor" : "none"} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {matchingEntries.map((entry) => {
                const type = getCommonplaceTypeConfig(entry.entryType);
                const Icon = artifactIcons[entry.entryType];
                const isSelected = selectedArtifact?.id === entry.id;
                const isStarred = starredIds.has(entry.id);
                return (
                  <article
                    key={entry.id}
                    className="library-mobile-card"
                    data-selected={isSelected || undefined}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-11 w-1 shrink-0 rounded-full" style={{ backgroundColor: type.accent }} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <span className="library-type-label" style={{ "--library-accent": type.accent } as React.CSSProperties}><Icon className="h-3.5 w-3.5" /> {type.shortLabel}</span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleStar(entry.id);
                            }}
                            aria-label={`${isStarred ? "Unstar" : "Star"} ${entry.title}`}
                            className="library-row-star"
                          >
                            <Star className="h-3.5 w-3.5" fill={isStarred ? "currentColor" : "none"} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedId(entry.id)}
                          className="mt-3 rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5c61ff]"
                          aria-current={isSelected ? "true" : undefined}
                          aria-label={`Read ${entry.title} in the reader margin`}
                        >
                          <h3 className="text-lg font-semibold leading-tight text-[#13243f]">{entry.title}</h3>
                        </button>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#59657a]">{buildEntryPreview(entry.content, entry.summary)}</p>
                        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6a7486]">
                          <span>{columnLabels.get(entry.columnId) ?? "Unfiled"}</span>
                          <span>{artifactSource(entry)}</span>
                          <span>{formatArtifactDate(entry.updatedAt ?? entry.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="library-reader-margin px-5 py-6 sm:px-6 xl:sticky xl:top-28 xl:h-fit" aria-live="polite">
            {selectedArtifact ? (() => {
              const type = getCommonplaceTypeConfig(selectedArtifact.entryType);
              const Icon = artifactIcons[selectedArtifact.entryType];
              return (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <p className="library-kicker">Reader’s margin</p>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: type.accent }} aria-hidden="true" />
                  </div>
                  <div className="mt-6 flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color: type.accent }} />
                    <p className="text-sm font-semibold text-white/80">{type.label}</p>
                  </div>
                  <h2 className="mt-3 text-3xl leading-[1.02] text-[#fffaf2]">{selectedArtifact.title}</h2>
                  <p className="mt-4 text-sm leading-6 text-white/70">{buildEntryPreview(selectedArtifact.content, selectedArtifact.summary)}</p>
                  <dl className="mt-7 space-y-4 border-t border-[#13243f]/12 pt-5 text-sm">
                    <div className="flex items-start justify-between gap-4"><dt className="text-white/60">Region</dt><dd className="max-w-[11rem] text-right font-medium text-[#fffaf2]">{columnLabels.get(selectedArtifact.columnId) ?? "Unfiled"}</dd></div>
                    <div className="flex items-start justify-between gap-4"><dt className="text-white/60">Source</dt><dd className="max-w-[11rem] text-right font-medium text-[#fffaf2]">{artifactSource(selectedArtifact)}</dd></div>
                    <div className="flex items-start justify-between gap-4"><dt className="text-white/60">Filed</dt><dd className="text-right font-medium text-[#fffaf2]">{formatArtifactDate(selectedArtifact.updatedAt ?? selectedArtifact.createdAt)}</dd></div>
                  </dl>
                  {artifactTags(selectedArtifact).length ? <div className="mt-6 flex flex-wrap gap-2">{artifactTags(selectedArtifact).map((tag) => <span key={tag} className="library-tag">{tag}</span>)}</div> : null}
                  <button type="button" onClick={() => setLocation("/commonplace")} className="library-secondary-action mt-7 w-full">
                    Open in Commonplace <ArrowUpRight className="h-4 w-4" />
                  </button>
                </>
              );
            })() : null}
          </aside>
        </section>
      ) : null}
    </div>
  );
}

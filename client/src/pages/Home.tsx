import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCommonplaceFeatureFlag } from "@/lib/featureFlags";
import { trpc } from "@/lib/trpc";
import {
  DEFAULT_DASHBOARD_PANEL_ORDER,
  dashboardPanelDefinitions,
  moveDashboardPanel,
  normalizeDashboardPanelOrder,
  type DashboardPanelId,
} from "@shared/dashboardLayout";
import {
  Archive,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  Clock3,
  Download,
  FileJson,
  FileText,
  GripVertical,
  Layers3,
  Loader2,
  Map as MapIcon,
  Network,
  PenLine,
  Plus,
  RotateCcw,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import React from "react";
import { useLocation } from "wouter";

const contentTaxonomy = [
  { key: "research_note", label: "Research notes", color: "var(--content-research-note)" },
  { key: "bookmark", label: "Bookmarks", color: "var(--content-bookmark)" },
  { key: "idea", label: "Ideas", color: "var(--content-idea)" },
  { key: "quote", label: "Quotes", color: "var(--content-quote)" },
  { key: "book", label: "Books", color: "var(--content-book)" },
  { key: "article", label: "Articles", color: "var(--content-article)" },
  { key: "glossary_term", label: "Glossary", color: "var(--content-glossary-term)" },
  { key: "list", label: "Lists", color: "var(--content-list)" },
] as const;

const quickActions = [
  { label: "Capture", description: "Add a new note or source", icon: Plus, route: "/commonplace", accent: "#e85b3e" },
  { label: "Refine", description: "Develop an emerging idea", icon: PenLine, route: "/ideas", accent: "#5c61ff" },
  { label: "Map", description: "Trace relationships", icon: MapIcon, route: "/search", accent: "#54b5dd" },
  { label: "Review", description: "Return to the library", icon: BookOpen, route: "/library", accent: "#d2a53b" },
  { label: "Search", description: "Find across collections", icon: Search, route: "/search", accent: "#54b5dd" },
  { label: "Archive", description: "Prepare durable exports", icon: Archive, route: "/export", accent: "#3f8b4d" },
  { label: "Export", description: "Move work outward", icon: Download, route: "/export", accent: "#ef8d28" },
  { label: "Share", description: "Package an insight", icon: Share2, route: "/export", accent: "#da73bb" },
] as const;

const moduleTone: Record<string, string> = {
  commonplace: "#e85b3e",
  lexicon: "#54b5dd",
  document: "#5c61ff",
  idea: "#f03878",
  book: "#3f8b4d",
};

const panelSpanClass: Record<DashboardPanelId, string> = {
  territory_metrics: "xl:col-span-12",
  atelier: "xl:col-span-12",
  recent_work: "xl:col-span-6",
  node_atlas: "xl:col-span-6",
  knowledge_regions: "xl:col-span-12",
  accumulation_atlas: "xl:col-span-8",
  classification_key: "xl:col-span-4",
  quick_synthesis: "xl:col-span-8",
  export_hub: "xl:col-span-4",
};

function formatCount(value: number | undefined, loading: boolean) {
  if (loading) return "—";
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function relativeDate(value: Date | string) {
  const date = new Date(value);
  const dayDifference = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  if (dayDifference === 0) return "Today";
  if (dayDifference === 1) return "Yesterday";
  if (dayDifference < 7) return `${dayDifference} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const ATLAS_FILTER_STORAGE_KEY = "devanomy.atlas.filters.v1";
const atlasModules = ["notebook", "lexicon", "document"] as const;
type AtlasModule = (typeof atlasModules)[number];
type AtlasEdge = { source: string; target: string; count: number; types?: Array<{ type: string; value: number }> };
type AtlasFilters = { relationshipType: string; visibleModules: AtlasModule[] };

function readAtlasFilters(): AtlasFilters {
  const fallback: AtlasFilters = { relationshipType: "all", visibleModules: [...atlasModules] };
  if (typeof window === "undefined") return fallback;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ATLAS_FILTER_STORAGE_KEY) ?? "null") as Partial<AtlasFilters> | null;
    const visibleModules = Array.isArray(parsed?.visibleModules) ? parsed.visibleModules.filter((module): module is AtlasModule => atlasModules.includes(module as AtlasModule)) : fallback.visibleModules;
    return { relationshipType: typeof parsed?.relationshipType === "string" ? parsed.relationshipType : fallback.relationshipType, visibleModules };
  } catch {
    return fallback;
  }
}

function NodeAtlas({ relationships }: { relationships?: { total: number; edges: AtlasEdge[]; linkTypes?: Array<{ type: string; value: number }> } }) {
  const [, setLocation] = useLocation();
  const [selection, setSelection] = React.useState<{ kind: "node"; key: string } | { kind: "edge"; key: string } | null>(null);
  const [filters, setFilters] = React.useState<AtlasFilters>(readAtlasFilters);
  React.useEffect(() => {
    try {
      window.localStorage.setItem(ATLAS_FILTER_STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // Local storage may be unavailable in private or restricted browser contexts.
    }
  }, [filters]);
  const coordinates: Record<string, { x: number; y: number; color: string; label: string; route: string; description: string }> = {
    notebook: { x: 42, y: 48, color: "#e85b3e", label: "Notes", route: "/commonplace", description: "Commonplace notes and quotations" },
    lexicon: { x: 118, y: 29, color: "#54b5dd", label: "Terms", route: "/lexicon", description: "Clavis Aurea terms and definitions" },
    document: { x: 105, y: 88, color: "#5c61ff", label: "Drafts", route: "/documents", description: "Research documents and working drafts" },
  };
  const availableTypes = relationships?.linkTypes ?? [];
  React.useEffect(() => {
    if (availableTypes.length && filters.relationshipType !== "all" && !availableTypes.some((item) => item.type === filters.relationshipType)) {
      setFilters((current) => ({ ...current, relationshipType: "all" }));
    }
  }, [availableTypes, filters.relationshipType]);
  const filteredEdges = (relationships?.edges ?? []).filter((edge) => coordinates[edge.source] && coordinates[edge.target] && filters.visibleModules.includes(edge.source as AtlasModule) && filters.visibleModules.includes(edge.target as AtlasModule) && (filters.relationshipType === "all" || edge.types?.some((type) => type.type === filters.relationshipType)));
  const edges = filteredEdges.map((edge) => filters.relationshipType === "all" ? edge : { ...edge, count: edge.types?.find((type) => type.type === filters.relationshipType)?.value ?? 0 }).filter((edge) => edge.count > 0);
  const selectedNode = selection?.kind === "node" ? coordinates[selection.key] : undefined;
  const selectedEdge = selection?.kind === "edge" ? edges.find((edge) => `${edge.source}-${edge.target}` === selection.key) : undefined;
  const isEdgeActive = (edge: { source: string; target: string }, key: string) => {
    if (selection?.kind === "edge") return selection.key === key;
    return Boolean(selectedNode && (edge.source === selection?.key || edge.target === selection?.key));
  };
  const activate = (event: React.KeyboardEvent, callback: () => void) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      callback();
    }
  };
  const selectedCount = selectedEdge?.count ?? (selectedNode ? edges.filter((edge) => edge.source === selection?.key || edge.target === selection?.key).reduce((sum, edge) => sum + edge.count, 0) : undefined);
  const toggleModule = (module: AtlasModule) => setFilters((current) => ({ ...current, visibleModules: current.visibleModules.includes(module) ? current.visibleModules.filter((item) => item !== module) : [...current.visibleModules, module] }));
  const moduleLabels: Record<AtlasModule, string> = { notebook: "Notes", lexicon: "Terms", document: "Drafts" };
  return (
    <div className="atelier-atlas" aria-label={`${relationships?.total ?? 0} semantic relationships in the Node Atlas`}>
      <div className="mb-2 flex flex-wrap items-center gap-2" aria-label="Atlas filters">
        <label className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#6b7487]">Relation
          <select aria-label="Filter relationship type" value={filters.relationshipType} onChange={(event) => { setSelection(null); setFilters((current) => ({ ...current, relationshipType: event.target.value })); }} className="rounded-full border border-black/15 bg-white/75 px-2 py-1 text-xs font-semibold normal-case tracking-normal text-[#13243f]">
            <option value="all">All</option>{availableTypes.map((item) => <option key={item.type} value={item.type}>{item.type} ({item.value})</option>)}
          </select>
        </label>
        <div className="flex flex-wrap gap-1" aria-label="Visible atlas modules">{atlasModules.map((module) => <button key={module} type="button" aria-pressed={filters.visibleModules.includes(module)} onClick={() => { setSelection(null); toggleModule(module); }} className={`rounded-full border px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.08em] ${filters.visibleModules.includes(module) ? "border-[#13243f]/20 bg-white text-[#13243f]" : "border-black/10 bg-black/5 text-[#8b92a0] line-through"}`}>{moduleLabels[module]}</button>)}</div>
      </div>
      <svg viewBox="0 0 160 118" role="img" aria-label="Interactive relationship map connecting notes, terms, and drafts">
        {edges.map((edge) => {
          const source = coordinates[edge.source];
          const target = coordinates[edge.target];
          const key = `${edge.source}-${edge.target}`;
          const active = isEdgeActive(edge, key);
          return (
            <g key={key} role="button" tabIndex={0} aria-label={`${source.label} to ${target.label}, ${edge.count} relationships`} onClick={() => setSelection({ kind: "edge", key })} onKeyDown={(event) => activate(event, () => setSelection({ kind: "edge", key }))}>
              <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="transparent" strokeWidth="8" />
              <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={active ? "#f26a3d" : "#13243f"} strokeOpacity={active ? "0.86" : "0.34"} strokeWidth={active ? Math.min(6, 2 + edge.count * 0.35) : Math.min(5, 1.2 + edge.count * 0.35)} strokeDasharray={active ? "2 1" : undefined} />
            </g>
          );
        })}
        {Object.entries(coordinates).filter(([key]) => filters.visibleModules.includes(key as AtlasModule)).map(([key, node]) => {
          const active = selection?.kind === "node" && selection.key === key;
          return (
            <g key={key} role="button" tabIndex={0} aria-label={`Explore ${node.label}: ${node.description}`} aria-pressed={active} onClick={() => setSelection({ kind: "node", key })} onKeyDown={(event) => activate(event, () => setSelection({ kind: "node", key }))}>
              <title>{node.label}: {node.description}</title>
              <circle cx={node.x} cy={node.y} r={active ? "12" : "10"} fill={node.color} stroke={active ? "#f26a3d" : "#13243f"} strokeWidth={active ? "3" : "1.6"} />
              <text x={node.x} y={node.y + 20} textAnchor="middle" className="atelier-atlas-label">{node.label}</text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 rounded-xl border border-black/10 bg-[#f6f3ec] p-3" aria-live="polite">
        {selectedNode ? (
          <>
            <div className="flex items-start justify-between gap-3"><div><p className="atelier-kicker">Selected node</p><p className="font-serif text-lg text-[#13243f]">{selectedNode.label}</p><p className="text-xs leading-5 text-[#6b7487]">{selectedNode.description} · {selectedCount ?? 0} connected relations</p></div><button type="button" className="text-xs font-semibold text-[#6b7487] underline underline-offset-2" onClick={() => setSelection(null)}>Clear</button></div>
            <Button type="button" variant="outline" size="sm" className="atelier-secondary-action mt-3 w-full" onClick={() => setLocation(selectedNode.route)}>Open {selectedNode.label} <ArrowRight className="ml-2 h-3.5 w-3.5" /></Button>
          </>
        ) : selectedEdge ? (
          <div className="flex items-start justify-between gap-3"><div><p className="atelier-kicker">Selected relation</p><p className="font-serif text-lg text-[#13243f]">{coordinates[selectedEdge.source].label} ↔ {coordinates[selectedEdge.target].label}</p><p className="text-xs leading-5 text-[#6b7487]">{selectedEdge.count} semantic {selectedEdge.count === 1 ? "relationship" : "relationships"} in the current atlas.</p></div><button type="button" className="text-xs font-semibold text-[#6b7487] underline underline-offset-2" onClick={() => setSelection(null)}>Clear</button></div>
        ) : edges.length ? (
          <p className="text-xs leading-5 text-[#6b7487]">Select a node to open its collection, or select a line to inspect a relationship.</p>
        ) : (
          <p className="text-xs leading-5 text-[#6b7487]">No semantic relationships are recorded yet. Add links between notes, terms, and drafts to begin the atlas.</p>
        )}
      </div>
    </div>
  );
}

type DashboardPanelFrameProps = {
  panelId: DashboardPanelId;
  index: number;
  total: number;
  isEditing: boolean;
  isBusy: boolean;
  isDragging: boolean;
  children: React.ReactNode;
  onMove: (panelId: DashboardPanelId, targetIndex: number) => void;
  onDragStart: (event: React.DragEvent<HTMLButtonElement>, panelId: DashboardPanelId) => void;
  onDragEnd: () => void;
  onDrop: (panelId: DashboardPanelId) => void;
};

function DashboardPanelFrame({
  panelId,
  index,
  total,
  isEditing,
  isBusy,
  isDragging,
  children,
  onMove,
  onDragStart,
  onDragEnd,
  onDrop,
}: DashboardPanelFrameProps) {
  const definition = dashboardPanelDefinitions.find((panel) => panel.id === panelId)!;

  return (
    <div
      className={`atelier-panel-slot ${panelSpanClass[panelId]} ${isEditing ? "is-arranging" : ""} ${isDragging ? "is-dragging" : ""}`}
      data-panel-id={panelId}
      onDragOver={(event) => {
        if (isEditing) event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(panelId);
      }}
    >
      {isEditing && (
        <div className="atelier-panel-toolbar">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              draggable={!isBusy}
              disabled={isBusy}
              onDragStart={(event) => onDragStart(event, panelId)}
              onDragEnd={onDragEnd}
              className="atelier-drag-handle"
              aria-label={`Drag ${definition.title}`}
              title={`Drag ${definition.title}`}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <span className="atelier-panel-order">{String(index + 1).padStart(2, "0")}</span>
            <span className="truncate text-sm font-bold text-[#13243f]">{definition.title}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={isBusy || index === 0}
              onClick={() => onMove(panelId, index - 1)}
              className="h-8 w-8 rounded-full"
              aria-label={`Move ${definition.title} up`}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={isBusy || index === total - 1}
              onClick={() => onMove(panelId, index + 1)}
              className="h-8 w-8 rounded-full"
              aria-label={`Move ${definition.title} down`}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

export default function Home() {
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { commonplaceEnabled } = useCommonplaceFeatureFlag();
  const dashboardQuery = trpc.dashboard.overview.useQuery();
  const layoutQuery = trpc.dashboard.layout.useQuery();
  const legacyNotesQuery = trpc.notebook.list.useQuery({ page: 1, pageSize: 1 });
  const [isEditing, setIsEditing] = React.useState(false);
  const [panelOrder, setPanelOrder] = React.useState<DashboardPanelId[]>([...DEFAULT_DASHBOARD_PANEL_ORDER]);
  const [draggedPanelId, setDraggedPanelId] = React.useState<DashboardPanelId | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [announcement, setAnnouncement] = React.useState("");
  const [confirmReset, setConfirmReset] = React.useState(false);

  React.useEffect(() => {
    if (layoutQuery.data?.panelOrder && !isEditing) {
      setPanelOrder(normalizeDashboardPanelOrder(layoutQuery.data.panelOrder));
    }
  }, [isEditing, layoutQuery.data?.panelOrder]);

  const updateLayoutMutation = trpc.dashboard.updateLayout.useMutation();
  const resetLayoutMutation = trpc.dashboard.resetLayout.useMutation();
  const isLayoutBusy = updateLayoutMutation.isPending || resetLayoutMutation.isPending;

  const enableCommonplaceMutation = trpc.featureFlags.update.useMutation({
    onSuccess: async () => {
      await utils.featureFlags.list.invalidate();
      setLocation("/commonplace");
    },
  });

  const overview = dashboardQuery.data;
  const counts = overview?.counts;
  const isLoading = dashboardQuery.isLoading || legacyNotesQuery.isLoading;
  const totalArtifacts =
    (legacyNotesQuery.data?.pageInfo.total ?? 0) +
    (counts?.commonplace ?? 0) +
    (counts?.lexicon ?? 0) +
    (counts?.documents ?? 0) +
    (counts?.ideas ?? 0) +
    (counts?.books ?? 0);

  const knowledgeRegions = [
    { code: "01", eyebrow: "Foundations", title: "The Core", description: "Definitions, principles, and conceptual roots that stabilize the archive.", route: "/glossary", accent: "#e85b3e", pattern: "dev-pattern-waves", count: counts?.lexicon ?? 0, countLabel: "terms" },
    { code: "02", eyebrow: "Practice", title: "Atelier", description: "Active writing, deliberate projects, and work translated into form.", route: "/documents", accent: "#3fb8b0", pattern: "dev-pattern-stripes", count: (counts?.documents ?? 0) + (counts?.goals ?? 0), countLabel: "active works" },
    { code: "03", eyebrow: "Memory", title: "Archives", description: "Durable notes, books, and processed records retained for return.", route: "/library", accent: "#5c61ff", pattern: "dev-pattern-diamonds", count: (legacyNotesQuery.data?.pageInfo.total ?? 0) + (counts?.commonplace ?? 0) + (counts?.books ?? 0), countLabel: "records" },
    { code: "04", eyebrow: "Relations", title: "Network", description: "Taxonomic and semantic connections that reveal emerging structure.", route: "/search", accent: "#1d8fff", pattern: "dev-pattern-dots", count: counts?.links ?? 0, countLabel: "links" },
    { code: "05", eyebrow: "Flux", title: "Drafts", description: "Ephemeral captures, questions, and ideas still changing shape.", route: "/ideas", accent: "#efb93a", pattern: "dev-pattern-waves", count: counts?.activeIdeas ?? 0, countLabel: "ideas in play" },
    { code: "06", eyebrow: "Sources", title: "Canon", description: "Books, quotations, articles, and bookmarks that anchor inquiry.", route: "/commonplace", accent: "#3f8b4d", pattern: "dev-pattern-stripes", count: (counts?.books ?? 0) + (overview?.contentTypeCounts.quote ?? 0) + (overview?.contentTypeCounts.article ?? 0) + (overview?.contentTypeCounts.bookmark ?? 0), countLabel: "sources" },
  ];

  const metrics = [
    { label: "Artifacts", value: totalArtifacts, route: "/library", accent: "#1d8fff", letter: "A" },
    { label: "Notes", value: legacyNotesQuery.data?.pageInfo.total ?? 0, route: "/commonplace", accent: "#3fb8b0", letter: "N" },
    { label: "Ideas", value: counts?.activeIdeas ?? 0, route: "/ideas", accent: "#8454d8", letter: "I" },
    { label: "Sources", value: knowledgeRegions[5].count, route: "/library", accent: "#3f8b4d", letter: "S" },
  ];

  const monthlyActivity = overview?.monthlyActivity ?? [];
  const maxMonthlyActivity = Math.max(1, ...monthlyActivity.map((month) => month.total));

  const goToCommonplace = () => {
    if (commonplaceEnabled) {
      setLocation("/commonplace");
      return;
    }
    enableCommonplaceMutation.mutate({ flagKey: "commonplace_workspace", enabled: true });
  };

  const persistPanelOrder = async (nextOrder: DashboardPanelId[], previousOrder: DashboardPanelId[]) => {
    if (nextOrder.join("|") === previousOrder.join("|")) return;
    setPanelOrder(nextOrder);
    setSaveStatus("saving");
    try {
      const saved = await updateLayoutMutation.mutateAsync({ panelOrder: nextOrder });
      setPanelOrder(normalizeDashboardPanelOrder(saved.panelOrder));
      setSaveStatus("saved");
    } catch {
      setPanelOrder(previousOrder);
      setSaveStatus("error");
    }
  };

  const movePanel = (panelId: DashboardPanelId, targetIndex: number) => {
    if (isLayoutBusy) return;
    const previousOrder = [...panelOrder];
    const nextOrder = moveDashboardPanel(previousOrder, panelId, targetIndex);
    const definition = dashboardPanelDefinitions.find((panel) => panel.id === panelId)!;
    setAnnouncement(`${definition.title} moved to position ${nextOrder.indexOf(panelId) + 1} of ${nextOrder.length}.`);
    void persistPanelOrder(nextOrder, previousOrder);
  };

  const handleDrop = (targetPanelId: DashboardPanelId) => {
    if (!draggedPanelId || draggedPanelId === targetPanelId || isLayoutBusy) {
      setDraggedPanelId(null);
      return;
    }
    movePanel(draggedPanelId, panelOrder.indexOf(targetPanelId));
    setDraggedPanelId(null);
  };

  const resetLayout = async () => {
    const previousOrder = [...panelOrder];
    setPanelOrder([...DEFAULT_DASHBOARD_PANEL_ORDER]);
    setConfirmReset(false);
    setSaveStatus("saving");
    setAnnouncement("Restoring the default dashboard order.");
    try {
      const saved = await resetLayoutMutation.mutateAsync();
      setPanelOrder(normalizeDashboardPanelOrder(saved.panelOrder));
      setSaveStatus("saved");
      setAnnouncement("The default dashboard order has been restored.");
    } catch {
      setPanelOrder(previousOrder);
      setSaveStatus("error");
      setAnnouncement("The dashboard order could not be reset.");
    }
  };

  const panels: Record<DashboardPanelId, React.ReactNode> = {
    territory_metrics: (
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Knowledge territory metrics">
        {metrics.map((metric) => (
          <button key={metric.label} type="button" onClick={() => setLocation(metric.route)} className="atelier-metric-card group">
            <span className="atelier-metric-mark" style={{ backgroundColor: metric.accent }}>{metric.letter}</span>
            <span className="min-w-0 text-left">
              <span className="block text-[0.64rem] font-bold uppercase tracking-[0.22em] text-[#6b7487]">{metric.label}</span>
              <span className="block text-2xl font-black tracking-tight text-[#13243f]">{formatCount(metric.value, isLoading)}</span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4 text-[#13243f]/35 transition-transform group-hover:translate-x-1" />
          </button>
        ))}
      </section>
    ),
    atelier: (
      <section className="atelier-hero overflow-hidden">
        <div className="atelier-hero-copy">
          <div className="flex items-center gap-3 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#e85b3e]"><span className="h-2 w-2 rounded-full bg-[#e85b3e]" />The Atelier</div>
          <h1 className="mt-5 max-w-[11ch] text-[#13243f]">Welcome back to your <span className="text-[#e85b3e]">knowledge territory.</span></h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#48546a]">Your architecture is evolving. Today’s focus is structural integrity, aesthetic coherence, and the movement from captured material to durable understanding.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button onClick={goToCommonplace} disabled={enableCommonplaceMutation.isPending} className="atelier-primary-action"><Plus className="mr-2 h-4 w-4" />{commonplaceEnabled ? "Open the Commonplace" : enableCommonplaceMutation.isPending ? "Enabling…" : "Enable Commonplace"}</Button>
            <Button variant="outline" onClick={() => setLocation("/search")} className="atelier-secondary-action"><Search className="mr-2 h-4 w-4" /> Search the territory</Button>
          </div>
          <div className="mt-8 grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#48546a] sm:grid-cols-3">
            <span><strong className="text-[#e85b3e]">{formatCount(counts?.commonplace, isLoading)}</strong> working cards</span>
            <span><strong className="text-[#3fb8b0]">{formatCount(counts?.links, isLoading)}</strong> semantic links</span>
            <span><strong className="text-[#5c61ff]">06</strong> regions ready</span>
          </div>
        </div>
        <div className="atelier-geometry" aria-hidden="true"><span className="atelier-geometry-line" /><span className="atelier-geometry-circle atelier-geometry-circle-one" /><span className="atelier-geometry-circle atelier-geometry-circle-two" /><span className="atelier-geometry-dot" /></div>
      </section>
    ),
    recent_work: (
      <Card className="atelier-side-card h-full p-0 shadow-none">
        <div className="atelier-card-heading"><div><p className="atelier-kicker">Recent work</p><h2 className="text-2xl">Return to the thread</h2></div><Clock3 className="h-5 w-5 text-[#e85b3e]" /></div>
        <div className="divide-y divide-[#13243f]/10">
          {overview?.recentWork.length ? overview.recentWork.slice(0, 4).map((item) => (
            <button key={`${item.module}-${item.id}`} type="button" onClick={() => setLocation(item.route)} className="atelier-recent-row group">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: moduleTone[item.module] ?? "#13243f" }} />
              <span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-semibold text-[#13243f]">{item.title}</span><span className="mt-1 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#6b7487]">{item.detail} · {relativeDate(item.updatedAt)}</span></span>
              <ArrowRight className="h-4 w-4 text-[#13243f]/35 transition-transform group-hover:translate-x-1" />
            </button>
          )) : <div className="p-5 text-sm leading-6 text-[#6b7487]">Open a workspace to begin a recent-work trail.</div>}
        </div>
      </Card>
    ),
    node_atlas: (
      <Card className="atelier-side-card h-full p-0 shadow-none">
        <div className="atelier-card-heading"><div><p className="atelier-kicker">Node Atlas</p><h2 className="text-2xl">{counts?.links ? `${counts.links} live relations` : "In formation"}</h2></div><Network className="h-5 w-5 text-[#1d8fff]" /></div>
        <div className="p-4"><NodeAtlas relationships={overview?.relationships} /><Button variant="outline" onClick={() => setLocation("/search")} className="atelier-secondary-action mt-4 w-full">Explore relations <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
      </Card>
    ),
    knowledge_regions: (
      <section aria-labelledby="knowledge-regions-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="atelier-kicker">Knowledge architecture</p><h2 id="knowledge-regions-heading">Six regions of the territory</h2></div><p className="max-w-lg text-sm leading-6 text-[#6b7487]">A conceptual layer over the existing Johnny Decimal system—not a competing taxonomy.</p></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {knowledgeRegions.map((region) => (
            <button key={region.code} type="button" onClick={() => setLocation(region.route)} className="atelier-region-card group text-left">
              <div className={`${region.pattern} atelier-region-band`} style={{ backgroundColor: region.accent }} />
              <div className="p-5"><div className="flex items-start justify-between gap-4"><span className="atelier-region-code">{region.code}</span><span className="atelier-region-count">{formatCount(region.count, isLoading)} {region.countLabel}</span></div><p className="mt-5 text-[0.66rem] font-bold uppercase tracking-[0.22em]" style={{ color: region.accent }}>{region.eyebrow}</p><h3 className="mt-1 text-[1.85rem] leading-none">{region.title}</h3><p className="mt-3 text-sm leading-6 text-[#6b7487]">{region.description}</p><span className="mt-5 inline-flex items-center text-xs font-bold uppercase tracking-[0.16em] text-[#13243f]">Browse <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></span></div>
            </button>
          ))}
        </div>
      </section>
    ),
    accumulation_atlas: (
      <Card className="atelier-panel h-full p-5 shadow-none sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="atelier-kicker">Accumulation Atlas</p><h2 className="text-3xl">Seven months of growth</h2></div><span className="dev-chip">{formatCount(monthlyActivity.reduce((sum, month) => sum + month.total, 0), dashboardQuery.isLoading)} new records</span></div>
        <div className="atelier-chart mt-7" aria-label="Records added during the last seven months">
          {monthlyActivity.map((month) => <div key={month.key} className="atelier-chart-column"><span className="atelier-chart-value">{month.total}</span><span className="atelier-chart-bar" style={{ height: `${Math.max(4, (month.total / maxMonthlyActivity) * 100)}%` }} /><span className="atelier-chart-label">{month.label}</span></div>)}
          {!monthlyActivity.length && <div className="col-span-full py-12 text-center text-sm text-[#6b7487]">Activity appears here as records are added.</div>}
        </div>
      </Card>
    ),
    classification_key: (
      <Card className="atelier-panel h-full p-5 shadow-none sm:p-6">
        <p className="atelier-kicker">Classification key</p><h2 className="text-3xl">Content has a fixed signal</h2>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {contentTaxonomy.map((item) => <div key={item.key} className="atelier-key-row"><span className="h-3 w-3 rounded-full border border-black/30" style={{ backgroundColor: item.color }} /><span className="flex-1 text-sm font-semibold text-[#13243f]">{item.label}</span><span className="font-mono text-xs text-[#6b7487]">{formatCount(overview?.contentTypeCounts[item.key], dashboardQuery.isLoading)}</span></div>)}
        </div>
      </Card>
    ),
    quick_synthesis: (
      <Card className="atelier-panel h-full p-5 shadow-none sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="atelier-kicker">Quick synthesis</p><h2 className="text-3xl">Move knowledge through the system</h2></div><Sparkles className="h-6 w-6 text-[#5c61ff]" /></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => <button key={action.label} type="button" onClick={() => action.label === "Capture" ? goToCommonplace() : setLocation(action.route)} className="atelier-action-card group"><span className="atelier-action-icon" style={{ backgroundColor: action.accent }}><action.icon className="h-4 w-4" /></span><span className="mt-4 block text-sm font-black uppercase tracking-[0.13em] text-[#13243f]">{action.label}</span><span className="mt-1 block text-xs leading-5 text-[#6b7487]">{action.description}</span></button>)}
        </div>
      </Card>
    ),
    export_hub: (
      <Card className="atelier-export-card h-full p-5 shadow-none sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="atelier-kicker text-white/60">Export & share</p><h2 className="text-3xl text-white">Make knowledge portable.</h2></div><Layers3 className="h-6 w-6 text-[#f4c86a]" /></div>
        <div className="mt-6 grid grid-cols-2 gap-2">{[{ label: "JSON data", icon: FileJson }, { label: "Markdown", icon: FileText }, { label: "Plain text", icon: FileText }, { label: "Relational", icon: Network }].map((format) => <div key={format.label} className="atelier-export-format"><format.icon className="h-4 w-4" /><span>{format.label}</span></div>)}</div>
        <Button onClick={() => setLocation("/export")} className="mt-5 h-11 w-full rounded-full border border-white/25 bg-white text-[#13243f] hover:bg-[#f9f6ef]">Open export studio <ArrowRight className="ml-2 h-4 w-4" /></Button>
      </Card>
    ),
  };

  const hasCustomOrder = panelOrder.join("|") !== DEFAULT_DASHBOARD_PANEL_ORDER.join("|");

  return (
    <div className="atelier-dashboard space-y-5">
      <section className={`atelier-arrange-header ${isEditing ? "is-editing" : ""}`} aria-label="Dashboard arrangement controls">
        <div>
          <p className="atelier-kicker">Command center composition</p>
          <h2 className="text-2xl">{isEditing ? "Arrange your dashboard" : "Your dashboard, in your order"}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#6b7487]">{isEditing ? "Drag panels or use the arrow controls. Changes save automatically to your account." : "Reorder the atelier around the way you capture, connect, and synthesize knowledge."}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="atelier-save-status" aria-live="polite">
            {saveStatus === "saving" && <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving</>}
            {saveStatus === "saved" && <><Check className="h-3.5 w-3.5" /> Saved</>}
            {saveStatus === "error" && <>Save failed — your previous order was restored</>}
          </span>
          {isEditing && (confirmReset ? (
            <div className="atelier-reset-confirm" role="group" aria-label="Confirm reset dashboard order">
              <span>Restore default order?</span>
              <Button size="sm" variant="outline" onClick={() => void resetLayout()} disabled={isLayoutBusy}>Confirm</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)} disabled={isLayoutBusy}>Cancel</Button>
            </div>
          ) : (
            <Button type="button" variant="outline" onClick={() => setConfirmReset(true)} disabled={!hasCustomOrder || isLayoutBusy} className="rounded-full"><RotateCcw className="mr-2 h-4 w-4" /> Reset default</Button>
          ))}
          <Button type="button" onClick={() => { setIsEditing((current) => !current); setConfirmReset(false); }} className="atelier-primary-action">
            {isEditing ? <Check className="mr-2 h-4 w-4" /> : <SlidersHorizontal className="mr-2 h-4 w-4" />}
            {isEditing ? "Done" : "Arrange dashboard"}
          </Button>
        </div>
      </section>

      {(dashboardQuery.isError || layoutQuery.isError) && (
        <div className="atelier-notice" role="alert">Some live dashboard preferences are temporarily unavailable. Core workspaces and the default panel order remain accessible.</div>
      )}

      <div className="sr-only" aria-live="polite">{announcement}</div>

      <div className={`atelier-dashboard-grid ${isEditing ? "is-arranging" : ""}`}>
        {panelOrder.map((panelId, index) => (
          <DashboardPanelFrame
            key={panelId}
            panelId={panelId}
            index={index}
            total={panelOrder.length}
            isEditing={isEditing}
            isBusy={isLayoutBusy}
            isDragging={draggedPanelId === panelId}
            onMove={movePanel}
            onDragStart={(event, id) => {
              setDraggedPanelId(id);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", id);
            }}
            onDragEnd={() => setDraggedPanelId(null)}
            onDrop={handleDrop}
          >
            {panels[panelId]}
          </DashboardPanelFrame>
        ))}
      </div>
    </div>
  );
}

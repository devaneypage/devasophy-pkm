export const DASHBOARD_LAYOUT_VERSION = 1;

export const dashboardPanelDefinitions = [
  { id: "territory_metrics", title: "Territory Metrics", description: "At-a-glance collection totals and routes." },
  { id: "atelier", title: "The Atelier", description: "The command center’s primary orientation and entry actions." },
  { id: "recent_work", title: "Recent Work", description: "The most recently changed records across the knowledge system." },
  { id: "node_atlas", title: "Node Atlas", description: "A compact preview of live semantic relationships." },
  { id: "knowledge_regions", title: "Knowledge Regions", description: "Six conceptual territories mapped to existing workspaces." },
  { id: "accumulation_atlas", title: "Accumulation Atlas", description: "A seven-month view of knowledge growth." },
  { id: "classification_key", title: "Classification Key", description: "The fixed color signal for every Commonplace content type." },
  { id: "quick_synthesis", title: "Quick Synthesis", description: "Fast actions for moving knowledge through the system." },
  { id: "export_hub", title: "Export & Share", description: "Portable output formats and export-studio access." },
] as const;

export type DashboardPanelId = (typeof dashboardPanelDefinitions)[number]["id"];

export const dashboardPanelIds = dashboardPanelDefinitions.map((panel) => panel.id) as [
  DashboardPanelId,
  ...DashboardPanelId[],
];

export const DEFAULT_DASHBOARD_PANEL_ORDER: DashboardPanelId[] = dashboardPanelDefinitions.map((panel) => panel.id);

const dashboardPanelIdSet = new Set<DashboardPanelId>(DEFAULT_DASHBOARD_PANEL_ORDER);

export function isDashboardPanelId(value: unknown): value is DashboardPanelId {
  return typeof value === "string" && dashboardPanelIdSet.has(value as DashboardPanelId);
}

export function normalizeDashboardPanelOrder(value: unknown): DashboardPanelId[] {
  const saved = Array.isArray(value) ? value : [];
  const seen = new Set<DashboardPanelId>();
  const normalized: DashboardPanelId[] = [];

  for (const candidate of saved) {
    if (!isDashboardPanelId(candidate) || seen.has(candidate)) continue;
    seen.add(candidate);
    normalized.push(candidate);
  }

  for (const panelId of DEFAULT_DASHBOARD_PANEL_ORDER) {
    if (!seen.has(panelId)) normalized.push(panelId);
  }

  return normalized;
}

export function moveDashboardPanel(
  order: DashboardPanelId[],
  panelId: DashboardPanelId,
  targetIndex: number
): DashboardPanelId[] {
  const normalized = normalizeDashboardPanelOrder(order);
  const currentIndex = normalized.indexOf(panelId);
  if (currentIndex < 0) return normalized;

  const boundedTarget = Math.max(0, Math.min(normalized.length - 1, targetIndex));
  if (boundedTarget === currentIndex) return normalized;

  const next = [...normalized];
  next.splice(currentIndex, 1);
  next.splice(boundedTarget, 0, panelId);
  return next;
}

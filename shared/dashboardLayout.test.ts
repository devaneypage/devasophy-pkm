import { describe, expect, it } from "vitest";
import {
  DEFAULT_DASHBOARD_PANEL_ORDER,
  moveDashboardPanel,
  normalizeDashboardPanelOrder,
} from "./dashboardLayout";

describe("dashboard layout registry", () => {
  it("returns the canonical order for missing or invalid saved data", () => {
    expect(normalizeDashboardPanelOrder(null)).toEqual(DEFAULT_DASHBOARD_PANEL_ORDER);
    expect(normalizeDashboardPanelOrder(["unknown", 42])).toEqual(DEFAULT_DASHBOARD_PANEL_ORDER);
  });

  it("deduplicates saved identifiers and appends missing panels in canonical order", () => {
    const normalized = normalizeDashboardPanelOrder(["atelier", "territory_metrics", "atelier"]);
    expect(normalized.slice(0, 2)).toEqual(["atelier", "territory_metrics"]);
    expect(normalized).toHaveLength(DEFAULT_DASHBOARD_PANEL_ORDER.length);
    expect(new Set(normalized).size).toBe(DEFAULT_DASHBOARD_PANEL_ORDER.length);
  });

  it("moves a registered panel to a bounded target index", () => {
    const moved = moveDashboardPanel(DEFAULT_DASHBOARD_PANEL_ORDER, "export_hub", 0);
    expect(moved[0]).toBe("export_hub");
    expect(moveDashboardPanel(moved, "export_hub", 99).at(-1)).toBe("export_hub");
  });
});

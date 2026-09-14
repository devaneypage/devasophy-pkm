import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_DASHBOARD_PANEL_ORDER } from "@shared/dashboardLayout";

const setLocation = vi.fn();
const updateFeatureFlagMutate = vi.fn();
const invalidateFeatureFlags = vi.fn();
const updateLayoutMutateAsync = vi.fn();
const resetLayoutMutateAsync = vi.fn();
const commonplaceFlagState = { commonplaceEnabled: true, isLoading: false, flags: [] };
const layoutQueryState = {
  data: { panelOrder: [...DEFAULT_DASHBOARD_PANEL_ORDER], layoutVersion: 1, updatedAt: null as Date | null },
  isLoading: false,
  isError: false,
};

vi.mock("wouter", () => ({ useLocation: () => ["/", setLocation] }));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { name: "Devaney Page", email: "devaneypage@gmail.com" } }) }));
vi.mock("@/lib/featureFlags", () => ({ useCommonplaceFeatureFlag: () => commonplaceFlagState }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ featureFlags: { list: { invalidate: invalidateFeatureFlags } } }),
    featureFlags: {
      update: { useMutation: () => ({ isPending: false, mutate: updateFeatureFlagMutate }) },
    },
    dashboard: {
      overview: {
        useQuery: () => ({
          data: {
            generatedAt: new Date("2026-09-12T12:00:00.000Z"),
            counts: { commonplace: 8, lexicon: 7, documents: 1, ideas: 3, activeIdeas: 2, books: 4, goals: 1, tasks: 1, links: 5 },
            contentTypeCounts: { research_note: 2, bookmark: 1, idea: 1, quote: 2, book: 1, article: 1, glossary_term: 0, list: 0 },
            monthlyActivity: [
              { key: "2026-03", label: "Mar", total: 1 }, { key: "2026-04", label: "Apr", total: 3 },
              { key: "2026-05", label: "May", total: 2 }, { key: "2026-06", label: "Jun", total: 4 },
              { key: "2026-07", label: "Jul", total: 5 }, { key: "2026-08", label: "Aug", total: 2 },
              { key: "2026-09", label: "Sep", total: 1 },
            ],
            recentWork: [{ id: 1, module: "document", title: "Knowledge Architecture", detail: "draft", route: "/documents", updatedAt: new Date("2026-09-12T10:00:00.000Z") }],
            relationships: { total: 5, edges: [{ source: "notebook", target: "document", count: 5 }], linkTypes: [{ type: "supports", value: 5 }] },
          },
          isLoading: false,
          isError: false,
        }),
      },
      layout: { useQuery: () => layoutQueryState },
      updateLayout: { useMutation: () => ({ mutateAsync: updateLayoutMutateAsync, isPending: false }) },
      resetLayout: { useMutation: () => ({ mutateAsync: resetLayoutMutateAsync, isPending: false }) },
    },
    notebook: {
      list: { useQuery: () => ({ data: { items: [{}], pageInfo: { total: 12 } }, isLoading: false }) },
    },
  },
}));

import Home from "./Home";

describe("Home atelier dashboard", () => {
  beforeEach(() => {
    setLocation.mockClear();
    updateFeatureFlagMutate.mockClear();
    invalidateFeatureFlags.mockClear();
    updateLayoutMutateAsync.mockReset();
    resetLayoutMutateAsync.mockReset();
    updateLayoutMutateAsync.mockImplementation(async ({ panelOrder }) => ({ panelOrder, layoutVersion: 1, updatedAt: new Date() }));
    resetLayoutMutateAsync.mockResolvedValue({ panelOrder: [...DEFAULT_DASHBOARD_PANEL_ORDER], layoutVersion: 1, updatedAt: new Date() });
    layoutQueryState.data = { panelOrder: [...DEFAULT_DASHBOARD_PANEL_ORDER], layoutVersion: 1, updatedAt: null };
    layoutQueryState.isError = false;
    commonplaceFlagState.commonplaceEnabled = true;
  });

  it("renders the live atelier hierarchy, six regions, and classification system", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: /Welcome back to your knowledge territory/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Arrange dashboard/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Six regions of the territory" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Content has a fixed signal" })).toBeTruthy();
    expect(screen.getByText("Knowledge Architecture")).toBeTruthy();
  });

  it("routes the primary atelier actions to the expected destinations", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /Open the Commonplace/i }));
    fireEvent.click(screen.getByRole("button", { name: /Search the territory/i }));
    expect(setLocation).toHaveBeenNthCalledWith(1, "/commonplace");
    expect(setLocation).toHaveBeenNthCalledWith(2, "/search");
  });

  it("explores a selected atlas node and opens its collection", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /Explore Notes/i }));
    expect(screen.getByText("Commonplace notes and quotations · 5 connected relations")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Open Notes/i }));
    expect(setLocation).toHaveBeenCalledWith("/commonplace");
  });

  it("inspects a selected atlas edge", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /Notes to Drafts, 5 relationships/i }));
    expect(screen.getByText("Notes ↔ Drafts")).toBeTruthy();
    expect(screen.getByText("5 semantic relationships in the current atlas.")).toBeTruthy();
  });

  it("offers to enable the workspace instead of routing when the Commonplace flag is disabled", () => {
    commonplaceFlagState.commonplaceEnabled = false;
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /Enable Commonplace/i }));
    expect(updateFeatureFlagMutate).toHaveBeenCalledWith({ flagKey: "commonplace_workspace", enabled: true });
    expect(setLocation).not.toHaveBeenCalledWith("/commonplace");
  });

  it("moves a panel with accessible controls and saves the new account order", async () => {
    const { container } = render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /Arrange dashboard/i }));
    fireEvent.click(screen.getByRole("button", { name: /Move The Atelier up/i }));

    await waitFor(() => expect(updateLayoutMutateAsync).toHaveBeenCalledTimes(1));
    expect(updateLayoutMutateAsync.mock.calls[0][0].panelOrder.slice(0, 2)).toEqual(["atelier", "territory_metrics"]);
    expect(Array.from(container.querySelectorAll("[data-panel-id]")).slice(0, 2).map((node) => node.getAttribute("data-panel-id"))).toEqual(["atelier", "territory_metrics"]);
    expect(screen.getByText(/The Atelier moved to position 1 of 9/i)).toBeTruthy();
  });

  it("reorders panels through the native drag handle and persists the result", async () => {
    const { container } = render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /Arrange dashboard/i }));

    const dataTransfer = {
      effectAllowed: "none",
      setData: vi.fn(),
      getData: vi.fn(),
    };
    const dragHandle = screen.getByRole("button", { name: /Drag The Atelier/i });
    const target = container.querySelector('[data-panel-id="territory_metrics"]');
    expect(target).toBeTruthy();

    fireEvent.dragStart(dragHandle, { dataTransfer });
    fireEvent.dragOver(target!);
    fireEvent.drop(target!, { dataTransfer });

    await waitFor(() => expect(updateLayoutMutateAsync).toHaveBeenCalledTimes(1));
    expect(updateLayoutMutateAsync.mock.calls[0][0].panelOrder.slice(0, 2)).toEqual(["atelier", "territory_metrics"]);
  });

  it("rolls back the local order and exposes an error status when account saving fails", async () => {
    updateLayoutMutateAsync.mockRejectedValueOnce(new Error("Save failed"));
    const { container } = render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /Arrange dashboard/i }));
    fireEvent.click(screen.getByRole("button", { name: /Move The Atelier up/i }));

    await waitFor(() => expect(screen.getByText(/Save failed — your previous order was restored/i)).toBeTruthy());
    expect(Array.from(container.querySelectorAll("[data-panel-id]")).slice(0, 2).map((node) => node.getAttribute("data-panel-id"))).toEqual(["territory_metrics", "atelier"]);
  });

  it("restores and saves the canonical default order after confirmation", async () => {
    layoutQueryState.data = { panelOrder: ["atelier", "territory_metrics", ...DEFAULT_DASHBOARD_PANEL_ORDER.slice(2)], layoutVersion: 1, updatedAt: new Date() };
    const { container } = render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /Arrange dashboard/i }));
    fireEvent.click(screen.getByRole("button", { name: /Reset default/i }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(resetLayoutMutateAsync).toHaveBeenCalledTimes(1));
    expect(Array.from(container.querySelectorAll("[data-panel-id]")).slice(0, 2).map((node) => node.getAttribute("data-panel-id"))).toEqual(["territory_metrics", "atelier"]);
    expect(screen.getByText(/default dashboard order has been restored/i)).toBeTruthy();
  });
});

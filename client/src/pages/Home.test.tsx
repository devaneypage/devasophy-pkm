import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setLocation = vi.fn();
const updateFeatureFlagMutate = vi.fn();
const invalidateFeatureFlags = vi.fn();
const commonplaceFlagState = {
  commonplaceEnabled: true,
  isLoading: false,
  flags: [],
};

vi.mock("wouter", () => ({
  useLocation: () => ["/", setLocation],
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { name: "Devaney Page", email: "devaneypage@gmail.com" },
  }),
}));

vi.mock("@/lib/featureFlags", () => ({
  useCommonplaceFeatureFlag: () => commonplaceFlagState,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      featureFlags: {
        list: {
          invalidate: invalidateFeatureFlags,
        },
      },
    }),
    featureFlags: {
      update: {
        useMutation: () => ({
          isPending: false,
          mutate: updateFeatureFlagMutate,
        }),
      },
    },
    dashboard: {
      overview: {
        useQuery: () => ({
          data: {
            generatedAt: new Date("2026-09-12T12:00:00.000Z"),
            counts: {
              commonplace: 8,
              lexicon: 7,
              documents: 1,
              ideas: 3,
              activeIdeas: 2,
              books: 4,
              goals: 1,
              tasks: 1,
              links: 5,
            },
            contentTypeCounts: {
              research_note: 2,
              bookmark: 1,
              idea: 1,
              quote: 2,
              book: 1,
              article: 1,
              glossary_term: 0,
              list: 0,
            },
            monthlyActivity: [
              { key: "2026-03", label: "Mar", total: 1 },
              { key: "2026-04", label: "Apr", total: 3 },
              { key: "2026-05", label: "May", total: 2 },
              { key: "2026-06", label: "Jun", total: 4 },
              { key: "2026-07", label: "Jul", total: 5 },
              { key: "2026-08", label: "Aug", total: 2 },
              { key: "2026-09", label: "Sep", total: 1 },
            ],
            recentWork: [
              {
                id: 1,
                module: "document",
                title: "Knowledge Architecture",
                detail: "draft",
                route: "/documents",
                updatedAt: new Date("2026-09-12T10:00:00.000Z"),
              },
            ],
            relationships: {
              total: 5,
              edges: [{ source: "notebook", target: "document", count: 5 }],
              linkTypes: [{ type: "supports", value: 5 }],
            },
          },
          isLoading: false,
          isError: false,
        }),
      },
    },
    notebook: {
      list: {
        useQuery: () => ({
          data: { items: [{}], pageInfo: { total: 12 } },
          isLoading: false,
        }),
      },
    },
  },
}));

import Home from "./Home";

describe("Home atelier dashboard", () => {
  beforeEach(() => {
    setLocation.mockClear();
    updateFeatureFlagMutate.mockClear();
    invalidateFeatureFlags.mockClear();
    commonplaceFlagState.commonplaceEnabled = true;
  });

  it("renders the live atelier hierarchy, six regions, and classification system", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: /Welcome back to your knowledge territory/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Open the Commonplace/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Search the territory/i })).toBeTruthy();
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

  it("offers to enable the workspace instead of routing when the Commonplace flag is disabled", () => {
    commonplaceFlagState.commonplaceEnabled = false;

    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /Enable Commonplace/i }));

    expect(updateFeatureFlagMutate).toHaveBeenCalledWith({
      flagKey: "commonplace_workspace",
      enabled: true,
    });
    expect(setLocation).not.toHaveBeenCalledWith("/commonplace");
  });
});

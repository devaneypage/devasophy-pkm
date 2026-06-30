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

vi.mock("@/components/DevanomyIcons", () => ({
  EssaysIcon: () => <span>EssaysIcon</span>,
  NotesIcon: () => <span>NotesIcon</span>,
  QuotationsIcon: () => <span>QuotationsIcon</span>,
  ResearchIcon: () => <span>ResearchIcon</span>,
  VocabularyIcon: () => <span>VocabularyIcon</span>,
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
    notebook: { list: { useQuery: () => ({ data: new Array(12).fill({}), isLoading: false }) } },
    lexicon: { list: { useQuery: () => ({ data: new Array(7).fill({}), isLoading: false }) } },
    documents: { list: { useQuery: () => ({ data: [{ id: 1 }], isLoading: false }) } },
    goals: { list: { useQuery: () => ({ data: [{ id: 1, title: "Launch Devanomy" }], isLoading: false }) } },
    ideas: {
      list: {
        useQuery: () => ({
          data: [
            { id: 1, status: "seed" },
            { id: 2, status: "developed" },
            { id: 3, status: "archived" },
          ],
          isLoading: false,
        }),
      },
    },
    projects: { list: { useQuery: () => ({ data: [], isLoading: false }) } },
    tasks: {
      list: {
        useQuery: () => ({
          data: [
            { id: 1, title: "Polish dashboard", dueDate: new Date("2026-05-30T00:00:00.000Z"), status: "todo", priority: "high" },
          ],
          isLoading: false,
        }),
      },
    },
  },
}));

import Home from "./Home";

describe("Home dashboard branding refresh", () => {
  beforeEach(() => {
    setLocation.mockClear();
    updateFeatureFlagMutate.mockClear();
    invalidateFeatureFlags.mockClear();
    commonplaceFlagState.commonplaceEnabled = true;
  });

  it("renders the branded hero and Commonplace entry points when the workspace flag is enabled", () => {
    render(<Home />);

    expect(screen.getByAltText("Devanomy")).toBeTruthy();
    expect(screen.getByText("Devanomy editorial workspace")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Quick capture/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Unified search/i })).toBeTruthy();
    expect(screen.getByText("Ideas Lab")).toBeTruthy();
  });

  it("routes the primary hero actions to the expected destinations when Commonplace is enabled", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /Quick capture/i }));
    fireEvent.click(screen.getByRole("button", { name: /Unified search/i }));

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

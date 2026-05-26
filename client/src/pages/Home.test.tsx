import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setLocation = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/", setLocation],
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
}));

vi.mock("@/components/ui/calendar", () => ({
  Calendar: () => <div>Calendar widget</div>,
}));

vi.mock("@/../src/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { name: "Devaney Page", email: "devaneypage@gmail.com" },
  }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    notebook: {
      list: {
        useQuery: () => ({
          data: [
            { id: 1, text: "First note", author: "Arendt", collections: "Political theory" },
            { id: 2, text: "Second note", author: "Weil", collections: "Attention" },
          ],
          isLoading: false,
        }),
      },
    },
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
    projects: {
      list: {
        useQuery: () => ({
          data: [
            { id: 1, title: "LSAT Knowledge Graph", description: "Map reasoning patterns.", status: "active", startDate: "2026-05-01", endDate: "2026-06-01" },
          ],
          isLoading: false,
        }),
      },
    },
    tasks: {
      list: {
        useQuery: () => ({
          data: [
            { id: 1, title: "Polish dashboard", dueDate: new Date("2026-05-30T00:00:00.000Z"), status: "todo", priority: "high", projectId: 1 },
          ],
          isLoading: false,
        }),
      },
    },
  },
}));

import Home from "./Home";

describe("Home launchpad dashboard", () => {
  beforeEach(() => {
    setLocation.mockClear();
  });

  it("renders the launchpad hero and requested dashboard sections", () => {
    render(<Home />);

    expect(screen.getByText("Launchpad dashboard")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Quick capture/i })).toBeTruthy();
    expect(screen.getByText("Docket")).toBeTruthy();
    expect(screen.getByText("Projects in motion")).toBeTruthy();
    expect(screen.getByText("Mini calendar")).toBeTruthy();
    expect(screen.getByText("Notes preview")).toBeTruthy();
    expect(screen.getByText("LSAT Knowledge Graph")).toBeTruthy();
  });

  it("routes the primary launchpad actions to the new top-level destinations", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /Quick capture/i }));
    fireEvent.click(screen.getByRole("button", { name: /Explore knowledge base/i }));
    fireEvent.click(screen.getByRole("button", { name: /Open full calendar/i }));

    expect(setLocation).toHaveBeenNthCalledWith(1, "/notes");
    expect(setLocation).toHaveBeenNthCalledWith(2, "/knowledge-base");
    expect(setLocation).toHaveBeenNthCalledWith(3, "/calendar");
  });
});

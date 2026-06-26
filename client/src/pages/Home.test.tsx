import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setLocation = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/", setLocation],
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock("@/components/DevanomyIcons", () => ({
  EssaysIcon: () => <span>EssaysIcon</span>,
  NotesIcon: () => <span>NotesIcon</span>,
  QuotationsIcon: () => <span>QuotationsIcon</span>,
  ResearchIcon: () => <span>ResearchIcon</span>,
  VocabularyIcon: () => <span>VocabularyIcon</span>,
}));

vi.mock("@/client/src/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { name: "Devaney Page", email: "devaneypage@gmail.com" },
  }),
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { name: "Devaney Page", email: "devaneypage@gmail.com" },
  }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
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
  });

  it("renders the new branded hero and module entry points", () => {
    render(<Home />);

    expect(screen.getByAltText("Devanomy")).toBeTruthy();
    expect(screen.getByText("Devanomy editorial workspace")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Quick capture/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Unified search/i })).toBeTruthy();
    expect(screen.getByText("Ideas Lab")).toBeTruthy();
  });

  it("routes the primary hero actions to the expected destinations", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /Quick capture/i }));
    fireEvent.click(screen.getByRole("button", { name: /Unified search/i }));

    expect(setLocation).toHaveBeenNthCalledWith(1, "/notebook");
    expect(setLocation).toHaveBeenNthCalledWith(2, "/search");
  });
});

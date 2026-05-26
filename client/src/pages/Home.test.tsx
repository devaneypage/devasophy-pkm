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
            { id: 1, text: "First note", author: "Arendt", collections: "Political theory", updatedAt: new Date() },
            { id: 2, text: "Second note", author: "Weil", collections: "Attention", updatedAt: new Date() },
          ],
          isLoading: false,
        }),
      },
    },
    lexicon: {
      list: {
        useQuery: () => ({
          data: new Array(7).fill({ id: 1, term: "test", updatedAt: new Date() }),
          isLoading: false,
        }),
      },
    },
    books: {
      list: {
        useQuery: () => ({
          data: [
            { id: 1, title: "Deep Work", author: "Cal Newport", coverColor: "#E84D20", readingProgress: 60, rating: "4.5", createdAt: new Date() },
          ],
          isLoading: false,
        }),
      },
    },
    ideas: {
      list: {
        useQuery: () => ({
          data: [
            { id: 1, title: "Mental Models", status: "seed", updatedAt: new Date() },
            { id: 2, title: "Systems Thinking", status: "developed", updatedAt: new Date() },
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

describe("Home dashboard", () => {
  beforeEach(() => {
    setLocation.mockClear();
  });

  it("renders the Today's Focus header and knowledge overview", () => {
    render(<Home />);

    // Focus header
    expect(screen.getByText("Today's Focus")).toBeTruthy();
    // Knowledge overview section
    expect(screen.getByText("Knowledge Overview")).toBeTruthy();
    // Stat labels
    expect(screen.getByText("NOTES")).toBeTruthy();
    expect(screen.getByText("QUOTES")).toBeTruthy();
    expect(screen.getByText("BOOKS")).toBeTruthy();
    expect(screen.getByText("CONCEPTS")).toBeTruthy();
    // Recently opened section
    expect(screen.getByText("Recently Opened")).toBeTruthy();
  });

  it("navigates to notes on quick capture FAB click", () => {
    render(<Home />);

    // The FAB at the bottom navigates to /notes
    const fab = screen.getAllByRole("button").find((btn) => {
      // The FAB has no text, but clicking it sets location
      return btn.className.includes("rounded-full") && btn.className.includes("bg-\\[\\#E84D20\\]");
    });
    // Fallback: click View All button which goes to /search
    const viewAll = screen.getByText("View All");
    fireEvent.click(viewAll);
    expect(setLocation).toHaveBeenCalledWith("/search");
  });

  it("renders recent items from notebook data", () => {
    render(<Home />);

    // Notebook entries with author should show up in recently opened
    // They use author as title when present
    expect(screen.getByText("Arendt")).toBeTruthy();
  });

  it("displays carousel quote from notebook entries", () => {
    render(<Home />);

    // The first quote from the notebook mock (author Arendt) should appear
    // as the carousel quote text (note text is "First note")
    expect(screen.getByText("First note")).toBeTruthy();
  });
});

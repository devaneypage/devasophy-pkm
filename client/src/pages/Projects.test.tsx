import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setLocation = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/projects", setLocation],
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={className} {...props}>{children}</div>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    projects: {
      list: {
        useQuery: () => ({
          data: [
            { id: 1, title: "LSAT Knowledge Graph", description: "Map reasoning patterns.", status: "active", tags: "research, curriculum", startDate: "2026-05-01", endDate: "2026-06-01" },
            { id: 2, title: "Archived notes cleanup", description: "Refactor stale notes.", status: "archived", tags: "maintenance", startDate: null, endDate: null },
          ],
          isLoading: false,
        }),
      },
    },
    tasks: {
      list: {
        useQuery: () => ({
          data: [
            { id: 1, title: "Draft map", status: "completed", projectId: 1 },
            { id: 2, title: "Review map", status: "todo", projectId: 1 },
          ],
        }),
      },
    },
  },
}));

import Projects from "./Projects";

describe("Projects launchpad view", () => {
  beforeEach(() => {
    setLocation.mockClear();
  });

  it("filters the grid by project status", () => {
    render(<Projects />);

    expect(screen.getByText("LSAT Knowledge Graph")).toBeTruthy();
    expect(screen.getByText("Archived notes cleanup")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "active" }));

    expect(screen.getByText("LSAT Knowledge Graph")).toBeTruthy();
    expect(screen.queryByText("Archived notes cleanup")).toBeNull();
  });

  it("opens a detail modal with nested destination actions", () => {
    render(<Projects />);

    fireEvent.click(screen.getByText("LSAT Knowledge Graph"));

    expect(screen.getByText("Project detail")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Writing Studio/i }));

    expect(setLocation).toHaveBeenCalledWith("/documents");
  });
});

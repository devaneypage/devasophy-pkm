import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRefetch = vi.fn(async () => undefined);
const mockCreateGoal = vi.fn();
const mockUpdateGoal = vi.fn();
const mockDeleteGoal = vi.fn();

const mockGoals = [
  {
    id: 1,
    title: "Publish a jurisprudence essay series",
    description: "Use Devanomy to turn research notes into a visible essay arc.",
    status: "active",
    horizon: "annual",
    targetDate: new Date("2026-09-01T00:00:00.000Z"),
    tags: "writing,platform",
    linkedProjectId: 12,
  },
  {
    id: 2,
    title: "Stabilize intake workflow",
    description: "Clarify the short-term tutoring operations system.",
    status: "paused",
    horizon: "immediate",
    targetDate: null,
    tags: "operations",
    linkedProjectId: null,
  },
];

vi.mock("@/components/CategorySelect", () => ({
  default: () => <div data-testid="category-select" />,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    taxonomy: {
      getTree: {
        useQuery: () => ({ data: [], isLoading: false }),
      },
    },
    projects: {
      list: {
        useQuery: () => ({
          data: [{ id: 12, title: "Essay Platform" }],
          isLoading: false,
        }),
      },
    },
    goals: {
      list: {
        useQuery: () => ({
          data: mockGoals,
          isLoading: false,
          refetch: mockRefetch,
        }),
      },
      create: {
        useMutation: () => ({
          mutate: mockCreateGoal,
          isPending: false,
        }),
      },
      update: {
        useMutation: () => ({
          mutate: mockUpdateGoal,
          isPending: false,
        }),
      },
      delete: {
        useMutation: () => ({
          mutate: mockDeleteGoal,
          isPending: false,
        }),
      },
    },
  },
}));

import Goals from "./Goals";

describe("Goals page", () => {
  beforeEach(() => {
    mockRefetch.mockClear();
    mockCreateGoal.mockClear();
    mockUpdateGoal.mockClear();
    mockDeleteGoal.mockClear();
  });

  it("renders the goal list and applies status filters", async () => {
    render(<Goals />);

    expect(screen.getByText("Publish a jurisprudence essay series")).toBeTruthy();
    expect(screen.getByText("Stabilize intake workflow")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Active" })[0]);

    await waitFor(() => {
      expect(screen.getByText("Publish a jurisprudence essay series")).toBeTruthy();
      expect(screen.queryByText("Stabilize intake workflow")).toBeNull();
    });
  });

  it("submits a new goal with horizon and anchor project metadata", async () => {
    render(<Goals />);

    fireEvent.click(screen.getByRole("button", { name: "New goal" }));
    fireEvent.change(screen.getByPlaceholderText("Name the outcome you are steering toward"), {
      target: { value: "Launch a reasoning curriculum" },
    });
    fireEvent.click(
      screen.getByText("For what should move in the next few weeks.").closest("button") as HTMLButtonElement
    );
    fireEvent.change(document.querySelector('input[type="date"]') as HTMLInputElement, {
      target: { value: "2026-06-15" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "12" },
    });
    fireEvent.change(screen.getByPlaceholderText("Comma-separated tags"), {
      target: { value: "curriculum,lsat" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create goal" }));

    await waitFor(() => {
      expect(mockCreateGoal).toHaveBeenCalledWith({
        title: "Launch a reasoning curriculum",
        description: undefined,
        status: "active",
        horizon: "immediate",
        targetDate: new Date("2026-06-15"),
        tags: "curriculum,lsat",
        categoryId: undefined,
        linkedProjectId: 12,
      });
    });
  });

  it("cycles goal status forward from the card action", async () => {
    render(<Goals />);

    fireEvent.click(screen.getAllByRole("button", { name: "Advance status" })[0]);

    await waitFor(() => {
      expect(mockUpdateGoal).toHaveBeenCalledWith({
        id: 1,
        status: "paused",
      });
    });
  });
});

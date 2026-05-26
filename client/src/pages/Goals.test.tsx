import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRefetch = vi.fn(async () => undefined);
const mockCreateGoal = vi.fn();
const mockUpdateGoal = vi.fn();
const mockDeleteGoal = vi.fn();
let createShouldFail = false;
let updateShouldFail = false;

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
    categoryId: undefined,
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
    categoryId: undefined,
  },
];

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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
        useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => ({
          mutate: (payload: unknown) => {
            mockCreateGoal(payload);
            if (createShouldFail) {
              options?.onError?.(new Error("Create failed for test"));
              return;
            }
            options?.onSuccess?.();
          },
          isPending: false,
        }),
      },
      update: {
        useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => ({
          mutate: (payload: unknown) => {
            mockUpdateGoal(payload);
            if (updateShouldFail) {
              options?.onError?.(new Error("Update failed for test"));
              return;
            }
            options?.onSuccess?.();
          },
          isPending: false,
        }),
      },
      delete: {
        useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => ({
          mutate: (payload: unknown) => {
            mockDeleteGoal(payload);
            options?.onSuccess?.();
          },
          isPending: false,
        }),
      },
    },
  },
}));

import Goals from "./Goals";

describe("Goals page", () => {
  beforeEach(() => {
    createShouldFail = false;
    updateShouldFail = false;
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
    fireEvent.change(screen.getByLabelText("Create goal title"), {
      target: { value: "Launch a reasoning curriculum" },
    });
    fireEvent.click(
      screen.getByText("For what should move in the next few weeks.").closest("button") as HTMLButtonElement
    );
    fireEvent.change(screen.getByLabelText("Create target date"), {
      target: { value: "2026-06-15" },
    });
    fireEvent.change(screen.getByLabelText("Create anchor project"), {
      target: { value: "12" },
    });
    fireEvent.change(screen.getByLabelText("Create tags"), {
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

  it("supports inline editing for an existing goal", async () => {
    render(<Goals />);

    fireEvent.click(screen.getAllByRole("button", { name: "Edit goal" })[0]);
    fireEvent.change(screen.getByLabelText("Edit goal title"), {
      target: { value: "Publish a jurisprudence essay series v2" },
    });
    fireEvent.change(screen.getByLabelText("Edit tags"), {
      target: { value: "writing,platform,launch" },
    });
    fireEvent.change(screen.getByLabelText("Edit anchor project"), {
      target: { value: "12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockUpdateGoal).toHaveBeenCalledWith({
        id: 1,
        title: "Publish a jurisprudence essay series v2",
        description: "Use Devanomy to turn research notes into a visible essay arc.",
        status: "active",
        horizon: "annual",
        targetDate: new Date("2026-09-01"),
        tags: "writing,platform,launch",
        linkedProjectId: 12,
      });
    });
  });

  it("shows visible failure feedback when a goal update fails", async () => {
    updateShouldFail = true;
    render(<Goals />);

    fireEvent.click(screen.getAllByRole("button", { name: "Edit goal" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.getByText("Update failed for test")).toBeTruthy();
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

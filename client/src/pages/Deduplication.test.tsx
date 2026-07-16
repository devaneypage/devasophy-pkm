import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRefetch = vi.fn(async () => undefined);
const mockResolve = vi.fn(async (_payload: unknown) => ({ action: "archive", targetKeys: ["document:2"] }));

const mockGroups = [
  {
    id: "dedup-group-1",
    sameModule: false,
    allowedActions: ["archive", "delete"],
    suggestedCanonicalKey: "commonplace:1",
    confidence: 0.93,
    bases: ["title_body"],
    records: [
      {
        dedupKey: "commonplace:1",
        module: "commonplace",
        id: 1,
        label: "Archive architecture notes",
        title: "Archive architecture notes",
        body: "Rethink the board structure with calmer defaults.",
        entryType: "research_note",
        archivable: true,
      },
      {
        dedupKey: "document:2",
        module: "document",
        id: 2,
        label: "Archive architecture notes",
        title: "Archive architecture notes",
        body: "Rethink the board structure with calmer defaults.",
        archivable: true,
      },
    ],
  },
];

vi.mock("@/lib/trpc", () => ({
  trpc: {
    deduplication: {
      scan: {
        useQuery: () => ({
          data: mockGroups,
          isLoading: false,
          isFetching: false,
          error: null,
          refetch: mockRefetch,
        }),
      },
      resolve: {
        useMutation: (options?: { onSuccess?: (result: { action: string; targetKeys: string[] }) => void; onError?: (error: Error) => void }) => ({
          mutateAsync: async (payload: unknown) => {
            const result = await mockResolve(payload);
            options?.onSuccess?.(result);
            return result;
          },
          isPending: false,
        }),
      },
    },
  },
}));

import Deduplication from "./Deduplication";

describe("Deduplication page", () => {
  beforeEach(() => {
    mockRefetch.mockClear();
    mockResolve.mockClear();
  });

  it("renders duplicate groups and cross-module action guidance", () => {
    render(<Deduplication />);

    expect(screen.getByText("Deduplication Tool")).toBeTruthy();
    expect(screen.getAllByText("Archive architecture notes").length).toBeGreaterThan(0);
    expect(screen.getByText("Cross module")).toBeTruthy();
    expect(screen.getByText("title body")).toBeTruthy();
  });

  it("submits the selected canonical record and targets through the resolve mutation", async () => {
    render(<Deduplication />);

    fireEvent.click(screen.getByRole("button", { name: "Apply archive" }));

    await waitFor(() => {
      expect(mockResolve).toHaveBeenCalledWith({
        canonicalKey: "commonplace:1",
        targetKeys: ["document:2"],
        action: "archive",
      });
    });
  });
});

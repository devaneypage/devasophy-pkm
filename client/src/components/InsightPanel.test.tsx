import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockExtract = vi.fn();

const response = {
  module: "document" as const,
  recordId: 1,
  sourceTitle: "Essay Draft",
  generatedAt: "2026-08-25T12:00:00.000Z",
  insights: {
    thesis: "Education becomes durable when learners organize evidence into connected knowledge.",
    keyInsights: ["Structure supports recall.", "Connections support synthesis.", "Reflection converts information into knowledge."],
    themes: ["learning", "knowledge architecture"],
    openQuestions: ["Which structures best support transfer?"],
    suggestedConnections: ["Connect this draft to the paideia lexicon entry."],
    dikwAssessment: { tier: "knowledge" as const, rationale: "The record explains relationships rather than merely listing facts." },
    confidenceNote: "High confidence based on the supplied draft.",
  },
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    insights: {
      extract: {
        useMutation: (options?: { onSuccess?: (data: typeof response) => void }) => ({
          mutate: (input: { module: string; recordId: number }) => {
            mockExtract(input);
            options?.onSuccess?.(response);
          },
          isPending: false,
        }),
      },
    },
  },
}));

import InsightPanel from "./InsightPanel";

describe("InsightPanel", () => {
  beforeEach(() => {
    mockExtract.mockClear();
  });

  it("extracts and displays structured insights for the selected record", async () => {
    render(<InsightPanel module="document" recordId={1} sourceTitle="Essay Draft" />);

    expect(screen.getByText(/Results remain in this session/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Extract insights for Essay Draft" }));

    expect(mockExtract).toHaveBeenCalledWith({ module: "document", recordId: 1 });
    expect(await screen.findByText(response.insights.thesis)).toBeTruthy();
    expect(screen.getByText("knowledge architecture")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Refresh insights for Essay Draft" })).toBeTruthy();
  });

  it("clears a stale result when the selected record changes", async () => {
    const view = render(<InsightPanel module="document" recordId={1} sourceTitle="Essay Draft" />);
    fireEvent.click(screen.getByRole("button", { name: "Extract insights for Essay Draft" }));
    expect(await screen.findByText(response.insights.thesis)).toBeTruthy();

    view.rerender(<InsightPanel module="idea" recordId={2} sourceTitle="A new idea" />);

    await waitFor(() => {
      expect(screen.queryByText(response.insights.thesis)).toBeNull();
    });
    expect(screen.getByRole("button", { name: "Extract insights for A new idea" })).toBeTruthy();
  });
});

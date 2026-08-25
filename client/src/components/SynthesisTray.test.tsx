import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SynthesisProvider } from "@/contexts/SynthesisContext";
import SynthesisAction from "./SynthesisAction";
import SynthesisTray from "./SynthesisTray";

const mockAnalyze = vi.fn();

const synthesisResponse = {
  sources: [
    { module: "document" as const, recordId: 1, title: "Learning architecture", marker: "S1" },
    { module: "idea" as const, recordId: 2, title: "Knowledge transfer", marker: "S2" },
  ],
  generatedAt: "2026-08-25T12:00:00.000Z",
  synthesis: {
    thesis: "Knowledge architecture becomes durable when notes and developing ideas inform one another.",
    sharedThemes: [{ text: "Structure supports reuse.", sourceMarkers: ["S1", "S2"] }],
    tensions: [],
    emergentConnections: [{ text: "The draft can seed the idea's next iteration.", sourceMarkers: ["S1", "S2"] }],
    openQuestions: [],
    nextMoves: [{ text: "Draft a linked synthesis note.", sourceMarkers: ["S2"] }],
    confidenceNote: "High confidence within the selected source set.",
  },
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    synthesis: {
      analyze: {
        useMutation: (options?: { onSuccess?: (data: typeof synthesisResponse) => void }) => ({
          mutate: (input: unknown) => {
            mockAnalyze(input);
            options?.onSuccess?.(synthesisResponse);
          },
          isPending: false,
        }),
      },
    },
  },
}));

function TrayHarness() {
  return (
    <SynthesisProvider>
      <SynthesisAction module="document" recordId={1} sourceTitle="Learning architecture" />
      <SynthesisAction module="idea" recordId={2} sourceTitle="Knowledge transfer" />
      <SynthesisTray />
    </SynthesisProvider>
  );
}

describe("SynthesisTray", () => {
  beforeEach(() => mockAnalyze.mockClear());

  it("persists selected records in the tray and renders cited synthesis findings", async () => {
    render(<TrayHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Add Learning architecture to synthesis" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Knowledge transfer to synthesis" }));
    fireEvent.click(screen.getByRole("button", { name: /synthesis tray/i }));
    fireEvent.click(screen.getByRole("button", { name: "Synthesize selected records" }));

    expect(mockAnalyze).toHaveBeenCalledWith({
      sources: [
        { module: "document", recordId: 1 },
        { module: "idea", recordId: 2 },
      ],
    });
    expect(await screen.findByText(synthesisResponse.synthesis.thesis)).toBeTruthy();
    expect(screen.getAllByText("S1 · Learning architecture").length).toBeGreaterThan(0);
    expect(screen.getAllByText("S2 · Knowledge transfer").length).toBeGreaterThan(0);
  });

  it("clears a stale synthesis when the selected source set changes", async () => {
    render(<TrayHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Add Learning architecture to synthesis" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Knowledge transfer to synthesis" }));
    fireEvent.click(screen.getByRole("button", { name: /synthesis tray/i }));
    fireEvent.click(screen.getByRole("button", { name: "Synthesize selected records" }));
    expect(await screen.findByText(synthesisResponse.synthesis.thesis)).toBeTruthy();

    fireEvent.click(
      within(screen.getByLabelText("Multi-record synthesis tray")).getByRole("button", {
        name: "Remove Knowledge transfer from synthesis",
      })
    );

    await waitFor(() => {
      expect(screen.queryByText(synthesisResponse.synthesis.thesis)).toBeNull();
    });
    expect(screen.getByText(/Add 1 more record/)).toBeTruthy();
  });
});

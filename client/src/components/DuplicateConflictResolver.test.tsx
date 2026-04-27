import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DuplicateConflictResolver } from "./DuplicateConflictResolver";

describe("DuplicateConflictResolver", () => {
  const mockDuplicates = [
    {
      incomingIndex: 0,
      incomingText: "To be or not to be",
      matchedEntryId: 1,
      matchedText: "To be or not to be",
      similarity: 1.0,
      action: "skip",
    },
    {
      incomingIndex: 1,
      incomingText: "All the world's a stage",
      matchedEntryId: 2,
      matchedText: "All the world is a stage",
      similarity: 0.95,
      action: "skip",
    },
    {
      incomingIndex: 2,
      incomingText: "Something is rotten",
      matchedEntryId: 3,
      matchedText: "Something rotten in Denmark",
      similarity: 0.8,
      action: "skip",
    },
  ];

  const mockOnResolve = vi.fn();

  it("should render duplicates list", () => {
    render(
      <DuplicateConflictResolver
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
        entryType="notebook"
      />
    );

    expect(screen.getByText(/3 Potential Duplicates Found/)).toBeTruthy();
    expect(screen.getByText("To be or not to be")).toBeTruthy();
    expect(screen.getByText("All the world's a stage")).toBeTruthy();
  });

  it("should show similarity badges with correct colors", () => {
    render(
      <DuplicateConflictResolver
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
        entryType="notebook"
      />
    );

    // Check for similarity percentages
    expect(screen.getByText("100% - Exact Match")).toBeTruthy();
    expect(screen.getByText("95% - Very Similar")).toBeTruthy();
    expect(screen.getByText("80% - Similar")).toBeTruthy();
  });

  it("should allow changing resolution for individual duplicates", () => {
    render(
      <DuplicateConflictResolver
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
        entryType="notebook"
      />
    );

    // Find all merge buttons and click the first one
    const mergeButtons = screen.getAllByText("Merge");
    fireEvent.click(mergeButtons[0]);

    // Find all replace buttons and click the second one
    const replaceButtons = screen.getAllByText("Replace");
    fireEvent.click(replaceButtons[1]);

    // Click continue import
    const continueButton = screen.getByText("Continue Import");
    fireEvent.click(continueButton);

    expect(mockOnResolve).toHaveBeenCalled();
    const resolutions = mockOnResolve.mock.calls[0][0];
    expect(resolutions.get(0)).toBe("merge");
    expect(resolutions.get(1)).toBe("replace");
    expect(resolutions.get(2)).toBe("skip"); // Default
  });

  it("should support skip all action", () => {
    render(
      <DuplicateConflictResolver
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
        entryType="notebook"
      />
    );

    const skipAllButton = screen.getByText("Skip All");
    fireEvent.click(skipAllButton);

    const continueButton = screen.getByText("Continue Import");
    fireEvent.click(continueButton);

    expect(mockOnResolve).toHaveBeenCalled();
    const resolutions = mockOnResolve.mock.calls[0][0];
    expect(resolutions.get(0)).toBe("skip");
    expect(resolutions.get(1)).toBe("skip");
    expect(resolutions.get(2)).toBe("skip");
  });

  it("should support merge all action", () => {
    render(
      <DuplicateConflictResolver
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
        entryType="notebook"
      />
    );

    const mergeAllButton = screen.getByText("Merge All");
    fireEvent.click(mergeAllButton);

    const continueButton = screen.getByText("Continue Import");
    fireEvent.click(continueButton);

    expect(mockOnResolve).toHaveBeenCalled();
    const resolutions = mockOnResolve.mock.calls[0][0];
    expect(resolutions.get(0)).toBe("merge");
    expect(resolutions.get(1)).toBe("merge");
    expect(resolutions.get(2)).toBe("merge");
  });

  it("should render nothing when no duplicates", () => {
    const { container } = render(
      <DuplicateConflictResolver
        duplicates={[]}
        onResolve={mockOnResolve}
        entryType="notebook"
      />
    );

    expect(container.firstChild).toBeFalsy();
  });

  it("should support lexicon entry type", () => {
    const lexiconDuplicates = [
      {
        incomingIndex: 0,
        incomingTerm: "Serendipity",
        matchedEntryId: 1,
        matchedTerm: "Serendipity",
        similarity: 1.0,
        action: "skip",
      },
    ];

    render(
      <DuplicateConflictResolver
        duplicates={lexiconDuplicates}
        onResolve={mockOnResolve}
        entryType="lexicon"
      />
    );

    expect(screen.getByText("Serendipity")).toBeTruthy();
  });

  it("should handle entry detail dialog", () => {
    render(
      <DuplicateConflictResolver
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
        entryType="notebook"
      />
    );

    // Click on a duplicate card to open detail dialog
    const cards = screen.getAllByText(/Entry #/);
    fireEvent.click(cards[0]);

    // Check that detail dialog content appears
    expect(screen.getByText("Duplicate Details")).toBeTruthy();
    expect(screen.getByText("Similarity Score")).toBeTruthy();
  });

  it("should show resolution option descriptions in detail dialog", () => {
    render(
      <DuplicateConflictResolver
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
        entryType="notebook"
      />
    );

    // Click on a duplicate card to open detail dialog
    const cards = screen.getAllByText(/Entry #/);
    fireEvent.click(cards[0]);

    // Check for resolution descriptions
    expect(screen.getByText("Don't import the incoming entry. Keep the existing entry unchanged.")).toBeTruthy();
    expect(screen.getByText("Combine fields from both entries. Incoming data fills gaps in existing entry.")).toBeTruthy();
    expect(screen.getByText("Replace the existing entry entirely with the incoming entry.")).toBeTruthy();
  });

  it("should close detail dialog when close button is clicked", () => {
    render(
      <DuplicateConflictResolver
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
        entryType="notebook"
      />
    );

    // Click on a duplicate card to open detail dialog
    const cards = screen.getAllByText(/Entry #/);
    fireEvent.click(cards[0]);

    expect(screen.getByText("Duplicate Details")).toBeTruthy();

    // Click close button
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);

    // Dialog should be closed
    expect(screen.queryByText("Duplicate Details")).toBeFalsy();
  });
});

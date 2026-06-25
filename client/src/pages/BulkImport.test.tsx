import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BulkImport from "./BulkImport";
import { trpc } from "@/lib/trpc";

// Mock tRPC hooks
vi.mock("@/lib/trpc", () => ({
  trpc: {
    bulkImport: {
      notebookJSON: { useMutation: vi.fn() },
      lexiconJSON: { useMutation: vi.fn() },
      notebookCSV: { useMutation: vi.fn() },
      lexiconCSV: { useMutation: vi.fn() },
      notebookText: { useMutation: vi.fn() },
      lexiconText: { useMutation: vi.fn() },
      notebookWithDuplicateDetection: { useMutation: vi.fn() },
      lexiconWithDuplicateDetection: { useMutation: vi.fn() },
      detectNotebookDuplicateBatch: { useMutation: vi.fn() },
      detectLexiconDuplicateBatch: { useMutation: vi.fn() },
    },
    autofill: {
      loadUploadedFile: { useMutation: vi.fn() },
    },
  },
}));

describe("BulkImport taxonomy overrides", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock all mutations with complete return objects
    const mockMutation = {
      mutateAsync: vi.fn().mockResolvedValue({
        successful: 1,
        failed: 0,
        errors: [],
      }),
      isPending: false,
    };

    const mockAutofillMutation = {
      mutateAsync: vi.fn().mockResolvedValue({
        text: "",
        fileName: "",
      }),
      isPending: false,
    };

    const mockDuplicateBatchMutation = {
      mutateAsync: vi.fn().mockResolvedValue([]),
      isPending: false,
    };

    vi.mocked(trpc.bulkImport.notebookJSON.useMutation).mockReturnValue(mockMutation as any);
    vi.mocked(trpc.bulkImport.lexiconJSON.useMutation).mockReturnValue(mockMutation as any);
    vi.mocked(trpc.bulkImport.notebookCSV.useMutation).mockReturnValue(mockMutation as any);
    vi.mocked(trpc.bulkImport.lexiconCSV.useMutation).mockReturnValue(mockMutation as any);
    vi.mocked(trpc.bulkImport.notebookText.useMutation).mockReturnValue(mockMutation as any);
    vi.mocked(trpc.bulkImport.lexiconText.useMutation).mockReturnValue(mockMutation as any);
    vi.mocked(trpc.bulkImport.notebookWithDuplicateDetection.useMutation).mockReturnValue(mockMutation as any);
    vi.mocked(trpc.bulkImport.lexiconWithDuplicateDetection.useMutation).mockReturnValue(mockMutation as any);
    vi.mocked(trpc.bulkImport.detectNotebookDuplicateBatch.useMutation).mockReturnValue(mockDuplicateBatchMutation as any);
    vi.mocked(trpc.bulkImport.detectLexiconDuplicateBatch.useMutation).mockReturnValue(mockDuplicateBatchMutation as any);
    vi.mocked(trpc.autofill.loadUploadedFile.useMutation).mockReturnValue(mockAutofillMutation as any);
  });

  it("renders the BulkImport component with import module selection", () => {
    render(<BulkImport />);

    // Verify the component renders
    expect(screen.getByText("Bulk Import")).toBeTruthy();
    expect(screen.getByText("Choose import module")).toBeTruthy();
    expect(screen.getByText("Commonplace Notebook")).toBeTruthy();
    expect(screen.getByText("Clavis Aurea")).toBeTruthy();
  });

  it("allows switching between import types", () => {
    render(<BulkImport />);

    // Find and click the Clavis Aurea button
    const clavisButton = screen.getByText("Clavis Aurea").closest("button");
    if (clavisButton) {
      fireEvent.click(clavisButton);
      // Verify the button is now selected (has the -translate-y-1 class applied)
      expect(clavisButton.className).toContain("-translate-y-1");
    }
  });

  it("allows selecting file format", () => {
    render(<BulkImport />);

    // Find and click the CSV format button
    const csvButton = screen.getByText("CSV").closest("button");
    if (csvButton) {
      fireEvent.click(csvButton);
      // Verify the button is now selected
      expect(csvButton.className).toContain("-translate-y-1");
    }
  });

  it("displays import options when component is rendered", () => {
    render(<BulkImport />);

    // Verify import options are visible
    expect(screen.getByText("Auto-categorize entries based on content")).toBeTruthy();
  });

  it("renders the import guide sidebar", () => {
    render(<BulkImport />);

    // Verify the import guide is visible
    expect(screen.getByText("Import guide")).toBeTruthy();
    expect(screen.getByText("JSON Format")).toBeTruthy();
    expect(screen.getByText("CSV Format")).toBeTruthy();
  });

  it("renders the features list", () => {
    render(<BulkImport />);

    // Verify the features list is visible
    expect(screen.getByText("Features")).toBeTruthy();
    expect(screen.getByText(/Auto-categorization/)).toBeTruthy();
    expect(screen.getByText(/Unique ID generation/)).toBeTruthy();
    expect(screen.getByText(/Taxonomy overrides/)).toBeTruthy();
  });
});

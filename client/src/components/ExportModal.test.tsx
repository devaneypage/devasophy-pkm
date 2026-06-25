import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ExportModal } from "./ExportModal";
import { trpc } from "@/lib/trpc";

const booksRefetch = vi.fn();
const notesRefetch = vi.fn();
const combinedRefetch = vi.fn();
const booksJsonRefetch = vi.fn();
const notesJsonRefetch = vi.fn();
const booksMarkdownRefetch = vi.fn();
const notesMarkdownRefetch = vi.fn();
const booksPdfRefetch = vi.fn();
const notesPdfRefetch = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    export: {
      books: { useQuery: vi.fn() },
      notes: { useQuery: vi.fn() },
      combined: { useQuery: vi.fn() },
      booksJSON: { useQuery: vi.fn() },
      notesJSON: { useQuery: vi.fn() },
      booksMarkdown: { useQuery: vi.fn() },
      notesMarkdown: { useQuery: vi.fn() },
      booksPDF: { useQuery: vi.fn() },
      notesPDF: { useQuery: vi.fn() },
    },
  },
}));

describe("ExportModal advanced formats", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    booksRefetch.mockResolvedValue({
      data: { csv: "id,title\n1,Book", filename: "books_export_2026-06-25.csv" },
    });
    notesRefetch.mockResolvedValue({
      data: { csv: "id,text\n1,Note", filename: "notebook_export_2026-06-25.csv" },
    });
    combinedRefetch.mockResolvedValue({
      data: { csv: "combined", filename: "devanomy_export_2026-06-25.csv" },
    });
    booksJsonRefetch.mockResolvedValue({
      data: { format: "json", filename: "books_export_2026-06-25.json", data: [], metadata: { count: 0 } },
    });
    notesJsonRefetch.mockResolvedValue({
      data: { format: "json", filename: "notebook_export_2026-06-25.json", data: [], metadata: { count: 0 } },
    });
    booksMarkdownRefetch.mockResolvedValue({
      data: { format: "markdown", filename: "books_export_2026-06-25.md", content: "# Book Collection" },
    });
    notesMarkdownRefetch.mockResolvedValue({
      data: { format: "markdown", filename: "notebook_export_2026-06-25.md", content: "# Notebook Entries" },
    });
    booksPdfRefetch.mockResolvedValue({
      data: { format: "pdf", filename: "books_export_2026-06-25.pdf", base64: "UERG" },
    });
    notesPdfRefetch.mockResolvedValue({
      data: { format: "pdf", filename: "notebook_export_2026-06-25.pdf", base64: "UERG" },
    });

    vi.mocked(trpc.export.books.useQuery).mockReturnValue({ refetch: booksRefetch } as any);
    vi.mocked(trpc.export.notes.useQuery).mockReturnValue({ refetch: notesRefetch } as any);
    vi.mocked(trpc.export.combined.useQuery).mockReturnValue({ refetch: combinedRefetch } as any);
    vi.mocked(trpc.export.booksJSON.useQuery).mockReturnValue({ refetch: booksJsonRefetch } as any);
    vi.mocked(trpc.export.notesJSON.useQuery).mockReturnValue({ refetch: notesJsonRefetch } as any);
    vi.mocked(trpc.export.booksMarkdown.useQuery).mockReturnValue({ refetch: booksMarkdownRefetch } as any);
    vi.mocked(trpc.export.notesMarkdown.useQuery).mockReturnValue({ refetch: notesMarkdownRefetch } as any);
    vi.mocked(trpc.export.booksPDF.useQuery).mockReturnValue({ refetch: booksPdfRefetch } as any);
    vi.mocked(trpc.export.notesPDF.useQuery).mockReturnValue({ refetch: notesPdfRefetch } as any);

    vi.stubGlobal(
      "URL",
      {
        createObjectURL: vi.fn(() => "blob:mock-url"),
        revokeObjectURL: vi.fn(),
      } as unknown as typeof URL,
    );
  });

  it("renders CSV, JSON, and Markdown options for books exports", () => {
    render(<ExportModal isOpen={true} onClose={() => {}} exportType="books" />);

    expect(screen.getByText("CSV (spreadsheet compatible)")).toBeTruthy();
    expect(screen.getByText("JSON (structured interchange)")).toBeTruthy();
    expect(screen.getByText("Markdown (publishing and sharing)")).toBeTruthy();
    expect(screen.getByText("PDF (printing and archival)")).toBeTruthy();
  });

  it("disables JSON and Markdown for combined exports", () => {
    render(<ExportModal isOpen={true} onClose={() => {}} exportType="combined" />);

    const jsonOption = screen.getByLabelText("JSON (structured interchange)") as HTMLButtonElement;
    const markdownOption = screen.getByLabelText("Markdown (publishing and sharing)") as HTMLButtonElement;
    const pdfOption = screen.getByLabelText("PDF (printing and archival)") as HTMLButtonElement;

    expect(jsonOption.hasAttribute("disabled")).toBe(true);
    expect(markdownOption.hasAttribute("disabled")).toBe(true);
    expect(pdfOption.hasAttribute("disabled")).toBe(true);
  });

  it("updates the primary action label when the format changes", () => {
    render(<ExportModal isOpen={true} onClose={() => {}} exportType="books" />);

    expect(screen.getByText("Download CSV")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("JSON (structured interchange)"));
    expect(screen.getByText("Download JSON")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Markdown (publishing and sharing)"));
    expect(screen.getByText("Download Markdown")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("PDF (printing and archival)"));
    expect(screen.getByText("Download PDF")).toBeTruthy();
  });

  it("runs the JSON export query and closes the modal for books exports", async () => {
    const onClose = vi.fn();
    render(<ExportModal isOpen={true} onClose={onClose} exportType="books" />);

    fireEvent.click(screen.getByLabelText("JSON (structured interchange)"));
    fireEvent.click(screen.getByText("Download JSON"));

    await waitFor(() => {
      expect(booksJsonRefetch).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("runs the Markdown export query for notes exports", async () => {
    const onClose = vi.fn();
    render(<ExportModal isOpen={true} onClose={onClose} exportType="notes" />);

    fireEvent.click(screen.getByLabelText("Markdown (publishing and sharing)"));
    fireEvent.click(screen.getByText("Download Markdown"));

    await waitFor(() => {
      expect(notesMarkdownRefetch).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("runs the PDF export query for books exports", async () => {
    const onClose = vi.fn();
    render(<ExportModal isOpen={true} onClose={onClose} exportType="books" />);

    fireEvent.click(screen.getByLabelText("PDF (printing and archival)"));
    fireEvent.click(screen.getByText("Download PDF"));

    await waitFor(() => {
      expect(booksPdfRefetch).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

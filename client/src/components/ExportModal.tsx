import React, { useState } from "react";
import { skipToken } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: "books" | "notes" | "combined";
  selectedIds?: number[];
}

type ExportFormat = "csv" | "json" | "markdown" | "pdf";

export function ExportModal({ isOpen, onClose, exportType, selectedIds = [] }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [bookStatus, setBookStatus] = useState<"all" | "reading" | "completed" | "want_to_read">("all");
  const [bookSort, setBookSort] = useState<"recent" | "oldest" | "rating">("recent");
  const [bookTemplate, setBookTemplate] = useState<"annotated" | "catalog">("annotated");
  const [notesTemplate, setNotesTemplate] = useState<"reader" | "research">("reader");
  const [isExporting, setIsExporting] = useState(false);

  const bookFilters = {
    status: bookStatus === "all" ? undefined : (bookStatus as "reading" | "completed" | "want_to_read"),
    sortBy: bookSort,
    selectedIds: selectedIds.length > 0 ? selectedIds : undefined,
  };

  const noteFilters = {
    selectedIds: selectedIds.length > 0 ? selectedIds : undefined,
  };

  const booksExportQuery = trpc.export.books.useQuery(bookFilters, { enabled: false, staleTime: Infinity });
  const notesExportQuery = trpc.export.notes.useQuery(noteFilters, { enabled: false, staleTime: Infinity });
  const combinedExportQuery = trpc.export.combined.useQuery(skipToken);

  const booksJsonQuery = trpc.export.booksJSON.useQuery(
    { status: bookFilters.status, sortBy: bookSort },
    { enabled: false, staleTime: Infinity }
  );
  const notesJsonQuery = trpc.export.notesJSON.useQuery({}, { enabled: false, staleTime: Infinity });
  const booksMarkdownQuery = trpc.export.booksMarkdown.useQuery(
    { status: bookFilters.status, template: bookTemplate },
    { enabled: false, staleTime: Infinity }
  );
  const notesMarkdownQuery = trpc.export.notesMarkdown.useQuery({ template: notesTemplate }, { enabled: false, staleTime: Infinity });
  const booksPdfQuery = trpc.export.booksPDF.useQuery(
    { status: bookFilters.status, sortBy: bookSort, template: bookTemplate },
    { enabled: false, staleTime: Infinity }
  );
  const notesPdfQuery = trpc.export.notesPDF.useQuery({ template: notesTemplate }, { enabled: false, staleTime: Infinity });

  const downloadBlob = (content: BlobPart, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (format === "csv") {
        if (exportType === "books") {
          const result = await booksExportQuery.refetch();
          if (!result.data) throw new Error("Failed to export books");
          downloadBlob(result.data.csv, result.data.filename, "text/csv;charset=utf-8;");
        } else if (exportType === "notes") {
          const result = await notesExportQuery.refetch();
          if (!result.data) throw new Error("Failed to export notes");
          downloadBlob(result.data.csv, result.data.filename, "text/csv;charset=utf-8;");
        } else {
          const result = await combinedExportQuery.refetch();
          if (!result.data) throw new Error("Failed to export combined data");
          downloadBlob(result.data.csv, result.data.filename, "text/csv;charset=utf-8;");
        }
      } else if (format === "json") {
        if (exportType === "books") {
          const result = await booksJsonQuery.refetch();
          if (!result.data) throw new Error("Failed to export books JSON");
          downloadBlob(JSON.stringify(result.data, null, 2), result.data.filename, "application/json;charset=utf-8;");
        } else if (exportType === "notes") {
          const result = await notesJsonQuery.refetch();
          if (!result.data) throw new Error("Failed to export notes JSON");
          downloadBlob(JSON.stringify(result.data, null, 2), result.data.filename, "application/json;charset=utf-8;");
        } else {
          throw new Error("Combined JSON export is not available yet");
        }
      } else if (format === "markdown") {
        if (exportType === "books") {
          const result = await booksMarkdownQuery.refetch();
          if (!result.data) throw new Error("Failed to export books Markdown");
          downloadBlob(result.data.content, result.data.filename, "text/markdown;charset=utf-8;");
        } else if (exportType === "notes") {
          const result = await notesMarkdownQuery.refetch();
          if (!result.data) throw new Error("Failed to export notes Markdown");
          downloadBlob(result.data.content, result.data.filename, "text/markdown;charset=utf-8;");
        } else {
          throw new Error("Combined Markdown export is not available yet");
        }
      } else {
        if (exportType === "books") {
          const result = await booksPdfQuery.refetch();
          if (!result.data) throw new Error("Failed to export books PDF");
          downloadBlob(Uint8Array.from(atob(result.data.base64), (char) => char.charCodeAt(0)), result.data.filename, "application/pdf");
        } else if (exportType === "notes") {
          const result = await notesPdfQuery.refetch();
          if (!result.data) throw new Error("Failed to export notes PDF");
          downloadBlob(Uint8Array.from(atob(result.data.base64), (char) => char.charCodeAt(0)), result.data.filename, "application/pdf");
        } else {
          throw new Error("Combined PDF export is not available yet");
        }
      }

      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      alert(error instanceof Error ? error.message : "Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadLabel =
    format === "csv" ? "Download CSV" : format === "json" ? "Download JSON" : format === "markdown" ? "Download Markdown" : "Download PDF";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>
            Export {exportType === "combined" ? "All Data" : exportType === "books" ? "Books" : "Notes"}
          </DialogTitle>
          <DialogDescription>
            Choose an export format and download your curated knowledge in a reusable structure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="format-csv" />
                <Label htmlFor="format-csv" className="cursor-pointer font-normal">
                  CSV (spreadsheet compatible)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="format-json" disabled={exportType === "combined"} />
                <Label htmlFor="format-json" className={`cursor-pointer font-normal ${exportType === "combined" ? "opacity-50" : ""}`}>
                  JSON (structured interchange)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="markdown" id="format-markdown" disabled={exportType === "combined"} />
                <Label htmlFor="format-markdown" className={`cursor-pointer font-normal ${exportType === "combined" ? "opacity-50" : ""}`}>
                  Markdown (publishing and sharing)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="format-pdf" disabled={exportType === "combined"} />
                <Label htmlFor="format-pdf" className={`cursor-pointer font-normal ${exportType === "combined" ? "opacity-50" : ""}`}>
                  PDF (printing and archival)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {(exportType === "books" || exportType === "combined") && (
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-medium">Books Filter</Label>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="book-status" className="text-xs text-muted-foreground">
                    Status
                  </Label>
                  <Select value={bookStatus} onValueChange={(value) => setBookStatus(value as typeof bookStatus)}>
                    <SelectTrigger id="book-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Books</SelectItem>
                      <SelectItem value="reading">Currently Reading</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="want_to_read">Want to Read</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="book-sort" className="text-xs text-muted-foreground">
                    Sort By
                  </Label>
                  <Select value={bookSort} onValueChange={(value) => setBookSort(value as typeof bookSort)}>
                    <SelectTrigger id="book-sort" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="rating">Highest Rating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {exportType !== "combined" && format !== "csv" && format !== "json" && (
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-medium">Template</Label>
              {exportType === "books" ? (
                <Select value={bookTemplate} onValueChange={(value) => setBookTemplate(value as typeof bookTemplate)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annotated">Annotated</SelectItem>
                    <SelectItem value="catalog">Catalog</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select value={notesTemplate} onValueChange={(value) => setNotesTemplate(value as typeof notesTemplate)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reader">Reader</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="text-muted-foreground">
              {format === "csv"
                ? exportType === "combined"
                  ? "Exports all books and notes as a single CSV file with separate sections."
                  : exportType === "books"
                    ? "Exports your library for spreadsheet analysis, sorting, and backup."
                    : "Exports your notebook entries for spreadsheet review and archival."
                : format === "json"
                  ? "Exports structured records suitable for data interchange, scripting, and re-import workflows."
                  : format === "markdown"
                    ? "Exports a formatted document suitable for publishing, reading, and lightweight sharing."
                    : "Exports a print-ready PDF suited to review, archival, and formal sharing."}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="bg-orange-600 hover:bg-orange-700">
            {isExporting ? "Exporting..." : downloadLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

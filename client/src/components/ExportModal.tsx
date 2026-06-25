import React, { useState } from "react";
import { skipToken } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: "books" | "notes" | "combined";
  selectedIds?: number[];
}

export function ExportModal({ isOpen, onClose, exportType, selectedIds = [] }: ExportModalProps) {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [bookStatus, setBookStatus] = useState<"all" | "reading" | "completed" | "want_to_read">("all");
  const [bookSort, setBookSort] = useState<"recent" | "oldest" | "rating">("recent");
  const [isExporting, setIsExporting] = useState(false);

  // Export queries
  const booksExportQuery = trpc.export.books.useQuery(
    {
      status: bookStatus === "all" ? undefined : (bookStatus as "reading" | "completed" | "want_to_read"),
      sortBy: bookSort,
      selectedIds: selectedIds.length > 0 ? selectedIds : undefined,
    },
    { enabled: false, staleTime: Infinity }
  );

  const notesExportQuery = trpc.export.notes.useQuery(
    {
      selectedIds: selectedIds.length > 0 ? selectedIds : undefined,
    },
    { enabled: false, staleTime: Infinity }
  );

  const combinedExportQuery = trpc.export.combined.useQuery(skipToken);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let csvData: string;
      let filename: string;

      if (exportType === "books") {
        const result = await booksExportQuery.refetch();
        if (result.data) {
          csvData = result.data.csv;
          filename = result.data.filename;
        } else {
          throw new Error("Failed to export books");
        }
      } else if (exportType === "notes") {
        const result = await notesExportQuery.refetch();
        if (result.data) {
          csvData = result.data.csv;
          filename = result.data.filename;
        } else {
          throw new Error("Failed to export notes");
        }
      } else {
        const result = await combinedExportQuery.refetch();
        if (result.data) {
          csvData = result.data.csv;
          filename = result.data.filename;
        } else {
          throw new Error("Failed to export combined data");
        }
      }

      // Create blob and download
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export {exportType === "combined" ? "All Data" : exportType === "books" ? "Books" : "Notes"}</DialogTitle>
          <DialogDescription>
            Choose export options and download your data as CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as "csv" | "json")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="format-csv" />
                <Label htmlFor="format-csv" className="font-normal cursor-pointer">
                  CSV (Spreadsheet compatible)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="format-json" disabled />
                <Label htmlFor="format-json" className="font-normal cursor-pointer opacity-50">
                  JSON (Coming soon)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Books Export Options */}
          {(exportType === "books" || exportType === "combined") && (
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-medium">Books Filter</Label>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="book-status" className="text-xs text-muted-foreground">
                    Status
                  </Label>
                  <Select value={bookStatus} onValueChange={(v) => setBookStatus(v as any)}>
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
                  <Select value={bookSort} onValueChange={(v) => setBookSort(v as any)}>
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

          {/* Export Info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              {exportType === "combined"
                ? "Exports all your books and notebook entries as a single CSV file with sections."
                : exportType === "books"
                  ? "Exports your book collection with title, author, status, rating, and notes."
                  : "Exports your notebook entries with text, author, source, and metadata."}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="bg-orange-600 hover:bg-orange-700">
            {isExporting ? "Exporting..." : "Download CSV"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

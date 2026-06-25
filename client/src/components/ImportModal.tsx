import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, Upload, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importType: "books" | "notes";
}

export function ImportModal({ isOpen, onClose, importType }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const booksImportMutation = trpc.import.books.useMutation();
  const notesImportMutation = trpc.import.notes.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setError("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setError("");
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setIsImporting(true);
    setError("");

    try {
      const csvContent = await file.text();
      const mutation = importType === "books" ? booksImportMutation : notesImportMutation;

      const importResult = await mutation.mutateAsync({ csvContent });
      setResult(importResult);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl border border-black/10 bg-white p-6 shadow-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-black">
            Import {importType === "books" ? "Books" : "Notes"} from CSV
          </DialogTitle>
          <DialogDescription className="text-sm text-black/60">
            Upload a CSV file to populate your {importType === "books" ? "Library" : "Notes"}. The file should have columns matching the export format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          {!result && (
            <div className="space-y-2">
              <Label htmlFor="csv-file" className="text-sm font-semibold text-black">
                Select CSV File
              </Label>
              <div className="relative">
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={isImporting}
                  className="cursor-pointer"
                />
                {file && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-blue-50 p-2">
                    <span className="text-sm font-medium text-blue-900">{file.name}</span>
                    <button
                      onClick={() => setFile(null)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Import Result */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 mt-0.5" />
                <div className="text-sm text-green-700">
                  <div className="font-semibold">Import completed successfully!</div>
                  <div className="mt-1">
                    Imported: <span className="font-bold">{result.imported}</span> {importType === "books" ? "books" : "notes"}
                  </div>
                  {result.total > result.imported && (
                    <div className="mt-1 text-yellow-700">
                      Skipped: <span className="font-bold">{result.total - result.imported}</span> rows
                    </div>
                  )}
                </div>
              </div>

              {/* Error Details */}
              {result.errors && result.errors.length > 0 && (
                <div className="rounded-lg bg-yellow-50 p-3">
                  <div className="text-sm font-semibold text-yellow-900 mb-2">Issues encountered:</div>
                  <ul className="space-y-1 text-xs text-yellow-800">
                    {result.errors.slice(0, 5).map((err: string, idx: number) => (
                      <li key={idx}>• {err}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="text-yellow-700">... and {result.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Format Help */}
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs font-semibold text-gray-700 mb-2">Expected CSV Format:</div>
            <div className="text-xs text-gray-600 space-y-1">
              {importType === "books" ? (
                <>
                  <div>Required: <span className="font-mono">Title</span></div>
                  <div>Optional: Author, Status, Rating, Reading Progress, Notes, Tags</div>
                </>
              ) : (
                <>
                  <div>Required: <span className="font-mono">Text</span></div>
                  <div>Optional: Author, Work, Source Type, Location, Note, Tags, Collections</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t border-black/10">
          <Button
            variant="outline"
            onClick={handleClose}
            className="rounded-full border-black/10"
          >
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              disabled={!file || isImporting}
              className="rounded-full bg-[#E84D20] text-white hover:bg-[#d94d31]"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isImporting ? "Importing..." : "Import"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

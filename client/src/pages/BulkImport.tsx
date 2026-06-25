import React, { useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, FileJson2, Sparkles, Upload, UploadCloud } from "lucide-react";
import {
  analyzePreImportInput,
  inferCsvColumnMapping,
  normalizeLexiconImportPayload,
  normalizeNotebookImportPayload,
} from "@shared/pkmFormatting";
import { buildAutofillErrorMessage, buildAutofillLoadState } from "@shared/importAutofill";
import { DuplicateConflictResolver } from "@/components/DuplicateConflictResolver";

interface ImportResult {
  successful: number;
  failed: number;
  errors: string[];
}

type ImportType = "quotes" | "lexicon";
type FileFormat = "json" | "csv" | "text";

interface ColumnMapping {
  [key: string]: number; // column name -> column index
}

type DuplicateDecision = "skip" | "merge" | "replace";

type NotebookPreparedEntry = ReturnType<typeof normalizeNotebookImportPayload>[number];
type LexiconPreparedEntry = ReturnType<typeof normalizeLexiconImportPayload>[number];

type DuplicateConflict = {
  incomingIndex: number;
  incomingText?: string;
  incomingTerm?: string;
  matchedEntryId: number;
  matchedText?: string;
  matchedTerm?: string;
  similarity: number;
  action: string;
};

type PendingImportPayload =
  | { importType: "quotes"; entries: NotebookPreparedEntry[] }
  | { importType: "lexicon"; entries: LexiconPreparedEntry[] };

const importModes = {
  quotes: {
    title: "Commonplace Notebook",
    description: "Import quotations, passages, observations, metadata, and tags into your notebook.",
    accent: "#efb93a",
    pattern: "dev-pattern-waves",
    prompt: "Drop your Quotes file here",
  },
  lexicon: {
    title: "Clavis Aurea",
    description: "Import glossary entries, etymologies, definitions, and concordance notes.",
    accent: "#56c5ea",
    pattern: "dev-pattern-dots",
    prompt: "Drop your Clavis Aurea file here",
  },
} as const;

export default function BulkImport() {
  const [importType, setImportType] = useState<ImportType>("quotes");
  const [fileFormat, setFileFormat] = useState<FileFormat>("json");
  const [jsonInput, setJsonInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const [autoCategory, setAutoCategory] = useState(true);
  const [skipHeader, setSkipHeader] = useState(true);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [duplicateConflicts, setDuplicateConflicts] = useState<DuplicateConflict[]>([]);
  const [pendingImportPayload, setPendingImportPayload] = useState<PendingImportPayload | null>(null);
  const [isReviewingDuplicates, setIsReviewingDuplicates] = useState(false);
  const [rowCategoryOverrides, setRowCategoryOverrides] = useState<Map<number, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const notebookJSONMutation = trpc.bulkImport.notebookJSON.useMutation();
  const lexiconJSONMutation = trpc.bulkImport.lexiconJSON.useMutation();
  const notebookCSVMutation = trpc.bulkImport.notebookCSV.useMutation();
  const lexiconCSVMutation = trpc.bulkImport.lexiconCSV.useMutation();
  const notebookTextMutation = trpc.bulkImport.notebookText.useMutation();
  const lexiconTextMutation = trpc.bulkImport.lexiconText.useMutation();
  const notebookDuplicateMutation = trpc.bulkImport.notebookWithDuplicateDetection.useMutation();
  const lexiconDuplicateMutation = trpc.bulkImport.lexiconWithDuplicateDetection.useMutation();
  const notebookDuplicateBatchMutation = trpc.bulkImport.detectNotebookDuplicateBatch.useMutation();
  const lexiconDuplicateBatchMutation = trpc.bulkImport.detectLexiconDuplicateBatch.useMutation();
  const autofillMutation = trpc.autofill.loadUploadedFile.useMutation();

  const mode = importModes[importType];

  const preImportSummary = useMemo(() => {
    if (!jsonInput.trim()) return null;
    return analyzePreImportInput({
      rawText: jsonInput,
      importType,
      fileFormat,
      columnMapping,
      skipHeader,
    });
  }, [jsonInput, importType, fileFormat, columnMapping, skipHeader]);

  const blockingIssues = preImportSummary?.issues.filter((issue) => issue.severity === "error") ?? [];

  const fileHint = useMemo(() => {
    if (loadedFileName) return `Loaded file: ${loadedFileName}`;
    return importType === "lexicon"
      ? "Recommended: Clavis_Aurea_Complete.json"
      : "Recommended: Quotes-All_with_notes_with_metadata.json";
  }, [importType, loadedFileName]);

  const detectFileFormat = (fileName: string, text: string): FileFormat => {
    const lowered = fileName.toLowerCase();
    if (lowered.endsWith(".csv")) return "csv";
    if (lowered.endsWith(".txt")) return "text";
    if (lowered.endsWith(".json")) return "json";

    try {
      JSON.parse(text);
      return "json";
    } catch {
      return text.includes(",") ? "csv" : "text";
    }
  };

  const prepareJsonPayload = (): PendingImportPayload => {
    const data = JSON.parse(jsonInput);

    if (importType === "quotes") {
      const entries = normalizeNotebookImportPayload(data);
      if (entries.length === 0) {
        throw new Error("No valid notebook entries were found in the provided JSON payload.");
      }
      return { importType: "quotes", entries };
    }

    const entries = normalizeLexiconImportPayload(data);
    if (entries.length === 0) {
      throw new Error("No valid lexicon entries were found in the provided JSON payload.");
    }
    return { importType: "lexicon", entries };
  };

  const finalizeResolvedImport = async (
    payload: PendingImportPayload,
    resolutions: Map<number, DuplicateDecision>
  ) => {
    const duplicateIndexes = new Set(duplicateConflicts.map((item) => item.incomingIndex));
    const skipIndexes = new Set<number>();
    const mergeIndexes = new Set<number>();
    const replaceIndexes = new Set<number>();

    resolutions.forEach((decision, index) => {
      if (decision === "skip") skipIndexes.add(index);
      if (decision === "merge") mergeIndexes.add(index);
      if (decision === "replace") replaceIndexes.add(index);
    });

    const responses: ImportResult[] = [];

    if (payload.importType === "quotes") {
      const nonDuplicateEntries = payload.entries.filter((_, index) => !duplicateIndexes.has(index));
      const mergeEntries = payload.entries.filter((_, index) => mergeIndexes.has(index));
      const replaceEntries = payload.entries.filter((_, index) => replaceIndexes.has(index));

      if (nonDuplicateEntries.length > 0) {
        responses.push(await notebookJSONMutation.mutateAsync({ entries: nonDuplicateEntries, autoCategory }));
      }

      if (mergeEntries.length > 0) {
        responses.push(await notebookDuplicateMutation.mutateAsync({ entries: mergeEntries, autoCategory, onDuplicate: "merge" }));
      }

      if (replaceEntries.length > 0) {
        responses.push(await notebookDuplicateMutation.mutateAsync({ entries: replaceEntries, autoCategory, onDuplicate: "replace" }));
      }
    } else {
      const nonDuplicateEntries = payload.entries.filter((_, index) => !duplicateIndexes.has(index));
      const mergeEntries = payload.entries.filter((_, index) => mergeIndexes.has(index));
      const replaceEntries = payload.entries.filter((_, index) => replaceIndexes.has(index));

      if (nonDuplicateEntries.length > 0) {
        responses.push(await lexiconJSONMutation.mutateAsync({ entries: nonDuplicateEntries, autoCategory }));
      }

      if (mergeEntries.length > 0) {
        responses.push(await lexiconDuplicateMutation.mutateAsync({ entries: mergeEntries, autoCategory, onDuplicate: "merge" }));
      }

      if (replaceEntries.length > 0) {
        responses.push(await lexiconDuplicateMutation.mutateAsync({ entries: replaceEntries, autoCategory, onDuplicate: "replace" }));
      }
    }

    const skippedCount = skipIndexes.size;
    const combined = responses.reduce<ImportResult>(
      (acc, response) => ({
        successful: acc.successful + response.successful,
        failed: acc.failed + response.failed,
        errors: acc.errors.concat(response.errors ?? []),
      }),
      {
        successful: 0,
        failed: skippedCount,
        errors: skippedCount > 0 ? [`${skippedCount} duplicate entr${skippedCount === 1 ? "y was" : "ies were"} skipped by review choice.`] : [],
      }
    );

    setDuplicateConflicts([]);
    setPendingImportPayload(null);
    setIsReviewingDuplicates(false);
    setResult(combined);
    setJsonInput("");
    setLoadedFileName(null);
  };

  const handleDuplicateResolution = async (resolutions: Map<number, DuplicateDecision>) => {
    if (!pendingImportPayload) return;

    setIsImporting(true);
    try {
      await finalizeResolvedImport(pendingImportPayload, resolutions);
    } catch (error) {
      setResult({
        successful: 0,
        failed: 1,
        errors: [`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`],
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Bulk import using normalized payload preparation
  const handleBulkImport = async () => {
    if (!jsonInput.trim()) {
      setResult({ successful: 0, failed: 1, errors: ["Please provide data to import."] });
      return;
    }

    setIsImporting(true);
    try {
      let result: ImportResult;

      if (fileFormat === "json") {
        const payload = prepareJsonPayload();
        const duplicateMatches = payload.importType === "quotes"
          ? await notebookDuplicateBatchMutation.mutateAsync({
              entries: payload.entries.map((entry) => ({ text: entry.text, author: entry.author })),
            })
          : await lexiconDuplicateBatchMutation.mutateAsync({
              entries: payload.entries.map((entry) => ({ term: entry.term, definition: entry.definition })),
            });

        const dedupedMatches = Array.from(
          duplicateMatches.reduce((map, match) => {
            const current = map.get(match.incomingIndex);
            if (!current || match.similarity > current.similarity) {
              map.set(match.incomingIndex, match as DuplicateConflict);
            }
            return map;
          }, new Map<number, DuplicateConflict>()).values()
        );

        if (dedupedMatches.length > 0) {
          setDuplicateConflicts(dedupedMatches);
          setPendingImportPayload(payload);
          setIsReviewingDuplicates(true);
          setResult({
            successful: 0,
            failed: 0,
            errors: [`${dedupedMatches.length} possible duplicate entr${dedupedMatches.length === 1 ? "y requires" : "ies require"} review before import.`],
          });
          return;
        }

        result = payload.importType === "quotes"
          ? await notebookJSONMutation.mutateAsync({ entries: payload.entries, autoCategory })
          : await lexiconJSONMutation.mutateAsync({ entries: payload.entries, autoCategory });
      } else if (fileFormat === "csv") {
        const previewLines = jsonInput.split(/\r?\n/).filter((line) => line.trim().length > 0);
        const headerRow = previewLines[0]?.split(",") ?? [];
        const resolvedMapping = Object.keys(columnMapping).length > 0
          ? columnMapping
          : inferCsvColumnMapping(headerRow, importType);

        if (importType === "quotes") {
          if (resolvedMapping.text === undefined) {
            throw new Error("Unable to infer the text column from the CSV header. Please include a 'text' or 'quote' column.");
          }

          result = await notebookCSVMutation.mutateAsync({
            csvContent: jsonInput,
            columnMapping: resolvedMapping,
            autoCategory,
            skipHeader,
          });
        } else {
          if (resolvedMapping.term === undefined) {
            throw new Error("Unable to infer the term column from the CSV header. Please include a 'term' or 'word' column.");
          }

          result = await lexiconCSVMutation.mutateAsync({
            csvContent: jsonInput,
            columnMapping: resolvedMapping,
            autoCategory,
            skipHeader,
          });
        }
      } else {
        if (importType === "quotes") {
          result = await notebookTextMutation.mutateAsync({
            textContent: jsonInput,
            autoCategory,
          });
        } else {
          result = await lexiconTextMutation.mutateAsync({
            textContent: jsonInput,
            autoCategory,
          });
        }
      }

      setResult(result);
      setJsonInput("");
      setLoadedFileName(null);
    } catch (error) {
      setResult({
        successful: 0,
        failed: 1,
        errors: [`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleLoadedText = (text: string, fileName?: string, preferredSource?: ImportType) => {
    const state = buildAutofillLoadState({
      preferredSource: preferredSource ?? importType,
      text,
      fileName: fileName || loadedFileName || "Imported file",
    });

    setJsonInput(state.jsonInput);
    setLoadedFileName(state.loadedFileName);
    setImportType(state.importType);
    setResult(null);
    setDuplicateConflicts([]);
    setPendingImportPayload(null);
    setIsReviewingDuplicates(false);
    setRowCategoryOverrides(new Map());
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    setFileFormat(detectFileFormat(file.name, text));
    handleLoadedText(text, file.name, importType);
  };

  const handleAutofill = async (source: ImportType) => {
    try {
      const payload = await autofillMutation.mutateAsync({ source });
      handleLoadedText(payload.text, payload.fileName, source);
    } catch {
      setResult({
        successful: 0,
        failed: 1,
        errors: [buildAutofillErrorMessage(source)],
      });
    }
  };

  return (
    <div className="space-y-6">
      <section className="dev-soft-card p-6 sm:p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Ingestion and archive tools</p>
        <h1 className="mb-4">Bulk Import</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Import multiple entries at once from JSON, CSV, or plain text files. Before saving, the review workspace now surfaces suggested Johnny Decimal categories, then applies auto-categorization, identifiers, and taxonomy organization during import.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card className="dev-card rounded-[1.5rem] p-6 shadow-none">
            <h2 className="mb-4 text-[2rem] leading-none">Choose import module</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {(Object.entries(importModes) as Array<[ImportType, typeof importModes.quotes]>).map(([key, item]) => {
                const selected = importType === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setImportType(key);
                      setResult(null);
                    }}
                    className={`overflow-hidden rounded-[1.3rem] border-2 border-black bg-white text-left transition ${selected ? "-translate-y-1" : "hover:-translate-y-1"}`}
                  >
                    <div className={`${item.pattern} h-5 w-full`} style={{ backgroundColor: item.accent }} />
                    <div className="space-y-2 p-5">
                      <p className="text-xl font-bold text-foreground">{item.title}</p>
                      <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="dev-card rounded-[1.5rem] p-6 shadow-none">
            <h2 className="mb-4 text-[2rem] leading-none">Choose file format</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {(["json", "csv", "text"] as const).map((fmt) => {
                const titles = { json: "JSON", csv: "CSV", text: "Plain Text" };
                const descriptions = {
                  json: "Structured data with full metadata",
                  csv: "Spreadsheet format with column mapping",
                  text: "Simple text, one entry per line",
                };
                const selected = fileFormat === fmt;
                return (
                  <button
                    key={fmt}
                    onClick={() => {
                      setFileFormat(fmt);
                      setResult(null);
                    }}
                    className={`rounded-[1.3rem] border-2 border-black bg-white p-4 text-left transition ${selected ? "-translate-y-1" : "hover:-translate-y-1"}`}
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#56c5ea]">
                      <FileJson2 className="h-5 w-5 text-black" />
                    </div>
                    <p className="text-lg font-bold text-foreground">{titles[fmt]}</p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{descriptions[fmt]}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="dev-card rounded-[1.5rem] p-6 shadow-none">
            <div className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] xl:items-start">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-[2rem] leading-none">Upload or paste data</h2>
                  <span className="rounded-full border border-black/15 bg-[#f6f3ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {fileFormat === "json" ? "JSON files" : fileFormat === "csv" ? "CSV files" : "Text files"}
                  </span>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Drop a file, choose one manually, or use the autofill buttons to load your previously uploaded datasets directly into the editor.
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-black/10 bg-[#f6f3ec] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Autofill from uploaded archive</p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Button
                    type="button"
                    onClick={() => void handleAutofill("quotes")}
                    disabled={autofillMutation.isPending}
                    className="h-11 justify-start rounded-full border-2 border-black bg-white px-4 text-black shadow-none hover:bg-white"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Load Quotes file
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleAutofill("lexicon")}
                    disabled={autofillMutation.isPending}
                    className="h-11 justify-start rounded-full border-2 border-black bg-white px-4 text-black shadow-none hover:bg-white"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Load Clavis Aurea file
                  </Button>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  These buttons load the previously uploaded source files directly into the import workspace.
                </p>
              </div>
            </div>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragActive(true);
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                if (event.currentTarget === event.target) {
                  setIsDragActive(false);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragActive(false);
                const file = event.dataTransfer.files?.[0];
                if (file) {
                  void handleFile(file);
                }
              }}
              className={`rounded-[1.4rem] border-2 border-dashed p-6 transition ${isDragActive ? "border-black bg-[#f6f3ec]" : "border-black/35 bg-white"}`}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-black bg-white">
                  {isDragActive ? <UploadCloud className="h-6 w-6 text-black" /> : <FileJson2 className="h-6 w-6 text-black" />}
                </div>
                <p className="text-lg font-semibold text-foreground">{mode.prompt}</p>
                <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                  Drop a file to auto-load it into the editor below. The workspace will automatically detect the format and switch to the correct import mode.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {autofillMutation.isPending ? "Loading uploaded file..." : fileHint}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={fileFormat === "json" ? ".json" : fileFormat === "csv" ? ".csv" : ".txt"}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleFile(file);
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-5 h-11 rounded-full border-2 border-black bg-[#116d6d] px-5 text-white shadow-none hover:bg-[#0f5959]"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose file
                </Button>
              </div>
            </div>
          </Card>

          <Card className="dev-card rounded-[1.5rem] p-6 shadow-none">
            <h2 className="mb-4 text-[2rem] leading-none">
              {fileFormat === "json" ? "Paste or review JSON" : fileFormat === "csv" ? "Paste or review CSV" : "Paste or review text"}
            </h2>
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={
                fileFormat === "json"
                  ? "Paste your JSON array or dropped file content here..."
                  : fileFormat === "csv"
                    ? "Paste your CSV data here (with or without header)..."
                    : "Paste your text here, one entry per line..."
              }
              rows={14}
              className="rounded-[1.3rem] border-2 border-black/85 bg-white font-mono text-sm shadow-none"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={handleBulkImport}
                disabled={isImporting || !jsonInput.trim() || (preImportSummary?.validEntries ?? 0) === 0 || blockingIssues.length > 0}
                className="h-11 rounded-full border-2 border-black bg-[#116d6d] px-5 text-white shadow-none hover:bg-[#0f5959]"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isImporting ? "Importing..." : "Import data"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setJsonInput("");
                  setResult(null);
                  setLoadedFileName(null);
                }}
                className="h-11 rounded-full border-2 border-black bg-white px-5 text-black shadow-none hover:bg-[#f6f3ec]"
              >
                Clear
              </Button>
            </div>
          </Card>

          <Card className="dev-card rounded-[1.5rem] p-6 shadow-none">
            <h2 className="mb-4 text-[2rem] leading-none">Import options</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={autoCategory}
                  onChange={(e) => setAutoCategory(e.target.checked)}
                  className="h-4 w-4 rounded border-2 border-black"
                />
                <span className="text-sm font-medium">Auto-categorize entries based on content</span>
              </label>
              {fileFormat === "csv" && (
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={skipHeader}
                    onChange={(e) => setSkipHeader(e.target.checked)}
                    className="h-4 w-4 rounded border-2 border-black"
                  />
                  <span className="text-sm font-medium">Skip first row (header)</span>
                </label>
              )}
            </div>
          </Card>

          {preImportSummary && (
            <Card className="dev-card rounded-[1.5rem] p-6 shadow-none">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Pre-import review</p>
                  <h2 className="mt-2 text-[2rem] leading-none">Summary and validation report</h2>
                </div>
                <span className="rounded-full border border-black/15 bg-[#f6f3ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {preImportSummary.detectedSource}
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[1.3rem] border border-black/10 bg-[#f6f3ec] p-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Data quality</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1rem] border border-black/10 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Valid entries</p>
                      <p className="mt-2 text-3xl font-bold text-foreground">{preImportSummary.validEntries}</p>
                    </div>
                    <div className="rounded-[1rem] border border-black/10 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Invalid entries</p>
                      <p className="mt-2 text-3xl font-bold text-[#e25b33]">{preImportSummary.invalidEntries}</p>
                    </div>
                    <div className="rounded-[1rem] border border-black/10 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Warnings</p>
                      <p className="mt-2 text-3xl font-bold text-foreground">{preImportSummary.warningCount}</p>
                    </div>
                    <div className="rounded-[1rem] border border-black/10 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Input rows</p>
                      <p className="mt-2 text-3xl font-bold text-foreground">{preImportSummary.totalInputRows}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.3rem] border border-black/10 bg-[#f6f3ec] p-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Import impact</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1rem] border border-black/10 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Candidate rows</p>
                      <p className="mt-2 text-3xl font-bold text-foreground">{preImportSummary.candidateRows}</p>
                    </div>
                    <div className="rounded-[1rem] border border-black/10 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Duplicate groups</p>
                      <p className="mt-2 text-3xl font-bold text-foreground">{preImportSummary.duplicateCandidateCount}</p>
                    </div>
                    <div className="rounded-[1rem] border border-black/10 bg-white p-4 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ready to import</p>
                      <p className="mt-2 text-base leading-7 text-muted-foreground">
                        {blockingIssues.length > 0
                          ? "The current import has blocking issues. Resolve the errors below before importing."
                          : preImportSummary.validEntries > 0
                            ? `This upload will submit ${preImportSummary.validEntries} validated ${importType === "quotes" ? "notebook entries" : "lexicon entries"} for import.`
                            : "No valid rows are ready yet. Adjust the file or format and review the report again."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {fileFormat === "csv" && Object.keys(preImportSummary.inferredMapping).length > 0 && (
                <div className="mt-5 rounded-[1.3rem] border border-black/10 bg-white p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Inferred CSV mapping</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(preImportSummary.inferredMapping).map(([field, index]) => (
                      <span key={field} className="rounded-full border border-black/10 bg-[#f6f3ec] px-3 py-1 text-xs font-medium text-foreground">
                        {field} → column {index + 1}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {preImportSummary.samplePreviews.length > 0 && (
                <div className="mt-5 rounded-[1.3rem] border border-black/10 bg-white p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Sample preview</p>
                  <div className="space-y-2 text-sm leading-6 text-muted-foreground">
                    {preImportSummary.samplePreviews.map((sample) => (
                      <p key={sample}>{sample}</p>
                    ))}
                  </div>
                </div>
              )}

              {preImportSummary.taxonomySuggestionCount > 0 && (
                <div className="mt-5 rounded-[1.3rem] border border-black/10 bg-white p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Taxonomy suggestions</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Suggested Johnny Decimal categories are now available for {preImportSummary.taxonomySuggestionCount} valid {importType === "quotes" ? "notebook entries" : "lexicon entries"} before save.
                        {autoCategory
                          ? " Auto-categorization is enabled, so these recommendations will guide the saved import."
                          : " Auto-categorization is currently off, so these recommendations are advisory until you enable automatic categorization."}
                      </p>
                    </div>
                    <span className="rounded-full border border-black/10 bg-[#f6f3ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Preview ready
                    </span>
                  </div>

                  {preImportSummary.taxonomyGroups.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {preImportSummary.taxonomyGroups.map((group) => (
                        <span key={group.categoryNumber} className="rounded-full border border-black/10 bg-[#f6f3ec] px-3 py-2 text-xs font-medium text-foreground">
                          {group.categoryNumber} · {group.categoryName} · {group.count}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    {preImportSummary.taxonomySuggestions.map((suggestion) => {
                      const selectedCategory = rowCategoryOverrides.get(suggestion.rowIndex) ?? suggestion.categoryNumber;
                      const selectedCategoryName = preImportSummary.taxonomyGroups.find((g) => g.categoryNumber === selectedCategory)?.categoryName ?? suggestion.categoryName;
                      const alternativeCategories = preImportSummary.taxonomyGroups
                        .filter((group) => group.categoryNumber !== suggestion.categoryNumber)
                        .slice(0, 3);

                      return (
                        <div key={`${suggestion.rowLabel}-${suggestion.categoryNumber}-${suggestion.preview}`} className="rounded-[1rem] border border-black/10 bg-[#f6f3ec] p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{suggestion.rowLabel}</p>
                            <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              {suggestion.confidence} confidence
                            </span>
                          </div>
                          <p className="mt-3 text-sm font-semibold text-foreground">
                            {selectedCategory} · {selectedCategoryName}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{suggestion.preview}</p>
                          <p className="mt-2 text-xs leading-5 text-muted-foreground">{suggestion.reason}</p>
                          {alternativeCategories.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              <p className="w-full text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Override to:</p>
                              {alternativeCategories.map((alt) => (
                                <button
                                  key={alt.categoryNumber}
                                  onClick={() => {
                                    const newOverrides = new Map(rowCategoryOverrides);
                                    newOverrides.set(suggestion.rowIndex, alt.categoryNumber);
                                    setRowCategoryOverrides(newOverrides);
                                  }}
                                  className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-foreground transition hover:bg-[#f6f3ec]"
                                >
                                  {alt.categoryNumber} · {alt.categoryName.slice(0, 20)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-[1.3rem] border border-black/10 bg-white p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Validation report</p>
                <div className="space-y-3">
                  {preImportSummary.issues.length === 0 ? (
                    <p className="text-sm leading-6 text-muted-foreground">No validation issues were detected. This import is ready for review and submission.</p>
                  ) : (
                    preImportSummary.issues.map((issue, index) => (
                      <div key={`${issue.rowLabel}-${index}`} className="rounded-[1rem] border border-black/10 bg-[#f6f3ec] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{issue.severity} · {issue.rowLabel}</p>
                        <p className="mt-2 text-sm leading-6 text-foreground">{issue.message}</p>
                        {issue.preview ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{issue.preview}</p> : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          )}

          {isReviewingDuplicates && duplicateConflicts.length > 0 && (
            <Card className="dev-card rounded-[1.5rem] p-6 shadow-none">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Duplicate review</p>
                <h2 className="mt-2 text-[2rem] leading-none">Resolve matching entries before import</h2>
              </div>
              <DuplicateConflictResolver
                duplicates={duplicateConflicts}
                entryType={pendingImportPayload?.importType === "lexicon" ? "lexicon" : "notebook"}
                onResolve={handleDuplicateResolution}
              />
            </Card>
          )}

          {result && (
            <Card className="dev-card rounded-[1.5rem] p-6 shadow-none">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black"
                  style={{ backgroundColor: result.failed === 0 ? "#bfd73d" : "#efb93a" }}
                >
                  {result.failed === 0 ? <CheckCircle className="h-5 w-5 text-black" /> : <AlertCircle className="h-5 w-5 text-black" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-[1.8rem] leading-none">Import complete</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    <strong className="text-foreground">{result.successful} successful</strong>
                    {result.failed > 0 ? (
                      <>
                        {" "}· <strong className="text-[#e25b33]">{result.failed} failed</strong>
                      </>
                    ) : null}
                  </p>
                  {result.errors.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Errors:</p>
                      <ul className="space-y-1">
                        {result.errors.slice(0, 5).map((error, i) => (
                          <li key={i} className="text-xs text-muted-foreground">
                            • {error}
                          </li>
                        ))}
                        {result.errors.length > 5 && (
                          <li className="text-xs text-muted-foreground">• ... and {result.errors.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card className="dev-card overflow-hidden rounded-[1.5rem] p-0 shadow-none">
            <div className="h-5 w-full bg-[#56c5ea]" />
            <div className="p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Import guide</p>
              <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">JSON Format</p>
                  <p>Array or wrapped payload data with preserved metadata. The review panel validates shape before import.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">CSV Format</p>
                  <p>Spreadsheet data with inferred header mapping, row counts, and required-field checks before submission.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Plain Text</p>
                  <p>One entry per line. The report estimates how many lines are valid and whether duplicates exist inside the batch.</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="dev-card rounded-[1.5rem] p-5 shadow-none">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Features</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Auto-categorization</li>
              <li>✓ Unique ID generation</li>
              <li>✓ Error handling</li>
              <li>✓ Taxonomy overrides</li>
              <li>✓ Duplicate detection</li>
              <li>✓ Batch validation</li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}

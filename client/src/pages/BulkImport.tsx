import { useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, FileJson2, Sparkles, Upload, UploadCloud } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import {
  extractClavisAureaEntries,
  normalizeLexiconImportItem,
  normalizeNotebookImportItem,
  validateClavisAureaPayload,
} from "@shared/pkmFormatting";
import { buildAutofillErrorMessage, buildAutofillLoadState } from "@shared/importAutofill";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

type ImportType = "quotes" | "lexicon";

const importModes = {
  quotes: {
    title: "Commonplace Notebook",
    description: "Import quotations, passages, observations, metadata, and tags into your notebook.",
    accent: "#efb93a",
    pattern: "dev-pattern-waves",
    prompt: "Drop your Quotes JSON file here",
  },
  lexicon: {
    title: "Clavis Aurea",
    description: "Import glossary entries, etymologies, definitions, and concordance notes.",
    accent: "#56c5ea",
    pattern: "dev-pattern-dots",
    prompt: "Drop your Clavis Aurea JSON file here",
  },
} as const;

export default function BulkImport() {
  const [importType, setImportType] = useState<ImportType>("quotes");
  const [jsonInput, setJsonInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const notebookCreateMutation = trpc.notebook.create.useMutation();
  const lexiconCreateMutation = trpc.lexicon.create.useMutation();
  const autofillMutation = trpc.autofill.loadUploadedFile.useMutation();

  const mode = importModes[importType];

  const fileHint = useMemo(() => {
    if (loadedFileName) return `Loaded file: ${loadedFileName}`;
    return importType === "lexicon"
      ? "Recommended: Clavis_Aurea_Complete.json"
      : "Recommended: Quotes-All_with_notes_with_metadata.json";
  }, [importType, loadedFileName]);

  const importParsedData = async (data: unknown) => {
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    if (importType === "quotes") {
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        try {
          const normalized = normalizeNotebookImportItem(item);
          if (!normalized) {
            throw new Error("Missing required quote text");
          }

          await notebookCreateMutation.mutateAsync({
            text: normalized.text,
            author: normalized.author || "",
            work: normalized.work || "",
            sourceType: normalized.sourceType || "quote",
            location: normalized.location || "",
            note: normalized.note || "",
            tags: normalized.tags || "",
            collections: normalized.collections || "",
            favorite: normalized.favorite || false,
            uuid: uuidv4(),
          });
          success++;
        } catch {
          failed++;
          errors.push("Failed to import quote entry from the provided JSON payload.");
        }
      }
    } else {
      const payloadCheck = validateClavisAureaPayload(data);
      if (!payloadCheck.isValid) {
        throw new Error("The dropped or pasted file does not match the Clavis Aurea payload structure.");
      }
      if (payloadCheck.declaredTotal && payloadCheck.declaredTotal !== payloadCheck.totalEntries) {
        errors.push(`Warning: payload declares ${payloadCheck.declaredTotal} entries but contains ${payloadCheck.totalEntries}.`);
      }

      const items = extractClavisAureaEntries(data);
      for (const item of items) {
        try {
          const normalized = normalizeLexiconImportItem(item);
          if (!normalized) {
            throw new Error("Missing required term field");
          }

          await lexiconCreateMutation.mutateAsync({
            term: normalized.term,
            partOfSpeech: normalized.partOfSpeech || "",
            definition: normalized.definition || "",
            etymology: normalized.etymology || "",
            origin: normalized.origin || "",
            sourceType: normalized.sourceType || "",
            imageNum: normalized.imageNum || "",
            notes: normalized.notes || "",
          });
          success++;
        } catch {
          failed++;
          errors.push("Failed to import Clavis Aurea term from the provided JSON payload.");
        }
      }
    }

    setResult({ success, failed, errors: errors.slice(0, 10) });
  };

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      setResult({ success: 0, failed: 1, errors: ["Please paste JSON data or drop a file."] });
      return;
    }

    setIsImporting(true);
    try {
      const data = JSON.parse(jsonInput);
      await importParsedData(data);
    } catch (error) {
      setResult({
        success: 0,
        failed: 1,
        errors: [`Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleLoadedText = (text: string, fileName?: string, preferredSource?: ImportType) => {
    const state = buildAutofillLoadState({
      preferredSource: preferredSource ?? importType,
      text,
      fileName: fileName || loadedFileName || "Imported JSON",
    });

    setJsonInput(state.jsonInput);
    setLoadedFileName(state.loadedFileName);
    setImportType(state.importType);
    setResult(null);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    handleLoadedText(text, file.name, importType);
  };

  const handleAutofill = async (source: ImportType) => {
    try {
      const payload = await autofillMutation.mutateAsync({ source });
      handleLoadedText(payload.text, payload.fileName, source);
    } catch {
      setResult({
        success: 0,
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
          Paste structured JSON or drag a source file directly into the workspace to ingest quotations or Clavis Aurea entries in a single pass.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <Card className="dev-card rounded-[1.5rem] p-6 shadow-none">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[2rem] leading-none">Select import mode</h2>
              <span className="rounded-full border border-black/15 bg-[#f6f3ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                One-click autofill ready
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {(Object.keys(importModes) as Array<keyof typeof importModes>).map((key) => {
                const item = importModes[key];
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
            <div className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] xl:items-start">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-[2rem] leading-none">Drag-and-drop import</h2>
                  <span className="rounded-full border border-black/15 bg-[#f6f3ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    JSON files
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
                  These buttons load the previously uploaded source files directly into the import workspace without requiring a new file drop.
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
                  Drop a JSON file to auto-load it into the editor below. If the file structure is recognized, the workspace will automatically switch to the correct import mode.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {autofillMutation.isPending ? "Loading uploaded file..." : fileHint}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.txt,application/json,text/plain"
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
            <h2 className="mb-4 text-[2rem] leading-none">Paste or review JSON</h2>
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste your JSON array or dropped file content here..."
              rows={14}
              className="rounded-[1.3rem] border-2 border-black/85 bg-white font-mono text-sm shadow-none"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={handleImport}
                disabled={isImporting || !jsonInput.trim()}
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
                    <strong className="text-foreground">{result.success} successful</strong>
                    {result.failed > 0 ? (
                      <>
                        {" "}· <strong className="text-[#e25b33]">{result.failed} failed</strong>
                      </>
                    ) : null}
                  </p>
                  {result.errors.length > 0 && (
                    <div className="mt-4 rounded-[1.2rem] border border-black/10 bg-[#f6f3ec] p-4 text-sm leading-6 text-muted-foreground">
                      {result.errors.map((error, index) => (
                        <p key={index}>{error}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card className="dev-card overflow-hidden rounded-[1.5rem] p-0 shadow-none">
            <div className={`${mode.pattern} h-5 w-full`} style={{ backgroundColor: mode.accent }} />
            <div className="p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Expected format</p>
              <div className="rounded-[1.2rem] border border-black/10 bg-[#f6f3ec] p-4 font-mono text-xs leading-6 text-muted-foreground">
                <pre className="overflow-x-auto whitespace-pre-wrap">{importType === "quotes" ? `[
  {
    "text": "Quote or passage text",
    "author": "Author name",
    "work": "Book or source title",
    "sourceType": "Book",
    "location": "Page number or timestamp",
    "note": "Personal note",
    "tags": "comma,separated,tags"
  }
]` : `{
  "meta": {
    "name": "Clavis Aurea",
    "total_entries": 354
  },
  "entries": [
    {
      "term": "Word or phrase",
      "pos": "noun",
      "definition": "Definition text",
      "origin": "Language or origin note",
      "source_type": "Book or app",
      "image_num": "114",
      "notes": "Additional notes"
    }
  ]
}`}</pre>
              </div>
            </div>
          </Card>

          <Card className="dev-card rounded-[1.5rem] p-5 shadow-none">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Import notes</p>
            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Drag-and-drop and manual file selection both load the file into the editor so you can inspect it before import.</p>
              <p>Unknown fields are ignored, while failed rows do not interrupt the rest of the import job.</p>
              <p>Clavis Aurea explicitly supports the provided payload structure with meta and entries, including the 354-entry glossary dataset.</p>
            </div>
          </Card>
        </aside>
      </section>
    </div>
  );
}

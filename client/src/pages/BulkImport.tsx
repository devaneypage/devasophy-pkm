import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Upload } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import {
  extractClavisAureaEntries,
  normalizeLexiconImportItem,
  normalizeNotebookImportItem,
  validateClavisAureaPayload,
} from "@shared/pkmFormatting";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const importModes = {
  quotes: {
    title: "Commonplace Notebook",
    description: "Import quotations, passages, observations, metadata, and tags into your notebook.",
    accent: "#efb93a",
    pattern: "dev-pattern-waves",
  },
  lexicon: {
    title: "Clavis Aurea",
    description: "Import glossary entries, etymologies, definitions, and concordance notes.",
    accent: "#56c5ea",
    pattern: "dev-pattern-dots",
  },
} as const;

export default function BulkImport() {
  const [importType, setImportType] = useState<"quotes" | "lexicon">("quotes");
  const [jsonInput, setJsonInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const notebookCreateMutation = trpc.notebook.create.useMutation();
  const lexiconCreateMutation = trpc.lexicon.create.useMutation();

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      setResult({ success: 0, failed: 1, errors: ["Please paste JSON data"] });
      return;
    }

    setIsImporting(true);
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    try {
      const data = JSON.parse(jsonInput);
      const items = importType === "lexicon" ? extractClavisAureaEntries(data) : Array.isArray(data) ? data : [data];

      if (importType === "quotes") {
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
        if (payloadCheck.declaredTotal && payloadCheck.declaredTotal !== payloadCheck.totalEntries) {
          errors.push(`Warning: payload declares ${payloadCheck.declaredTotal} entries but contains ${payloadCheck.totalEntries}.`);
        }

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

  const mode = importModes[importType];

  return (
    <div className="space-y-6">
      <section className="dev-soft-card p-6 sm:p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Ingestion and archive tools</p>
        <h1 className="mb-4">Bulk Import</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Paste structured JSON to ingest your quotations or Clavis Aurea entries into the Devanomy workspace in a single pass.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <Card className="dev-card rounded-[1.5rem] p-6 shadow-none">
            <h2 className="mb-4 text-[2rem] leading-none">Select import mode</h2>
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
            <h2 className="mb-4 text-[2rem] leading-none">Paste JSON data</h2>
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste your JSON array here..."
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
                    {result.failed > 0 ? <> · <strong className="text-[#e25b33]">{result.failed} failed</strong></> : null}
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
]` : `[
  {
    "term": "Word or phrase",
    "partOfSpeech": "noun",
    "definition": "Definition text",
    "etymology": "Word origin",
    "origin": "Language",
    "sourceType": "Book",
    "notes": "Additional notes"
  }
]`}</pre>
              </div>
            </div>
          </Card>

          <Card className="dev-card rounded-[1.5rem] p-5 shadow-none">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Import notes</p>
            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Use an array of objects, even if you are importing a single record.</p>
              <p>Unknown fields are ignored, while failed rows do not interrupt the rest of the import job.</p>
              <p>For Clavis Aurea, the importer explicitly supports the provided payload structure with meta and entries, including the 354-entry glossary dataset.</p>
            </div>
          </Card>
        </aside>
      </section>
    </div>
  );
}

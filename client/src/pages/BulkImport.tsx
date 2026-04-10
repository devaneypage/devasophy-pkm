import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function BulkImport() {
  const [importType, setImportType] = useState<"quotes" | "lexicon">("quotes");
  const [jsonInput, setJsonInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const notebookCreateMutation = trpc.notebook.create.useMutation();
  const lexiconCreateMutation = trpc.lexicon.create.useMutation();

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      setResult({
        success: 0,
        failed: 1,
        errors: ["Please paste JSON data"],
      });
      return;
    }

    setIsImporting(true);
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    try {
      const data = JSON.parse(jsonInput);
      const items = Array.isArray(data) ? data : [data];

      if (importType === "quotes") {
        for (const item of items) {
          try {
            await notebookCreateMutation.mutateAsync({
              text: item.text || item.quote || "",
              author: item.author || item.by || "",
              work: item.work || item.source || "",
              sourceType: item.sourceType || "quote",
              location: item.location || item.page || "",
              note: item.note || item.notes || "",
              tags: Array.isArray(item.tags) ? item.tags.join(",") : item.tags || "",
              collections: item.collection || item.collections || "",
              favorite: item.favorite || false,
              uuid: uuidv4(),
            });
            success++;
          } catch (error) {
            failed++;
            errors.push(
              `Failed to import quote: "${(item.text || item.quote || "").substring(0, 50)}..."`
            );
          }
        }
      } else if (importType === "lexicon") {
        for (const item of items) {
          try {
            await lexiconCreateMutation.mutateAsync({
              term: item.term || item.word || "",
              partOfSpeech: item.partOfSpeech || item.part_of_speech || "",
              definition: item.definition || item.meaning || "",
              etymology: item.etymology || "",
              origin: item.origin || "",
              sourceType: item.sourceType || item.source_type || "",
              imageNum: item.imageNum || item.image_num || "",
              notes: item.notes || "",
            });
            success++;
          } catch (error) {
            failed++;
            errors.push(`Failed to import term: "${item.term || item.word || ""}"`);
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Bulk Import Tool</h1>
          <p className="text-muted-foreground">
            Import quotes, vocabulary terms, and other data in bulk from JSON files
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Import Type Selection */}
        <Card className="bg-card border-border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Step 1: Select Import Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setImportType("quotes");
                setResult(null);
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                importType === "quotes"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-lg font-bold mb-2">Commonplace Notebook</div>
              <div className="text-sm text-muted-foreground">
                Import quotes, passages, and observations with source metadata
              </div>
            </button>
            <button
              onClick={() => {
                setImportType("lexicon");
                setResult(null);
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                importType === "lexicon"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-lg font-bold mb-2">Clavis Aurea</div>
              <div className="text-sm text-muted-foreground">
                Import vocabulary terms with definitions and etymologies
              </div>
            </button>
          </div>
        </Card>

        {/* Expected Format */}
        <Card className="bg-card/50 border-border p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Expected JSON Format</h2>
          {importType === "quotes" ? (
            <div className="bg-background p-4 rounded-lg font-mono text-sm text-muted-foreground overflow-x-auto">
              <pre>{`[
  {
    "text": "Quote or passage text",
    "author": "Author name",
    "work": "Book or source title",
    "sourceType": "Book",
    "location": "Page number or timestamp",
    "note": "Your personal notes",
    "tags": "comma,separated,tags",
    "favorite": false
  }
]`}</pre>
            </div>
          ) : (
            <div className="bg-background p-4 rounded-lg font-mono text-sm text-muted-foreground overflow-x-auto">
              <pre>{`[
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
          )}
        </Card>

        {/* JSON Input */}
        <Card className="bg-card border-border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Step 2: Paste JSON Data</h2>
          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your JSON array here..."
            rows={12}
            className="font-mono text-sm"
          />
        </Card>

        {/* Import Button */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={handleImport}
            disabled={isImporting || !jsonInput.trim()}
            className="flex items-center gap-2"
          >
            <Upload size={20} />
            {isImporting ? "Importing..." : "Import Data"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setJsonInput("");
              setResult(null);
            }}
          >
            Clear
          </Button>
        </div>

        {/* Results */}
        {result && (
          <Card
            className={`border-2 p-6 ${
              result.failed === 0
                ? "bg-green-900/20 border-green-700"
                : "bg-amber-900/20 border-amber-700"
            }`}
          >
            <div className="flex items-start gap-4">
              {result.failed === 0 ? (
                <CheckCircle size={24} className="text-green-500 flex-shrink-0 mt-1" />
              ) : (
                <AlertCircle size={24} className="text-amber-500 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">Import Complete</h3>
                <div className="space-y-1 text-sm mb-4">
                  <p>
                    <strong className="text-green-400">{result.success} successful</strong>
                    {result.failed > 0 && (
                      <>
                        {" "}
                        •{" "}
                        <strong className="text-amber-400">{result.failed} failed</strong>
                      </>
                    )}
                  </p>
                </div>
                {result.errors.length > 0 && (
                  <div className="bg-background/50 p-3 rounded text-sm">
                    <p className="font-semibold mb-2">Errors:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      {result.errors.map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Sample Data Info */}
        <Card className="bg-card/50 border-border p-6 mt-6">
          <h3 className="font-bold mb-2">Tips for Successful Import</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Ensure your JSON is valid and properly formatted</li>
            <li>• Use an array of objects, even if importing a single item</li>
            <li>• Field names should match the expected format exactly</li>
            <li>• Extra fields will be ignored</li>
            <li>• Failed imports won't stop the entire process</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

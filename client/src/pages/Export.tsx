import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileJson, FileText } from "lucide-react";

export default function Export() {
  const [exportType, setExportType] = useState<"notebook" | "lexicon" | "documents">("notebook");
  const [format, setFormat] = useState<"json" | "markdown" | "text">("json");
  const [isExporting, setIsExporting] = useState(false);

  const { data: notebookEntries } = trpc.notebook.list.useQuery({});
  const { data: lexiconTerms } = trpc.lexicon.list.useQuery({});
  const { data: documents } = trpc.documents.list.useQuery({});

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let content = "";
      let filename = "";
      let mimeType = "text/plain";

      if (exportType === "notebook" && notebookEntries) {
        if (format === "json") {
          content = JSON.stringify(notebookEntries, null, 2);
          filename = `notebook-export-${new Date().toISOString().split("T")[0]}.json`;
          mimeType = "application/json";
        } else if (format === "markdown") {
          content = notebookEntries
            .map(
              (entry) =>
                `# "${entry.text}"\n\n**Author:** ${entry.author || "Unknown"}\n**Work:** ${entry.work || "Unknown"}\n**Source Type:** ${entry.sourceType || "Unknown"}\n**Location:** ${entry.location || "N/A"}\n\n${entry.note ? `**Notes:** ${entry.note}\n\n` : ""}---\n\n`
            )
            .join("");
          filename = `notebook-export-${new Date().toISOString().split("T")[0]}.md`;
          mimeType = "text/markdown";
        } else {
          content = notebookEntries
            .map(
              (entry) =>
                `"${entry.text}"\n— ${entry.author || "Unknown"}, ${entry.work || "Unknown"}\n\n`
            )
            .join("");
          filename = `notebook-export-${new Date().toISOString().split("T")[0]}.txt`;
        }
      } else if (exportType === "lexicon" && lexiconTerms) {
        if (format === "json") {
          content = JSON.stringify(lexiconTerms, null, 2);
          filename = `lexicon-export-${new Date().toISOString().split("T")[0]}.json`;
          mimeType = "application/json";
        } else if (format === "markdown") {
          content = lexiconTerms
            .map(
              (term) =>
                `## ${term.term}\n\n**Part of Speech:** ${term.partOfSpeech || "N/A"}\n\n**Definition:** ${term.definition || "N/A"}\n\n**Etymology:** ${term.etymology || "N/A"}\n\n**Origin:** ${term.origin || "N/A"}\n\n${term.notes ? `**Notes:** ${term.notes}\n\n` : ""}---\n\n`
            )
            .join("");
          filename = `lexicon-export-${new Date().toISOString().split("T")[0]}.md`;
          mimeType = "text/markdown";
        } else {
          content = lexiconTerms
            .map((term) => `${term.term} (${term.partOfSpeech || "N/A"})\n${term.definition || "No definition"}\n\n`)
            .join("");
          filename = `lexicon-export-${new Date().toISOString().split("T")[0]}.txt`;
        }
      } else if (exportType === "documents" && documents) {
        if (format === "json") {
          content = JSON.stringify(documents, null, 2);
          filename = `documents-export-${new Date().toISOString().split("T")[0]}.json`;
          mimeType = "application/json";
        } else if (format === "markdown") {
          content = documents
            .map(
              (doc) =>
                `# ${doc.title}\n\n**Project:** ${doc.project || "N/A"}\n**Status:** ${doc.status}\n\n${doc.content || "No content"}\n\n---\n\n`
            )
            .join("");
          filename = `documents-export-${new Date().toISOString().split("T")[0]}.md`;
          mimeType = "text/markdown";
        } else {
          content = documents
            .map((doc) => `${doc.title}\n${doc.content || "No content"}\n\n---\n\n`)
            .join("");
          filename = `documents-export-${new Date().toISOString().split("T")[0]}.txt`;
        }
      }

      if (content) {
        downloadFile(content, filename, mimeType);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Export Data</h1>
          <p className="text-muted-foreground">
            Export your knowledge base entries in various formats
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Export Type Selection */}
        <Card className="bg-card border-border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Step 1: Select What to Export</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["notebook", "lexicon", "documents"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setExportType(type)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  exportType === type
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-lg font-bold mb-2">
                  {type === "notebook"
                    ? "Commonplace Notebook"
                    : type === "lexicon"
                      ? "Clavis Aurea"
                      : "Documents"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {type === "notebook"
                    ? "All quotes and passages"
                    : type === "lexicon"
                      ? "All vocabulary terms"
                      : "All documents"}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Format Selection */}
        <Card className="bg-card border-border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Step 2: Choose Export Format</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["json", "markdown", "text"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  format === fmt
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {fmt === "json" && <FileJson size={24} className="text-primary" />}
                {fmt === "markdown" && <FileText size={24} className="text-primary" />}
                {fmt === "text" && <FileText size={24} className="text-primary" />}
                <div className="text-left">
                  <div className="font-bold capitalize">{fmt}</div>
                  <div className="text-xs text-muted-foreground">
                    {fmt === "json"
                      ? "Structured data"
                      : fmt === "markdown"
                        ? "Formatted text"
                        : "Plain text"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Format Info */}
        <Card className="bg-card/50 border-border p-6 mb-6">
          <h3 className="font-bold mb-2">Format Details</h3>
          {format === "json" && (
            <p className="text-sm text-muted-foreground">
              JSON format preserves all metadata and structure. Best for re-importing or processing with tools.
            </p>
          )}
          {format === "markdown" && (
            <p className="text-sm text-muted-foreground">
              Markdown format is human-readable and great for sharing or publishing. Includes formatted text and metadata.
            </p>
          )}
          {format === "text" && (
            <p className="text-sm text-muted-foreground">
              Plain text format is simple and universal. Best for reading or basic sharing.
            </p>
          )}
        </Card>

        {/* Export Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2"
            size="lg"
          >
            <Download size={20} />
            {isExporting ? "Exporting..." : "Export Now"}
          </Button>
        </div>

        {/* Info */}
        <Card className="bg-card/50 border-border p-6 mt-6">
          <h3 className="font-bold mb-2">Export Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• All entries and their metadata will be included in the export</li>
            <li>• Exported files are timestamped for easy organization</li>
            <li>• JSON format can be re-imported using the Bulk Import tool</li>
            <li>• Markdown files can be opened in any text editor or Markdown viewer</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

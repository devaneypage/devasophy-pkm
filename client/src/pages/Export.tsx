import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileJson, FileText, Library, NotebookTabs, PenSquare } from "lucide-react";

const exportTypes = {
  notebook: {
    title: "Commonplace Workspace",
    description: "Research notes, quotations, books, lists, bookmarks, and metadata from the active drafting wall.",
    accent: "#e04f2f",
    pattern: "dev-pattern-waves",
    icon: NotebookTabs,
  },
  lexicon: {
    title: "Clavis Aurea",
    description: "All glossary terms, definitions, origins, and notes.",
    accent: "#56c5ea",
    pattern: "dev-pattern-dots",
    icon: Library,
  },
  documents: {
    title: "Research Studio",
    description: "All projects, folders, documents, and writing content.",
    accent: "#e25b33",
    pattern: "dev-pattern-diamonds",
    icon: PenSquare,
  },
} as const;

const formatMeta = {
  json: {
    title: "JSON",
    subtitle: "Structured data",
    description: "Best for re-importing, analysis, and preserving complete metadata.",
    icon: FileJson,
    accent: "#56c5ea",
  },
  markdown: {
    title: "Markdown",
    subtitle: "Formatted text",
    description: "Readable and publication-friendly with headings and preserved structure.",
    icon: FileText,
    accent: "#efb93a",
  },
  text: {
    title: "Plain Text",
    subtitle: "Universal format",
    description: "Simple export for raw reading, sharing, or external processing.",
    icon: FileText,
    accent: "#bfd73d",
  },
} as const;

export default function Export() {
  const [exportType, setExportType] = useState<"notebook" | "lexicon" | "documents">("notebook");
  const [format, setFormat] = useState<"json" | "markdown" | "text">("json");
  const [isExporting, setIsExporting] = useState(false);

  const notebookExportQuery = trpc.notebook.exportAll.useQuery(undefined, { enabled: false });
  const { data: lexiconTerms, isLoading: lexiconLoading, error: lexiconError } = trpc.lexicon.list.useQuery({});
  const { data: documents, isLoading: docsLoading, error: docsError } = trpc.documents.list.useQuery({});

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
      const notebookEntries = exportType === "notebook"
        ? (await notebookExportQuery.refetch()).data ?? []
        : [];
      let content = "";
      let filename = "";
      let mimeType = "text/plain";
      const dateStamp = new Date().toISOString().split("T")[0];

      if (exportType === "notebook") {
        if (format === "json") {
          content = JSON.stringify(notebookEntries, null, 2);
          filename = `notebook-export-${dateStamp}.json`;
          mimeType = "application/json";
        } else if (format === "markdown") {
          content = notebookEntries
            .map(
              (entry) =>
                `# "${entry.text}"\n\n**ID:** ${entry.zettelkastenId || "N/A"}\n**Author:** ${entry.author || "Unknown"}\n**Work:** ${entry.work || "Unknown"}\n**Source Type:** ${entry.sourceType || "Unknown"}\n**Location:** ${entry.location || "N/A"}\n\n${entry.note ? `**Notes:** ${entry.note}\n\n` : ""}---\n\n`
            )
            .join("");
          filename = `notebook-export-${dateStamp}.md`;
          mimeType = "text/markdown";
        } else {
          content = notebookEntries
            .map((entry) => `[${entry.zettelkastenId || "N/A"}] "${entry.text}"\n— ${entry.author || "Unknown"}, ${entry.work || "Unknown"}\n\n`)
            .join("");
          filename = `notebook-export-${dateStamp}.txt`;
        }
      } else if (exportType === "lexicon" && lexiconTerms) {
        if (format === "json") {
          content = JSON.stringify(lexiconTerms, null, 2);
          filename = `lexicon-export-${dateStamp}.json`;
          mimeType = "application/json";
        } else if (format === "markdown") {
          content = lexiconTerms
            .map(
              (term) =>
                `## ${term.term}\n\n**ID:** ${term.zettelkastenId || "N/A"}\n**Part of Speech:** ${term.partOfSpeech || "N/A"}\n\n**Definition:** ${term.definition || "N/A"}\n\n**Etymology:** ${term.etymology || "N/A"}\n\n**Origin:** ${term.origin || "N/A"}\n\n${term.notes ? `**Notes:** ${term.notes}\n\n` : ""}---\n\n`
            )
            .join("");
          filename = `lexicon-export-${dateStamp}.md`;
          mimeType = "text/markdown";
        } else {
          content = lexiconTerms
            .map((term) => `[${term.zettelkastenId || "N/A"}] ${term.term} (${term.partOfSpeech || "N/A"})\n${term.definition || "No definition"}\n\n`)
            .join("");
          filename = `lexicon-export-${dateStamp}.txt`;
        }
      } else if (exportType === "documents" && documents) {
        if (format === "json") {
          content = JSON.stringify(documents, null, 2);
          filename = `documents-export-${dateStamp}.json`;
          mimeType = "application/json";
        } else if (format === "markdown") {
          content = documents
            .map(
              (doc) =>
                `# ${doc.title}\n\n**Project:** ${doc.project || "N/A"}\n**Status:** ${doc.status}\n\n${doc.content || "No content"}\n\n---\n\n`
            )
            .join("");
          filename = `documents-export-${dateStamp}.md`;
          mimeType = "text/markdown";
        } else {
          content = documents.map((doc) => `${doc.title}\n${doc.content || "No content"}\n\n---\n\n`).join("");
          filename = `documents-export-${dateStamp}.txt`;
        }
      }

      if (content) {
        downloadFile(content, filename, mimeType);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const selectedExportMeta = exportTypes[exportType];
  const selectedFormatMeta = formatMeta[format];
  
  const isLoading = lexiconLoading || docsLoading;
  const hasError = !!notebookExportQuery.error || !!lexiconError || !!docsError;
  const errorMessage = notebookExportQuery.error?.message || lexiconError?.message || docsError?.message;

  return (
    <div className="space-y-6">
      <section className="dev-soft-card p-6 sm:p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Archive and portability</p>
        <h1 className="mb-4">Export Data</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Export any major Devanomy collection as structured JSON, editorial Markdown, or universal plain text.
        </p>
      </section>

      {hasError && (
        <section className="dev-soft-card border-l-4 border-red-500 bg-red-50 p-6 sm:p-8">
          <p className="text-sm font-semibold text-red-700">Database Connection Error</p>
          <p className="mt-2 text-sm text-red-600">{errorMessage || "Unable to load entries from database. Please try again later."}</p>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Card className="dev-card rounded-[1.5rem] p-6 shadow-none">
            <h2 className="mb-4 text-[2rem] leading-none">Select collection</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {(Object.keys(exportTypes) as Array<keyof typeof exportTypes>).map((type) => {
                const item = exportTypes[type];
                const Icon = item.icon;
                return (
                  <button
                    key={type}
                    onClick={() => setExportType(type)}
                    className={`overflow-hidden rounded-[1.3rem] border-2 border-black bg-white text-left transition ${exportType === type ? "-translate-y-1" : "hover:-translate-y-1"}`}
                  >
                    <div className={`${item.pattern} flex h-16 items-center justify-between px-4`} style={{ backgroundColor: item.accent }}>
                      <Icon className="h-5 w-5 text-black" />
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-black">{type}</span>
                    </div>
                    <div className="space-y-2 p-4">
                      <p className="text-lg font-bold text-foreground">{item.title}</p>
                      <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="dev-card rounded-[1.5rem] p-6 shadow-none">
            <h2 className="mb-4 text-[2rem] leading-none">Choose format</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {(Object.keys(formatMeta) as Array<keyof typeof formatMeta>).map((fmt) => {
                const item = formatMeta[fmt];
                const Icon = item.icon;
                return (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`rounded-[1.3rem] border-2 border-black bg-white p-4 text-left transition ${format === fmt ? "-translate-y-1" : "hover:-translate-y-1"}`}
                  >
                    <div
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-black"
                      style={{ backgroundColor: item.accent }}
                    >
                      <Icon className="h-5 w-5 text-black" />
                    </div>
                    <p className="text-lg font-bold text-foreground">{item.title}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{item.subtitle}</p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleExport}
              disabled={isExporting || isLoading || hasError}
              className="h-11 rounded-full border-2 border-black bg-[#116d6d] px-5 text-white shadow-none hover:bg-[#0f5959] disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Exporting..." : isLoading ? "Loading..." : "Export now"}
            </Button>
          </div>
        </div>

        <aside className="space-y-6">
          <Card className="dev-card overflow-hidden rounded-[1.5rem] p-0 shadow-none">
            <div className={`${selectedExportMeta.pattern} h-5 w-full`} style={{ backgroundColor: selectedExportMeta.accent }} />
            <div className="p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Current export</p>
              <h3 className="text-[1.8rem] leading-none">{selectedExportMeta.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{selectedExportMeta.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="dev-chip">{selectedFormatMeta.title}</span>
                <span className="dev-chip">Timestamped filename</span>
              </div>
            </div>
          </Card>

          <Card className="dev-card rounded-[1.5rem] p-5 shadow-none">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Export notes</p>
            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Every export includes the currently stored entries and metadata for the chosen module.</p>
              <p>JSON can be re-imported later through the bulk import workflow, while Markdown is ideal for editorial review.</p>
              <p>Plain text keeps the archive lightweight for universal sharing and long-term preservation.</p>
            </div>
          </Card>
        </aside>
      </section>
    </div>
  );
}

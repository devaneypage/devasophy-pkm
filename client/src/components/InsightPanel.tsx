import React, { useEffect, useState } from "react";
import {
  BrainCircuit,
  CircleHelp,
  Layers3,
  Lightbulb,
  Network,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { InsightExtractionResponse, InsightModule } from "@shared/insights";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type InsightPanelProps = {
  module: InsightModule;
  recordId: number;
  sourceTitle: string;
  className?: string;
  compact?: boolean;
};

const moduleLabels: Record<InsightModule, string> = {
  document: "research document",
  commonplace: "commonplace card",
  idea: "idea",
};

function InsightList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm leading-6 text-muted-foreground">No items surfaced in this pass.</p>;
  }

  return (
    <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className="flex gap-2">
          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-55" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function InsightPanel({ module, recordId, sourceTitle, className, compact = false }: InsightPanelProps) {
  const [result, setResult] = useState<InsightExtractionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const extractMutation = trpc.insights.extract.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(error.message || "The insight pass could not be completed.");
    },
  });

  useEffect(() => {
    setResult(null);
    setErrorMessage(null);
  }, [module, recordId]);

  const extract = () => {
    setErrorMessage(null);
    extractMutation.mutate({ module, recordId });
  };

  return (
    <Card
      data-testid="insight-panel"
      className={cn(
        "insight-panel overflow-hidden rounded-[1.5rem] border-2 border-black bg-white p-0 shadow-none",
        className
      )}
    >
      <div className="dev-pattern-diamonds h-3 w-full bg-[#b55af3]" />
      <div className={cn("space-y-5", compact ? "p-4" : "p-5")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="insight-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-black bg-[#f4e7ff] text-[#6c26b0]">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">AI insight lens</p>
              <h3 className="truncate text-xl font-semibold text-foreground">Key insights</h3>
            </div>
          </div>
          <Button
            type="button"
            onClick={extract}
            disabled={extractMutation.isPending}
            aria-label={`${result ? "Refresh" : "Extract"} insights for ${sourceTitle}`}
            className="insight-action h-10 rounded-full border-2 border-black bg-[#b55af3] px-4 text-white shadow-none hover:bg-[#9f42e3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {extractMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
                Analyzing…
              </>
            ) : result ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Extract insights
              </>
            )}
          </Button>
        </div>

        {!result && !extractMutation.isPending && !errorMessage ? (
          <div className="insight-state rounded-[1.1rem] border border-black/10 bg-[#faf6fd] p-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Analyze this {moduleLabels[module]} on demand. Devanomy will identify its thesis, central insights, themes, open questions, possible connections, and current DIKW level.
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Results remain in this session and are not written back to the record.
            </p>
          </div>
        ) : null}

        {extractMutation.isPending ? (
          <div role="status" aria-live="polite" className="insight-state rounded-[1.1rem] border border-black/10 bg-[#faf6fd] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-[#6c26b0]" />
              Reading for structure and significance
            </div>
            <div className="space-y-2" aria-hidden="true">
              <div className="h-2 w-full animate-pulse rounded-full bg-[#e8dcf3] motion-reduce:animate-none" />
              <div className="h-2 w-4/5 animate-pulse rounded-full bg-[#e8dcf3] motion-reduce:animate-none" />
              <div className="h-2 w-3/5 animate-pulse rounded-full bg-[#e8dcf3] motion-reduce:animate-none" />
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div role="alert" className="insight-state rounded-[1.1rem] border-2 border-[#e25b33] bg-[#fff0ea] p-4 text-sm leading-6 text-[#8c2c0d]">
            <p className="font-semibold">Insight extraction needs attention</p>
            <p className="mt-1">{errorMessage}</p>
            <Button
              type="button"
              variant="outline"
              onClick={extract}
              className="mt-3 h-9 rounded-full border-2 border-[#8c2c0d] bg-white px-4 text-[#8c2c0d] shadow-none hover:bg-[#fff7f2]"
            >
              Try again
            </Button>
          </div>
        ) : null}

        {result ? (
          <div className="insight-results space-y-4" aria-live="polite">
            <div className="insight-result-card rounded-[1.15rem] border border-black/10 bg-[#f6f3ec] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Lightbulb className="h-4 w-4 text-[#b46d00]" />
                Core thesis
              </div>
              <p className="text-sm font-semibold leading-6 text-foreground">{result.insights.thesis}</p>
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              <div className="insight-result-card rounded-[1.15rem] border border-black/10 bg-white p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Key insights</p>
                <InsightList items={result.insights.keyInsights} />
              </div>
              <div className="insight-result-card rounded-[1.15rem] border border-black/10 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Network className="h-4 w-4 text-[#116d6d]" />
                  Suggested connections
                </div>
                <InsightList items={result.insights.suggestedConnections} />
              </div>
              <div className="insight-result-card rounded-[1.15rem] border border-black/10 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <CircleHelp className="h-4 w-4 text-[#e25b33]" />
                  Open questions
                </div>
                <InsightList items={result.insights.openQuestions} />
              </div>
              <div className="insight-result-card rounded-[1.15rem] border border-black/10 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Layers3 className="h-4 w-4 text-[#6c26b0]" />
                  DIKW assessment
                </div>
                <span className="inline-flex rounded-full border border-black/15 bg-[#f4e7ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6c26b0]">
                  {result.insights.dikwAssessment.tier}
                </span>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{result.insights.dikwAssessment.rationale}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {result.insights.themes.map((theme) => (
                <span key={theme} className="dev-chip">{theme}</span>
              ))}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">{result.insights.confidenceNote}</p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

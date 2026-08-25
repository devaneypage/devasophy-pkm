import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Layers3, RefreshCw, Sparkles, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MIN_SYNTHESIS_RECORDS, MAX_SYNTHESIS_RECORDS, useSynthesisTray } from "@/contexts/SynthesisContext";
import type { MultiRecordSynthesisResponse, SynthesisFinding } from "@shared/insights";

type FindingListProps = {
  title: string;
  findings: SynthesisFinding[];
  sourceNames: Map<string, string>;
  tone?: "teal" | "orange" | "violet" | "gold" | "blue";
};

const toneClasses = {
  teal: "bg-[#d9f3ef] text-[#0b5c59]",
  orange: "bg-[#fff0df] text-[#a34410]",
  violet: "bg-[#f4e7ff] text-[#6c26b0]",
  gold: "bg-[#fff8d7] text-[#826c07]",
  blue: "bg-[#e1f4ff] text-[#13719e]",
};

function FindingList({ title, findings, sourceNames, tone = "teal" }: FindingListProps) {
  if (!findings.length) return null;

  return (
    <section className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</h4>
      <div className="space-y-2">
        {findings.map((finding, index) => (
          <div key={`${title}-${index}`} className="synthesis-finding rounded-[1rem] border border-black/10 bg-white/80 p-3">
            <p className="text-sm leading-6 text-foreground">{finding.text}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {finding.sourceMarkers.map((marker) => (
                <span key={marker} className={`rounded-full px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] ${toneClasses[tone]}`}>
                  {marker} · {sourceNames.get(marker) ?? "Selected source"}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SynthesisTray() {
  const { selections, removeSelection, clearSelections } = useSynthesisTray();
  const [expanded, setExpanded] = useState(false);
  const [result, setResult] = useState<MultiRecordSynthesisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const selectionSignature = selections.map((selection) => `${selection.module}:${selection.recordId}`).join("|");

  const analyzeMutation = trpc.synthesis.analyze.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setErrorMessage(null);
      setExpanded(true);
    },
    onError: (error) => setErrorMessage(error.message || "The selected records could not be synthesized."),
  });

  useEffect(() => {
    setResult(null);
    setErrorMessage(null);
  }, [selectionSignature]);

  const sourceNames = useMemo(
    () => new Map(result?.sources.map((source) => [source.marker, source.title]) ?? []),
    [result]
  );
  const ready = selections.length >= MIN_SYNTHESIS_RECORDS;

  if (!selections.length) return null;

  const analyze = () => analyzeMutation.mutate({ sources: selections.map(({ module, recordId }) => ({ module, recordId })) });

  return (
    <aside className="synthesis-tray fixed bottom-4 right-4 z-50 w-[min(30rem,calc(100vw-2rem))]" aria-label="Multi-record synthesis tray">
      <Card className="synthesis-panel overflow-hidden rounded-[1.4rem] border-2 border-black bg-[#fffdf8] shadow-[0_16px_40px_rgba(19,36,63,0.18)]">
        <div className="flex items-center justify-between gap-3 border-b border-black/10 bg-[#0f766e] px-4 py-3 text-white">
          <button type="button" onClick={() => setExpanded((current) => !current)} className="flex min-w-0 items-center gap-3 text-left" aria-expanded={expanded}>
            <span className="synthesis-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15"><Layers3 className="h-4 w-4" /></span>
            <span className="min-w-0">
              <span className="block text-xs font-bold uppercase tracking-[0.18em]">Synthesis tray</span>
              <span className="block truncate text-sm text-white/85">{selections.length} of {MAX_SYNTHESIS_RECORDS} records selected</span>
            </span>
          </button>
          <Button type="button" variant="ghost" onClick={() => clearSelections()} className="h-9 rounded-full px-3 text-xs font-semibold text-white hover:bg-white/15 hover:text-white">Clear</Button>
        </div>

        {expanded ? (
          <div className="synthesis-reveal max-h-[70vh] space-y-4 overflow-y-auto p-4">
            <div className="space-y-2" aria-live="polite">
              {selections.map((selection) => (
                <div key={`${selection.module}:${selection.recordId}`} className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2">
                  <span className="rounded-full bg-[#e1f4ff] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#13719e]">{selection.module}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{selection.title}</span>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${selection.title} from synthesis`} onClick={() => removeSelection(selection)} className="h-7 w-7 rounded-full hover:bg-[#f6f3ec]"><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>

            {!ready ? (
              <div className="synthesis-state rounded-xl border border-dashed border-black/20 bg-[#f6f3ec] p-3 text-sm leading-6 text-muted-foreground">Add {MIN_SYNTHESIS_RECORDS - selections.length} more record{MIN_SYNTHESIS_RECORDS - selections.length === 1 ? "" : "s"} to compare relationships across sources.</div>
            ) : null}

            <Button type="button" onClick={analyze} disabled={!ready || analyzeMutation.isPending} className="synthesis-action w-full rounded-full border-2 border-black bg-[#f26a3d] text-white shadow-none hover:bg-[#db5730]">
              {analyzeMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {result ? "Refresh synthesis" : "Synthesize selected records"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            {errorMessage ? <div role="alert" className="synthesis-state rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">{errorMessage}</div> : null}

            {result ? (
              <div className="synthesis-results space-y-5 rounded-[1.2rem] border border-black/10 bg-[#f7fbfa] p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f766e]">Synthesis thesis</p>
                  <p className="mt-2 font-serif text-xl leading-7 text-foreground">{result.synthesis.thesis}</p>
                </div>
                <FindingList title="Shared themes" findings={result.synthesis.sharedThemes} sourceNames={sourceNames} tone="teal" />
                <FindingList title="Tensions" findings={result.synthesis.tensions} sourceNames={sourceNames} tone="orange" />
                <FindingList title="Emergent connections" findings={result.synthesis.emergentConnections} sourceNames={sourceNames} tone="violet" />
                <FindingList title="Open questions" findings={result.synthesis.openQuestions} sourceNames={sourceNames} tone="gold" />
                <FindingList title="Next synthesis moves" findings={result.synthesis.nextMoves} sourceNames={sourceNames} tone="blue" />
                <p className="rounded-xl bg-white p-3 text-xs leading-5 text-muted-foreground">{result.synthesis.confidenceNote}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>
    </aside>
  );
}

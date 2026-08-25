import React from "react";
import { Layers3, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_SYNTHESIS_RECORDS, useOptionalSynthesisTray } from "@/contexts/SynthesisContext";
import type { InsightModule } from "@shared/insights";

type SynthesisActionProps = {
  module: InsightModule;
  recordId: number;
  sourceTitle: string;
  className?: string;
};

export default function SynthesisAction({ module, recordId, sourceTitle, className }: SynthesisActionProps) {
  const tray = useOptionalSynthesisTray();
  if (!tray) return null;

  const selection = { module, recordId, title: sourceTitle || "Untitled record" };
  const selected = tray.isSelected(selection);
  const atLimit = tray.selections.length >= MAX_SYNTHESIS_RECORDS;

  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={selected}
      aria-label={selected ? `Remove ${selection.title} from synthesis` : `Add ${selection.title} to synthesis`}
      disabled={!selected && atLimit}
      onClick={() => (selected ? tray.removeSelection(selection) : tray.addSelection(selection))}
      className={`synthesis-action rounded-full border-2 border-black bg-white text-black shadow-none hover:bg-[#f6f3ec] ${className ?? ""}`}
    >
      {selected ? <Check className="mr-2 h-4 w-4" /> : <Layers3 className="mr-2 h-4 w-4" />}
      {selected ? "In synthesis" : "Add to synthesis"}
    </Button>
  );
}

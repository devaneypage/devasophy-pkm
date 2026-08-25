import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { InsightModule } from "@shared/insights";

export const MIN_SYNTHESIS_RECORDS = 2;
export const MAX_SYNTHESIS_RECORDS = 8;

export type SynthesisSelection = {
  module: InsightModule;
  recordId: number;
  title: string;
};

type AddSelectionResult = "added" | "duplicate" | "limit";

type SynthesisContextValue = {
  selections: SynthesisSelection[];
  addSelection: (selection: SynthesisSelection) => AddSelectionResult;
  removeSelection: (selection: Pick<SynthesisSelection, "module" | "recordId">) => void;
  clearSelections: () => void;
  isSelected: (selection: Pick<SynthesisSelection, "module" | "recordId">) => boolean;
};

const SynthesisContext = createContext<SynthesisContextValue | null>(null);

function selectionKey(selection: Pick<SynthesisSelection, "module" | "recordId">) {
  return `${selection.module}:${selection.recordId}`;
}

export function SynthesisProvider({ children }: { children: React.ReactNode }) {
  const [selections, setSelections] = useState<SynthesisSelection[]>([]);

  const addSelection = useCallback((selection: SynthesisSelection): AddSelectionResult => {
    let result: AddSelectionResult = "added";
    setSelections((current) => {
      if (current.some((item) => selectionKey(item) === selectionKey(selection))) {
        result = "duplicate";
        return current;
      }
      if (current.length >= MAX_SYNTHESIS_RECORDS) {
        result = "limit";
        return current;
      }
      return [...current, selection];
    });
    return result;
  }, []);

  const removeSelection = useCallback((selection: Pick<SynthesisSelection, "module" | "recordId">) => {
    setSelections((current) => current.filter((item) => selectionKey(item) !== selectionKey(selection)));
  }, []);

  const clearSelections = useCallback(() => setSelections([]), []);
  const isSelected = useCallback(
    (selection: Pick<SynthesisSelection, "module" | "recordId">) => selections.some((item) => selectionKey(item) === selectionKey(selection)),
    [selections]
  );

  const value = useMemo(
    () => ({ selections, addSelection, removeSelection, clearSelections, isSelected }),
    [selections, addSelection, removeSelection, clearSelections, isSelected]
  );

  return <SynthesisContext.Provider value={value}>{children}</SynthesisContext.Provider>;
}

export function useOptionalSynthesisTray() {
  return useContext(SynthesisContext);
}

export function useSynthesisTray() {
  const context = useOptionalSynthesisTray();
  if (!context) throw new Error("useSynthesisTray must be used within SynthesisProvider");
  return context;
}

export type SemanticLinkDirection = "forward" | "backward" | "bidirectional";

export type SemanticLinkPresetKey =
  | "supports"
  | "questions"
  | "develops"
  | "contradicts"
  | "defines"
  | "extends"
  | "related";

export interface SemanticLinkPreset {
  key: SemanticLinkPresetKey;
  label: string;
  symbol: "→" | "←" | "↔";
  direction: SemanticLinkDirection;
  description: string;
}

export const semanticLinkPresets: SemanticLinkPreset[] = [
  {
    key: "supports",
    label: "Supports",
    symbol: "→",
    direction: "forward",
    description: "The source entry strengthens, evidences, or backs the target entry.",
  },
  {
    key: "questions",
    label: "Questions",
    symbol: "→",
    direction: "forward",
    description: "The source entry challenges, probes, or reopens the target entry.",
  },
  {
    key: "develops",
    label: "Develops",
    symbol: "→",
    direction: "forward",
    description: "The source entry extends or elaborates on the target entry.",
  },
  {
    key: "contradicts",
    label: "Contradicts",
    symbol: "↔",
    direction: "bidirectional",
    description: "The entries stand in productive tension or direct disagreement.",
  },
  {
    key: "defines",
    label: "Defines",
    symbol: "←",
    direction: "backward",
    description: "The target entry clarifies or grounds the source entry.",
  },
  {
    key: "extends",
    label: "Extends",
    symbol: "→",
    direction: "forward",
    description: "The source entry carries the target entry into a wider application.",
  },
  {
    key: "related",
    label: "Related",
    symbol: "↔",
    direction: "bidirectional",
    description: "The entries belong in the same conceptual neighborhood.",
  },
];

export const defaultSemanticLinkPresetByTarget: Record<"notebook" | "lexicon" | "document", SemanticLinkPresetKey> = {
  notebook: "supports",
  lexicon: "defines",
  document: "develops",
};

export function getSemanticLinkPreset(key?: string | null): SemanticLinkPreset {
  if (!key) {
    return semanticLinkPresets.find((preset) => preset.key === "related") ?? semanticLinkPresets[0];
  }

  return (
    semanticLinkPresets.find((preset) => preset.key === key) ?? {
      key: "related",
      label: toTitleCase(key.replace(/[_-]+/g, " ")),
      symbol: "↔",
      direction: "bidirectional",
      description: "A custom relationship recorded between two entries.",
    }
  );
}

export function formatSemanticLinkLabel(key?: string | null): string {
  const preset = getSemanticLinkPreset(key);
  return `${preset.label} ${preset.symbol}`;
}

export function formatSemanticLinkDisplay(key: string | null | undefined, targetLabel: string): string {
  const preset = getSemanticLinkPreset(key);

  if (preset.direction === "backward") {
    return `${targetLabel} ${preset.symbol} ${preset.label}`;
  }

  return `${preset.label} ${preset.symbol} ${targetLabel}`;
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(" ");
}

export const commonplaceTypes = [
  {
    value: "research_note",
    label: "Research Notes",
    shortLabel: "Notes",
    colorToken: "vermillion",
    accent: "#e04f2f",
    softAccent: "rgba(224, 79, 47, 0.14)",
    border: "rgba(224, 79, 47, 0.35)",
    description: "Working synthesis, marginalia, and research fragments.",
  },
  {
    value: "bookmark",
    label: "Bookmarks",
    shortLabel: "Bookmarks",
    colorToken: "grey",
    accent: "#7c7f87",
    softAccent: "rgba(124, 127, 135, 0.14)",
    border: "rgba(124, 127, 135, 0.34)",
    description: "Collected links, references, and source trails.",
  },
  {
    value: "idea",
    label: "Ideas",
    shortLabel: "Ideas",
    colorToken: "bright_blue",
    accent: "#1d8fff",
    softAccent: "rgba(29, 143, 255, 0.14)",
    border: "rgba(29, 143, 255, 0.36)",
    description: "Speculative sparks, concepts, and framing devices.",
  },
  {
    value: "quote",
    label: "Quotes",
    shortLabel: "Quotes",
    colorToken: "yellow",
    accent: "#e7bc28",
    softAccent: "rgba(231, 188, 40, 0.16)",
    border: "rgba(231, 188, 40, 0.38)",
    description: "Passages worth preserving with source context.",
  },
  {
    value: "book",
    label: "Books",
    shortLabel: "Books",
    colorToken: "green",
    accent: "#3f8b4d",
    softAccent: "rgba(63, 139, 77, 0.14)",
    border: "rgba(63, 139, 77, 0.34)",
    description: "Reading records, annotations, and bibliographic anchors.",
  },
  {
    value: "article",
    label: "Articles",
    shortLabel: "Articles",
    colorToken: "orange",
    accent: "#ef8d28",
    softAccent: "rgba(239, 141, 40, 0.15)",
    border: "rgba(239, 141, 40, 0.35)",
    description: "Essays, papers, and web reading organized for recall.",
  },
  {
    value: "glossary_term",
    label: "Glossary Terms",
    shortLabel: "Glossary",
    colorToken: "pink",
    accent: "#da73bb",
    softAccent: "rgba(218, 115, 187, 0.14)",
    border: "rgba(218, 115, 187, 0.35)",
    description: "Definitions, concepts, and concordance fragments.",
  },
  {
    value: "list",
    label: "Lists",
    shortLabel: "Lists",
    colorToken: "violet",
    accent: "#8454d8",
    softAccent: "rgba(132, 84, 216, 0.14)",
    border: "rgba(132, 84, 216, 0.35)",
    description: "Checklists, inventories, and ordered collections.",
  },
] as const;

export type CommonplaceTypeValue = (typeof commonplaceTypes)[number]["value"];

export function getCommonplaceTypeConfig(value: string | null | undefined) {
  return commonplaceTypes.find((item) => item.value === value) ?? commonplaceTypes[0];
}

export function buildEntryPreview(content: unknown, summary?: string | null) {
  if (summary?.trim()) {
    return summary.trim();
  }

  if (typeof content === "string") {
    return content.slice(0, 180);
  }

  if (Array.isArray(content)) {
    return content.join(" · ").slice(0, 180);
  }

  if (content && typeof content === "object") {
    const record = content as Record<string, unknown>;
    const candidate = [record.markdown, record.text, record.url, record.definition, record.items]
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .find((value) => typeof value === "string" && value.trim().length > 0);

    if (typeof candidate === "string") {
      return candidate.slice(0, 180);
    }
  }

  return "Open this card to continue shaping it.";
}

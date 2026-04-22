import { describe, expect, it } from "vitest";
import {
  enrichNotebookImportWithCategories,
  inferQuoteCategories,
  normalizeNotebookImportItem,
} from "../shared/pkmFormatting";

describe("automatic quote categorization", () => {
  it("infers research and writing categories from quote content", () => {
    const categories = inferQuoteCategories({
      text: "Research begins with a question, but writing is how the argument becomes clear.",
      note: "Useful for essay drafting and analysis.",
    });

    expect(categories).toContain("Research & Inquiry");
    expect(categories).toContain("Writing & Expression");
  });

  it("falls back to a general category when no rule matches", () => {
    const categories = inferQuoteCategories({
      text: "Silence at noon.",
    });

    expect(categories).toEqual(["General Reflections"]);
  });

  it("merges inferred categories with existing tags and collections during quote normalization", () => {
    const normalized = normalizeNotebookImportItem({
      quote: "Books teach judgment, and study turns reading into knowledge.",
      tags: ["Imported"],
      collection: "Reading Notes",
      notes: "Use in commonplace review.",
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.tags).toContain("Imported");
    expect(normalized?.tags).toContain("Books & Reading");
    expect(normalized?.tags).toContain("Knowledge & Learning");
    expect(normalized?.collections).toContain("Reading Notes");
  });

  it("keeps category enrichment idempotent when categories are already present", () => {
    const enriched = enrichNotebookImportWithCategories({
      text: "Logic gives legal reasoning its structure.",
      tags: "Law & Reasoning, Imported",
      collections: "Law & Reasoning",
    });

    const tags = enriched.tags?.split(", ") ?? [];
    const occurrences = tags.filter((tag) => tag === "Law & Reasoning").length;

    expect(occurrences).toBe(1);
    expect(enriched.collections).toBe("Law & Reasoning");
  });
});

import { describe, expect, it } from "vitest";
import {
  buildLexiconReferenceInsert,
  buildNotebookReferenceInsert,
  detectImportPayloadType,
  extractClavisAureaEntries,
  normalizeLexiconImportItem,
  normalizeNotebookImportItem,
  validateClavisAureaPayload,
} from "./pkmFormatting";

const clavisSample = {
  meta: {
    name: "Clavis Aurea",
    total_entries: 354,
  },
  entries: [
    {
      term: "Abecedarianism",
      pos: "noun",
      definition: "A foundational pedagogical philosophy.",
      origin: "",
      source_type: "Dictionary app",
      image_num: "114",
      date_added: "January 20, 2025",
      notes: "",
    },
    {
      term: "Abracadabra",
      pos: "noun/interjection",
      definition: "A magical incantation.",
      origin: "Aramaic",
      source_type: "Decorative art",
      image_num: "356",
      date_added: "October 12, 2023",
      notes: "",
    },
  ],
};

describe("Clavis Aurea payload helpers", () => {
  it("extracts entries from the provided Clavis Aurea payload shape", () => {
    const entries = extractClavisAureaEntries(clavisSample);
    expect(entries).toHaveLength(2);
  });

  it("validates a wrapped payload with meta and entry counts", () => {
    const result = validateClavisAureaPayload(clavisSample);
    expect(result.isValid).toBe(true);
    expect(result.totalEntries).toBe(2);
    expect(result.declaredTotal).toBe(354);
  });

  it("detects the Clavis Aurea payload type for drag-and-drop mode switching", () => {
    expect(detectImportPayloadType(clavisSample)).toBe("lexicon");
  });

  it("normalizes the provided Clavis Aurea entry schema", () => {
    const normalized = normalizeLexiconImportItem(clavisSample.entries[0]);
    expect(normalized).toEqual({
      term: "Abecedarianism",
      partOfSpeech: "noun",
      definition: "A foundational pedagogical philosophy.",
      etymology: undefined,
      origin: undefined,
      sourceType: "Dictionary app",
      imageNum: "114",
      notes: undefined,
    });
  });
});

describe("generic import normalization", () => {
  it("normalizes notebook imports with tag arrays and alternate keys", () => {
    const normalized = normalizeNotebookImportItem({
      quote: "Knowledge is a pattern of relation.",
      by: "Devaney",
      source: "Notebook",
      page: "12",
      notes: "Useful for the introduction",
      tags: ["knowledge", "patterns"],
      favorite: true,
    });

    expect(normalized).toEqual({
      text: "Knowledge is a pattern of relation.",
      author: "Devaney",
      work: "Notebook",
      sourceType: undefined,
      location: "12",
      note: "Useful for the introduction",
      tags: "knowledge, patterns, Knowledge & Learning, Books & Reading",
      collections: "Knowledge & Learning",
      favorite: true,
    });
  });

  it("returns null for malformed import records", () => {
    expect(normalizeLexiconImportItem({ definition: "Missing term" })).toBeNull();
    expect(normalizeNotebookImportItem({ note: "Missing text" })).toBeNull();
  });

  it("detects quote payloads for drag-and-drop mode switching", () => {
    expect(
      detectImportPayloadType([
        {
          quote: "A commonplace note is a future paragraph.",
          by: "Devaney",
        },
      ])
    ).toBe("quotes");
  });
});

describe("reference formatting helpers", () => {
  it("builds a notebook insertion blockquote for the editor", () => {
    const result = buildNotebookReferenceInsert({
      text: "A quotation becomes thought once rewritten.",
      author: "Commonplace Author",
      work: "Marginalia",
      note: "Pair with lexicon entry on annotation.",
    });

    expect(result).toContain("> A quotation becomes thought once rewritten.");
    expect(result).toContain("— Commonplace Author, Marginalia");
    expect(result).toContain("Pair with lexicon entry on annotation.");
  });

  it("builds a lexicon insertion snippet for the editor", () => {
    const result = buildLexiconReferenceInsert({
      term: "Aporia",
      partOfSpeech: "noun",
      definition: "A state of puzzlement.",
      notes: "Useful in rhetoric chapter.",
    });

    expect(result).toContain("**Aporia** (noun): A state of puzzlement.");
    expect(result).toContain("Useful in rhetoric chapter.");
  });
});

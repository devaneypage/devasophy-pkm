import { describe, expect, it } from "vitest";
import {
  analyzePreImportInput,
  buildLexiconReferenceInsert,
  buildNotebookReferenceInsert,
  detectImportPayloadType,
  extractClavisAureaEntries,
  inferCsvColumnMapping,
  normalizeLexiconImportItem,
  normalizeLexiconImportPayload,
  normalizeNotebookImportItem,
  normalizeNotebookImportPayload,
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

  it("normalizes the real quotes export payload shape used by the bulk import tool", () => {
    const normalized = normalizeNotebookImportPayload([
      {
        text: "We cannot solve our problems with the same thinking we used when we created them.",
        authors: "Albert Einstein",
        collections: "Mantra",
        source: null,
      },
      {
        text: "Do not quench your inspiration and your imagination.",
        authors: "",
        collections: "Poetical",
        source: {
          sourceType: "Book",
          title: "Letter to Theo Van Gogh (1882)",
          authors: "Vincent Van Gogh",
        },
      },
    ]);

    expect(normalized).toHaveLength(2);
    expect(normalized[0]).toMatchObject({
      author: "Albert Einstein",
      collections: "Mantra, General Reflections",
    });
    expect(normalized[1]).toMatchObject({
      author: "Vincent Van Gogh",
      work: "Letter to Theo Van Gogh (1882)",
      sourceType: "Book",
    });
  });

  it("normalizes the wrapped Clavis Aurea payload shape used by the bulk import tool", () => {
    const normalized = normalizeLexiconImportPayload(clavisSample);

    expect(normalized).toHaveLength(2);
    expect(normalized[0]).toMatchObject({
      term: "Abecedarianism",
      partOfSpeech: "noun",
      sourceType: "Dictionary app",
    });
  });

  it("infers CSV column mappings from common notebook and lexicon headers", () => {
    expect(inferCsvColumnMapping(["text", "authors", "source_type", "collections"], "quotes")).toMatchObject({
      text: 0,
      author: 1,
      sourceType: 2,
      collections: 3,
    });

    expect(inferCsvColumnMapping(["term", "pos", "definition", "image_num"], "lexicon")).toMatchObject({
      term: 0,
      partOfSpeech: 1,
      definition: 2,
      imageNum: 3,
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

describe("pre-import analysis", () => {
  it("builds a balanced summary for the real quotes payload shape", () => {
    const summary = analyzePreImportInput({
      rawText: JSON.stringify([
        {
          text: "We cannot solve our problems with the same thinking we used when we created them.",
          authors: "Albert Einstein",
          collections: "Mantra",
        },
        {
          text: "Do not quench your inspiration and your imagination.",
          source: {
            sourceType: "Book",
            title: "Letter to Theo Van Gogh (1882)",
            authors: "Vincent Van Gogh",
          },
        },
      ]),
      importType: "quotes",
      fileFormat: "json",
    });

    expect(summary.validEntries).toBe(2);
    expect(summary.invalidEntries).toBe(0);
    expect(summary.samplePreviews).toHaveLength(2);
    expect(summary.detectedSource).toBe("JSON");
    expect(summary.taxonomySuggestionCount).toBe(2);
    expect(summary.taxonomyGroups[0]).toMatchObject({
      categoryNumber: "30.09",
    });
  });

  it("reports inferred mappings and blocking errors for malformed CSV imports", () => {
    const summary = analyzePreImportInput({
      rawText: "author,work\nDevaney,Notebook",
      importType: "quotes",
      fileFormat: "csv",
      skipHeader: true,
    });

    expect(summary.inferredMapping).toMatchObject({ author: 0, work: 1 });
    expect(summary.validEntries).toBe(0);
    expect(summary.issues.some((issue) => issue.severity === "error")).toBe(true);
  });

  it("detects duplicate groups inside a plain-text batch before import", () => {
    const summary = analyzePreImportInput({
      rawText: "Aporia\nAporia\nKairos",
      importType: "lexicon",
      fileFormat: "text",
    });

    expect(summary.validEntries).toBe(3);
    expect(summary.duplicateCandidateCount).toBe(1);
    expect(summary.issues.some((issue) => issue.rowLabel === "Duplicates")).toBe(true);
    expect(summary.taxonomySuggestionCount).toBe(3);
    expect(summary.taxonomyGroups[0]).toMatchObject({ categoryNumber: "10.01" });
  });

  it("suggests synthesis and etymology categories before save when the import content is specific enough", () => {
    const notebookSummary = analyzePreImportInput({
      rawText: JSON.stringify([
        {
          text: "A synthesis framework becomes insight when rewritten and connected.",
          note: "Use in the synthesis chapter.",
        },
      ]),
      importType: "quotes",
      fileFormat: "json",
    });

    const lexiconSummary = analyzePreImportInput({
      rawText: JSON.stringify({
        entries: [
          {
            term: "Nominalism",
            definition: "A theory about universals.",
            etymology: "Derived from Late Latin nominalis.",
          },
        ],
      }),
      importType: "lexicon",
      fileFormat: "json",
    });

    expect(notebookSummary.taxonomySuggestions[0]).toMatchObject({
      categoryNumber: "44.03",
    });
    expect(lexiconSummary.taxonomySuggestions[0]).toMatchObject({
      categoryNumber: "14.01",
    });
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

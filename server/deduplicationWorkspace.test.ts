import {
  compareDedupRecords,
  extractComparableText,
  groupDedupComparableRecords,
  normalizeBookRecord,
  normalizeCommonplaceRecord,
  normalizeDocumentRecord,
  normalizeIdeaRecord,
  normalizeLexiconRecord,
} from "./duplicateDetection";

describe("Deduplication workspace helpers", () => {
  it("extracts comparable text from nested commonplace content payloads", () => {
    expect(
      extractComparableText({
        markdown: "A note body",
        author: "Ada Lovelace",
        items: ["alpha", "beta"],
      })
    ).toContain("A note body");
  });

  it("normalizes the supported module record shapes", () => {
    const commonplace = normalizeCommonplaceRecord({
      id: 11,
      title: "Shared fragment",
      summary: "Working note",
      content: { markdown: "Body text" },
      metadata: { zettelkastenId: "AC.ID-20260716-001", author: "Jane Doe" },
      entryType: "research_note",
    });
    const lexicon = normalizeLexiconRecord({ id: 12, term: "Shared term", definition: "Shared definition" });
    const book = normalizeBookRecord({ id: 13, title: "Shared book", author: "Jane Doe", notes: "Marginalia" });
    const document = normalizeDocumentRecord({ id: 14, title: "Shared fragment", content: "Body text", uuid: "doc-1" });
    const idea = normalizeIdeaRecord({ id: 15, title: "Shared fragment", summary: "Body text", uuid: "idea-1" });

    expect(commonplace.zettelkastenId).toBe("AC.ID-20260716-001");
    expect(lexicon.title).toBe("Shared term");
    expect(book.author).toBe("Jane Doe");
    expect(document.uuid).toBe("doc-1");
    expect(idea.body).toBe("Body text");
  });

  it("detects cross-module title and body matches while disallowing merge", () => {
    const commonplace = normalizeCommonplaceRecord({
      id: 21,
      title: "Archive architecture notes",
      summary: "Rethink the board structure",
      content: { markdown: "Rethink the board structure with calmer defaults." },
      metadata: {},
      entryType: "research_note",
    });
    const document = normalizeDocumentRecord({
      id: 22,
      title: "Archive architecture notes",
      content: "Rethink the board structure with calmer defaults.",
      uuid: "doc-22",
    });

    const match = compareDedupRecords(commonplace, document);
    expect(match).not.toBeNull();
    expect(match?.sameModule).toBe(false);
    expect(match?.allowedActions).toEqual(["archive", "delete"]);
    expect(match?.basis).toBe("title_body");
  });

  it("detects same-module book duplicates by title and author", () => {
    const first = normalizeBookRecord({ id: 31, title: "The Republic", author: "Plato" });
    const second = normalizeBookRecord({ id: 32, title: "The Republic", author: "Plato" });

    const match = compareDedupRecords(first, second);
    expect(match).not.toBeNull();
    expect(match?.sameModule).toBe(true);
    expect(match?.allowedActions).toEqual(["merge", "archive", "delete"]);
    expect(match?.basis).toBe("title_author");
  });

  it("groups connected duplicate pairs into a single review group", () => {
    const records = [
      normalizeCommonplaceRecord({
        id: 41,
        title: "Shared note",
        summary: "One body",
        content: { markdown: "One body" },
        metadata: {},
        entryType: "research_note",
      }),
      normalizeDocumentRecord({ id: 42, title: "Shared note", content: "One body" }),
      normalizeIdeaRecord({ id: 43, title: "Shared note", summary: "One body" }),
    ];

    const groups = groupDedupComparableRecords(records);
    expect(groups).toHaveLength(1);
    expect(groups[0].records).toHaveLength(3);
    expect(groups[0].sameModule).toBe(false);
    expect(groups[0].allowedActions).toEqual(["archive", "delete"]);
    expect(groups[0].suggestedCanonicalKey).toBeTruthy();
  });

  it("scans a live-scale lexicon dataset without quadratic pairwise work", () => {
    const records = Array.from({ length: 6362 }, (_, index) =>
      normalizeLexiconRecord({
        id: index + 1,
        term: `Distinct endpoint term ${String(index).padStart(5, "0")}`,
        definition: `Definition unique to record ${index}.`,
      })
    );

    records.push(
      normalizeLexiconRecord({ id: 7001, term: "Aletheia", definition: "Disclosure or unconcealment." }),
      normalizeLexiconRecord({ id: 7002, term: "Aletheia", definition: "Disclosure or unconcealment." })
    );

    const groups = groupDedupComparableRecords(records);

    expect(groups.some((group) => group.records.some((record) => record.id === 7001) && group.records.some((record) => record.id === 7002))).toBe(true);
  }, 5_000);
});

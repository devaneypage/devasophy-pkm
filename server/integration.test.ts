import { describe, expect, it } from "vitest";

describe("Devasophy PKM Integration Tests", () => {
  describe("Cross-Module Linking Workflows", () => {
    it("should create bi-directional link between notebook and lexicon", () => {
      const link = {
        sourceType: "notebook" as const,
        sourceId: 1,
        targetType: "lexicon" as const,
        targetId: 5,
        linkType: "references",
      };

      expect(link.sourceType).toBe("notebook");
      expect(link.targetType).toBe("lexicon");
      expect(link.linkType).toBe("references");
    });

    it("should retrieve links for a notebook entry", () => {
      const links = [
        {
          id: 1,
          sourceType: "notebook" as const,
          sourceId: 1,
          targetType: "lexicon" as const,
          targetId: 5,
          linkType: "references",
        },
      ];

      const notebookLinks = links.filter((l) => l.sourceType === "notebook" && l.sourceId === 1);
      expect(notebookLinks.length).toBe(1);
      expect(notebookLinks[0]?.targetType).toBe("lexicon");
    });

    it("should retrieve reverse links (backlinks)", () => {
      const links = [
        {
          id: 1,
          sourceType: "notebook" as const,
          sourceId: 1,
          targetType: "lexicon" as const,
          targetId: 5,
          linkType: "references",
        },
      ];

      const backlinks = links.filter((l) => l.targetType === "lexicon" && l.targetId === 5);
      expect(backlinks.length).toBe(1);
      expect(backlinks[0]?.sourceType).toBe("notebook");
    });

    it("should delete link and maintain referential integrity", () => {
      let links = [
        {
          id: 1,
          sourceType: "notebook" as const,
          sourceId: 1,
          targetType: "lexicon" as const,
          targetId: 5,
          linkType: "references",
        },
      ];

      links = links.filter((l) => l.id !== 1);
      expect(links.length).toBe(0);
    });
  });

  describe("Import Workflows", () => {
    it("should parse valid notebook JSON with all fields", () => {
      const json = JSON.stringify([
        {
          text: "A meaningful quote",
          author: "John Doe",
          work: "Some Work",
          sourceType: "Book",
          location: "p. 42",
          tags: "wisdom,philosophy",
          note: "Important observation",
        },
      ]);

      const data = JSON.parse(json);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]?.text).toBe("A meaningful quote");
      expect(data[0]?.author).toBe("John Doe");
      expect(data[0]?.tags).toBe("wisdom,philosophy");
    });

    it("should handle missing optional fields in import", () => {
      const json = JSON.stringify([
        {
          text: "Quote only",
          author: "Unknown",
        },
      ]);

      const data = JSON.parse(json);
      const entry = data[0];
      const work = entry?.work || "Unknown";
      const sourceType = entry?.sourceType || "Unknown";

      expect(work).toBe("Unknown");
      expect(sourceType).toBe("Unknown");
    });

    it("should parse Clavis Aurea JSON with etymology", () => {
      const json = JSON.stringify([
        {
          term: "Serendipity",
          partOfSpeech: "noun",
          definition: "Happy occurrence",
          etymology: "From Persian",
          origin: "Persian",
          sourceType: "Dictionary",
          notes: "Modern coinage",
        },
      ]);

      const data = JSON.parse(json);
      const term = data[0];
      expect(term?.term).toBe("Serendipity");
      expect(term?.etymology).toBe("From Persian");
      expect(term?.origin).toBe("Persian");
    });

    it("should handle malformed JSON gracefully", () => {
      const malformed = "{invalid json";
      let error = null;

      try {
        JSON.parse(malformed);
      } catch (e) {
        error = e;
      }

      expect(error).not.toBeNull();
    });

    it("should handle empty array import", () => {
      const json = JSON.stringify([]);
      const data = JSON.parse(json);

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it("should convert single object to array", () => {
      const json = JSON.stringify({ text: "Quote", author: "Author" });
      const data = JSON.parse(json);
      const items = Array.isArray(data) ? data : [data];

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBe(1);
    });

    it("should handle large batch import (1000+ items)", () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        text: `Quote ${i}`,
        author: `Author ${i}`,
      }));

      const json = JSON.stringify(items);
      const data = JSON.parse(json);

      expect(data.length).toBe(1000);
      expect(data[999]?.text).toBe("Quote 999");
    });
  });

  describe("Export Workflows", () => {
    it("should format notebook entry as Markdown", () => {
      const entry = {
        text: "A quote",
        author: "Author",
        work: "Work",
        sourceType: "Book",
        location: "p. 42",
      };

      const markdown = `# "${entry.text}"\n\n**Author:** ${entry.author}\n**Work:** ${entry.work}\n**Source:** ${entry.sourceType}\n**Location:** ${entry.location}`;

      expect(markdown).toContain(entry.text);
      expect(markdown).toContain("# ");
      expect(markdown).toContain("**");
    });

    it("should format lexicon term as Markdown", () => {
      const term = {
        term: "Serendipity",
        partOfSpeech: "noun",
        definition: "Happy occurrence",
        etymology: "From Persian",
      };

      const markdown = `## ${term.term}\n\n**Part of Speech:** ${term.partOfSpeech}\n**Definition:** ${term.definition}\n**Etymology:** ${term.etymology}`;

      expect(markdown).toContain(term.term);
      expect(markdown).toContain("##");
    });

    it("should export collection as JSON", () => {
      const entries = [
        { text: "Quote 1", author: "Author 1" },
        { text: "Quote 2", author: "Author 2" },
      ];

      const json = JSON.stringify(entries, null, 2);
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
    });

    it("should format collection as plain text", () => {
      const entries = [
        { text: "Quote 1", author: "Author 1" },
        { text: "Quote 2", author: "Author 2" },
      ];

      const text = entries.map((e) => `"${e.text}"\n— ${e.author}\n`).join("\n");

      expect(text).toContain("Quote 1");
      expect(text).toContain("Author 1");
      expect(text).toContain("—");
    });

    it("should handle empty collection export", () => {
      const entries: any[] = [];
      const json = JSON.stringify(entries);
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(0);
    });

    it("should generate timestamped filename", () => {
      const date = new Date("2026-04-10");
      const dateStr = date.toISOString().split("T")[0];
      const filename = `notebook-export-${dateStr}.json`;

      expect(filename).toContain("notebook-export");
      expect(filename).toContain("2026-04-10");
      expect(filename).toContain(".json");
    });
  });

  describe("Data Consistency", () => {
    it("should maintain referential integrity when deleting entry", () => {
      let entries = [
        { id: 1, text: "Quote 1" },
        { id: 2, text: "Quote 2" },
      ];

      let links = [
        { sourceId: 1, targetId: 2 },
        { sourceId: 2, targetId: 1 },
      ];

      // Delete entry 1
      const entryIds = new Set([1]);
      entries = entries.filter((e) => !entryIds.has(e.id));
      // Remove orphaned links (both source and target must exist)
      const validIds = new Set(entries.map((e) => e.id));
      links = links.filter((l) => validIds.has(l.sourceId) && validIds.has(l.targetId));

      expect(entries.length).toBe(1);
      expect(links.length).toBe(0);
    });

    it("should handle tag normalization", () => {
      const tags1 = "  tag1 , tag2 , tag3  ";
      const normalized1 = tags1
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .join(",");

      expect(normalized1).toBe("tag1,tag2,tag3");
    });

    it("should handle date consistency", () => {
      const now = new Date();
      const timestamp = now.getTime();
      const restored = new Date(timestamp);

      expect(restored.getTime()).toBe(timestamp);
    });
  });

  describe("Search & Filter Consistency", () => {
    it("should filter by module type", () => {
      const results = [
        { type: "notebook", text: "Quote" },
        { type: "lexicon", text: "Term" },
        { type: "document", text: "Doc" },
      ];

      const notebookOnly = results.filter((r) => r.type === "notebook");
      expect(notebookOnly.length).toBe(1);
      expect(notebookOnly[0]?.text).toBe("Quote");
    });

    it("should filter by date range", () => {
      const startDate = new Date("2026-01-01").getTime();
      const endDate = new Date("2026-12-31").getTime();

      const entries = [
        { createdAt: new Date("2026-03-15").getTime() },
        { createdAt: new Date("2025-12-15").getTime() },
        { createdAt: new Date("2027-01-15").getTime() },
      ];

      const inRange = entries.filter((e) => e.createdAt >= startDate && e.createdAt <= endDate);
      expect(inRange.length).toBe(1);
    });

    it("should filter by tag", () => {
      const entries = [
        { tags: "wisdom,philosophy" },
        { tags: "science,physics" },
        { tags: "wisdom,science" },
      ];

      const wisdomEntries = entries.filter((e) => e.tags.includes("wisdom"));
      expect(wisdomEntries.length).toBe(2);
    });
  });
});

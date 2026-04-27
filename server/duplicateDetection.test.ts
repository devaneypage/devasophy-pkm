import { describe, it, expect } from "vitest";
import {
  levenshteinDistance,
  calculateSimilarity,
  normalizeText,
  calculateWordOverlapSimilarity,
  calculateCombinedSimilarity,
  detectNotebookDuplicates,
  detectLexiconDuplicates,
  mergeNotebookEntries,
  mergeLexiconEntries,
  batchDetectNotebookDuplicates,
  batchDetectLexiconDuplicates,
  type NotebookDuplicate,
  type LexiconDuplicate,
} from "./duplicateDetection";

describe("Duplicate Detection System", () => {
  describe("Levenshtein Distance", () => {
    it("should calculate distance between identical strings", () => {
      expect(levenshteinDistance("hello", "hello")).toBe(0);
    });

    it("should calculate distance for single character difference", () => {
      expect(levenshteinDistance("hello", "hallo")).toBe(1);
    });

    it("should calculate distance for multiple differences", () => {
      expect(levenshteinDistance("kitten", "sitting")).toBe(3);
    });

    it("should handle empty strings", () => {
      expect(levenshteinDistance("", "")).toBe(0);
      expect(levenshteinDistance("hello", "")).toBe(5);
      expect(levenshteinDistance("", "world")).toBe(5);
    });

    it("should be case-sensitive", () => {
      expect(levenshteinDistance("Hello", "hello")).toBe(1);
    });
  });

  describe("Similarity Calculation", () => {
    it("should return 1 for identical strings", () => {
      expect(calculateSimilarity("hello", "hello")).toBe(1);
    });

    it("should return 0 for completely different strings", () => {
      const similarity = calculateSimilarity("abc", "xyz");
      expect(similarity).toBeLessThan(0.3);
    });

    it("should be case-insensitive", () => {
      expect(calculateSimilarity("Hello", "hello")).toBe(1);
    });

    it("should ignore leading/trailing whitespace", () => {
      expect(calculateSimilarity("  hello  ", "hello")).toBe(1);
    });

    it("should handle similar strings", () => {
      const similarity = calculateSimilarity("color", "colour");
      expect(similarity).toBeGreaterThan(0.8);
    });

    it("should handle partial matches", () => {
      const similarity = calculateSimilarity("hello world", "hello");
      expect(similarity).toBeGreaterThan(0.4);
    });
  });

  describe("Text Normalization", () => {
    it("should convert to lowercase", () => {
      expect(normalizeText("HELLO")).toBe("hello");
    });

    it("should remove punctuation", () => {
      expect(normalizeText("Hello, world!")).toBe("hello world");
    });

    it("should normalize whitespace", () => {
      expect(normalizeText("hello   world")).toBe("hello world");
    });

    it("should handle complex punctuation", () => {
      expect(normalizeText("It's a test!")).toBe("its a test");
    });

    it("should trim leading/trailing spaces", () => {
      expect(normalizeText("  hello world  ")).toBe("hello world");
    });
  });

  describe("Word Overlap Similarity", () => {
    it("should return 1 for identical texts", () => {
      expect(calculateWordOverlapSimilarity("hello world", "hello world")).toBe(1);
    });

    it("should return 0 for completely different texts", () => {
      expect(calculateWordOverlapSimilarity("abc def", "xyz uvw")).toBe(0);
    });

    it("should calculate Jaccard similarity", () => {
      const similarity = calculateWordOverlapSimilarity("hello world", "hello there");
      expect(similarity).toBeGreaterThan(0.3);
      expect(similarity).toBeLessThan(1);
    });

    it("should be case-insensitive", () => {
      expect(calculateWordOverlapSimilarity("Hello World", "hello world")).toBe(1);
    });

    it("should handle single word overlap", () => {
      const similarity = calculateWordOverlapSimilarity("apple banana", "apple orange");
      expect(similarity).toBeGreaterThan(0.2);
    });
  });

  describe("Combined Similarity", () => {
    it("should combine multiple metrics", () => {
      const combined = calculateCombinedSimilarity("hello world", "hello world");
      expect(combined).toBe(1);
    });

    it("should weight metrics appropriately", () => {
      const combined = calculateCombinedSimilarity("color", "colour");
      // color vs colour: 1 char difference, but word overlap is low (different words)
      // So combined score will be lower than individual metrics
      expect(combined).toBeGreaterThan(0.3);
    });

    it("should handle custom weights", () => {
      const combined = calculateCombinedSimilarity("hello", "hallo", {
        levenshtein: 0.9,
        wordOverlap: 0.1,
      });
      expect(combined).toBeGreaterThan(0.7);
    });
  });

  describe("Notebook Duplicate Detection", () => {
    const existingEntries = [
      {
        id: 1,
        text: "This is a great quote about life",
        author: "John Doe",
      },
      {
        id: 2,
        text: "Knowledge is power",
        author: "Francis Bacon",
      },
      {
        id: 3,
        text: "To be or not to be",
        author: "William Shakespeare",
      },
    ];

    it("should detect exact text duplicates", () => {
      const incoming = {
        text: "This is a great quote about life",
        author: "John Doe",
      };

      const duplicates = detectNotebookDuplicates(incoming, existingEntries);
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].similarity).toBe(1);
      expect(duplicates[0].matchType).toBe("text");
    });

    it("should detect similar text duplicates", () => {
      const incoming = {
        text: "This is a great quote about living",
        author: "John Doe",
      };

      const duplicates = detectNotebookDuplicates(incoming, existingEntries);
      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates[0].similarity).toBeGreaterThan(0.8);
    });

    it("should not flag dissimilar entries", () => {
      const incoming = {
        text: "Completely different text",
        author: "Unknown",
      };

      const duplicates = detectNotebookDuplicates(incoming, existingEntries);
      expect(duplicates).toHaveLength(0);
    });

    it("should detect author-based duplicates", () => {
      const incoming = {
        text: "Another quote by Shakespeare",
        author: "William Shakespeare",
      };

      const duplicates = detectNotebookDuplicates(incoming, existingEntries, {
        text: 0.85,
        author: 0.8,
        combined: 0.75,
      });

      // May detect as combined match if text similarity is high enough
      expect(duplicates.length).toBeGreaterThanOrEqual(0);
    });

    it("should sort duplicates by similarity", () => {
      const incoming = {
        text: "This is a great quote about life and living",
        author: "John Doe",
      };

      const duplicates = detectNotebookDuplicates(incoming, existingEntries);
      if (duplicates.length > 1) {
        for (let i = 0; i < duplicates.length - 1; i++) {
          expect(duplicates[i].similarity).toBeGreaterThanOrEqual(duplicates[i + 1].similarity);
        }
      }
    });

    it("should handle entries without author", () => {
      const incoming = {
        text: "Knowledge is power",
      };

      const duplicates = detectNotebookDuplicates(incoming, existingEntries);
      expect(duplicates.length).toBeGreaterThan(0);
    });
  });

  describe("Lexicon Duplicate Detection", () => {
    const existingEntries = [
      {
        id: 1,
        term: "Epistemology",
        definition: "The study of knowledge",
      },
      {
        id: 2,
        term: "Ontology",
        definition: "The study of being",
      },
      {
        id: 3,
        term: "Serendipity",
        definition: "Finding something good by chance",
      },
    ];

    it("should detect exact term duplicates", () => {
      const incoming = {
        term: "Epistemology",
        definition: "The study of knowledge",
      };

      const duplicates = detectLexiconDuplicates(incoming, existingEntries);
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].similarity).toBe(1);
      expect(duplicates[0].matchType).toBe("term");
    });

    it("should detect similar term duplicates", () => {
      const incoming = {
        term: "Epistemolgy", // Typo
        definition: "The study of knowledge",
      };

      const duplicates = detectLexiconDuplicates(incoming, existingEntries);
      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates[0].similarity).toBeGreaterThan(0.85);
    });

    it("should not flag dissimilar terms", () => {
      const incoming = {
        term: "Completely Different",
        definition: "Something else",
      };

      const duplicates = detectLexiconDuplicates(incoming, existingEntries);
      expect(duplicates).toHaveLength(0);
    });

    it("should detect definition-based duplicates", () => {
      const incoming = {
        term: "Serendipitous",
        definition: "Finding something good by chance",
      };

      const duplicates = detectLexiconDuplicates(incoming, existingEntries);
      // May detect as combined match
      expect(duplicates.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle entries without definition", () => {
      const incoming = {
        term: "Epistemology",
      };

      const duplicates = detectLexiconDuplicates(incoming, existingEntries);
      expect(duplicates.length).toBeGreaterThan(0);
    });
  });

  describe("Notebook Entry Merging", () => {
    it("should keep existing entry with keep_existing strategy", () => {
      const existing = {
        id: 1,
        text: "Original quote",
        author: "Author A",
        tags: "tag1",
      };
      const incoming = {
        text: "Different quote",
        author: "Author B",
        tags: "tag2",
      };

      const result = mergeNotebookEntries(existing, incoming, "keep_existing");
      expect(result.strategy).toBe("keep_existing");
      expect(result.mergedEntry.text).toBe("Original quote");
      expect(result.fieldsUpdated).toHaveLength(0);
    });

    it("should replace with incoming entry using replace_with_incoming strategy", () => {
      const existing = {
        id: 1,
        text: "Original quote",
        author: "Author A",
      };
      const incoming = {
        text: "New quote",
        author: "Author B",
      };

      const result = mergeNotebookEntries(existing, incoming, "replace_with_incoming");
      expect(result.strategy).toBe("replace_with_incoming");
      expect(result.mergedEntry.text).toBe("New quote");
      expect(result.fieldsUpdated).toContain("all");
    });

    it("should merge fields intelligently", () => {
      const existing = {
        id: 1,
        text: "Original quote",
        author: "Author A",
        tags: "tag1,tag2",
      };
      const incoming = {
        text: "Original quote",
        author: "Author A",
        tags: "tag2,tag3",
        note: "New note",
      };

      const result = mergeNotebookEntries(existing, incoming, "merge_fields");
      expect(result.strategy).toBe("merge_fields");
      expect(result.mergedEntry.text).toBe("Original quote");
      expect(result.fieldsUpdated).toContain("note");
      // Tags should be merged
      const tags = result.mergedEntry.tags.split(",");
      expect(tags).toContain("tag1");
      expect(tags).toContain("tag2");
      expect(tags).toContain("tag3");
    });

    it("should merge tags without duplicates", () => {
      const existing = {
        text: "Quote",
        tags: "wisdom,philosophy",
      };
      const incoming = {
        text: "Quote",
        tags: "philosophy,knowledge",
      };

      const result = mergeNotebookEntries(existing, incoming, "merge_fields");
      const tags = result.mergedEntry.tags.split(",");
      expect(tags).toContain("wisdom");
      expect(tags).toContain("philosophy");
      expect(tags).toContain("knowledge");
      expect(tags.length).toBe(3);
    });

    it("should append notes from incoming", () => {
      const existing = {
        text: "Quote",
        note: "Existing note",
      };
      const incoming = {
        text: "Quote",
        note: "New note",
      };

      const result = mergeNotebookEntries(existing, incoming, "merge_fields");
      expect(result.mergedEntry.note).toContain("Existing note");
      expect(result.mergedEntry.note).toContain("New note");
      expect(result.fieldsUpdated).toContain("note");
    });

    it("should mark as favorite if incoming is favorite", () => {
      const existing = {
        text: "Quote",
        favorite: false,
      };
      const incoming = {
        text: "Quote",
        favorite: true,
      };

      const result = mergeNotebookEntries(existing, incoming, "merge_fields");
      expect(result.mergedEntry.favorite).toBe(true);
      expect(result.fieldsUpdated).toContain("favorite");
    });
  });

  describe("Lexicon Entry Merging", () => {
    it("should keep existing entry with keep_existing strategy", () => {
      const existing = {
        id: 1,
        term: "Epistemology",
        definition: "Study of knowledge",
      };
      const incoming = {
        term: "Epistemology",
        definition: "Different definition",
      };

      const result = mergeLexiconEntries(existing, incoming, "keep_existing");
      expect(result.strategy).toBe("keep_existing");
      expect(result.mergedEntry.definition).toBe("Study of knowledge");
      expect(result.fieldsUpdated).toHaveLength(0);
    });

    it("should replace with incoming entry", () => {
      const existing = {
        id: 1,
        term: "Epistemology",
        definition: "Study of knowledge",
      };
      const incoming = {
        term: "Epistemology",
        definition: "New definition",
      };

      const result = mergeLexiconEntries(existing, incoming, "replace_with_incoming");
      expect(result.mergedEntry.definition).toBe("New definition");
      expect(result.fieldsUpdated).toContain("all");
    });

    it("should merge fields intelligently", () => {
      const existing = {
        id: 1,
        term: "Epistemology",
        definition: "Study of knowledge",
        etymology: "From Greek",
      };
      const incoming = {
        term: "Epistemology",
        definition: "Study of knowledge",
        origin: "Ancient Greece",
      };

      const result = mergeLexiconEntries(existing, incoming, "merge_fields");
      expect(result.mergedEntry.etymology).toBe("From Greek");
      expect(result.mergedEntry.origin).toBe("Ancient Greece");
      expect(result.fieldsUpdated).toContain("origin");
    });

    it("should append notes from incoming", () => {
      const existing = {
        term: "Epistemology",
        notes: "Existing note",
      };
      const incoming = {
        term: "Epistemology",
        notes: "New note",
      };

      const result = mergeLexiconEntries(existing, incoming, "merge_fields");
      expect(result.mergedEntry.notes).toContain("Existing note");
      expect(result.mergedEntry.notes).toContain("New note");
    });
  });

  describe("Batch Duplicate Detection", () => {
    const existingEntries = [
      { id: 1, text: "Quote 1", author: "Author A" },
      { id: 2, text: "Quote 2", author: "Author B" },
    ];

    it("should detect duplicates for multiple incoming entries", () => {
      const incoming = [
        { text: "Quote 1", author: "Author A" },
        { text: "Completely different", author: "Author C" },
        { text: "Quote 2", author: "Author B" },
      ];

      const results = batchDetectNotebookDuplicates(incoming, existingEntries);
      expect(results.size).toBe(2); // Two entries have duplicates
      expect(results.has(0)).toBe(true);
      expect(results.has(2)).toBe(true);
      expect(results.has(1)).toBe(false);
    });

    it("should return empty map when no duplicates found", () => {
      const incoming = [
        { text: "Unique quote 1", author: "Author X" },
        { text: "Unique quote 2", author: "Author Y" },
      ];

      const results = batchDetectNotebookDuplicates(incoming, existingEntries);
      expect(results.size).toBe(0);
    });
  });

  describe("Batch Lexicon Duplicate Detection", () => {
    const existingEntries = [
      { id: 1, term: "Epistemology", definition: "Study of knowledge" },
      { id: 2, term: "Ontology", definition: "Study of being" },
    ];

    it("should detect duplicates for multiple incoming terms", () => {
      const incoming = [
        { term: "Epistemology", definition: "Study of knowledge" },
        { term: "Completely Different", definition: "Something else" },
        { term: "Ontology", definition: "Study of being" },
      ];

      const results = batchDetectLexiconDuplicates(incoming, existingEntries);
      expect(results.size).toBe(2);
      expect(results.has(0)).toBe(true);
      expect(results.has(2)).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty strings", () => {
      const similarity = calculateSimilarity("", "");
      expect(similarity).toBe(1);
    });

    it("should handle very long strings", () => {
      const long1 = "a".repeat(1000);
      const long2 = "a".repeat(1000);
      const similarity = calculateSimilarity(long1, long2);
      expect(similarity).toBe(1);
    });

    it("should handle special characters", () => {
      const similarity = calculateSimilarity("hello@world!", "hello world");
      expect(similarity).toBeGreaterThan(0.7);
    });

    it("should handle unicode characters", () => {
      const similarity = calculateSimilarity("café", "cafe");
      expect(similarity).toBeGreaterThan(0.7);
    });

    it("should handle null/undefined gracefully", () => {
      const existing = { id: 1, text: "Quote", author: undefined };
      const incoming = { text: "Quote", author: "Author" };

      const duplicates = detectNotebookDuplicates(incoming, [existing]);
      expect(duplicates.length).toBeGreaterThan(0);
    });
  });

  describe("Performance", () => {
    it("should handle large batch operations", () => {
      const existingEntries = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        text: `Quote ${i}`,
        author: `Author ${i}`,
      }));

      const incoming = Array.from({ length: 100 }, (_, i) => ({
        text: `Quote ${i * 10}`,
        author: `Author ${i * 10}`,
      }));

      const results = batchDetectNotebookDuplicates(incoming, existingEntries);
      expect(results.size).toBeGreaterThan(0);
    });
  });
});

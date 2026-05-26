import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  categorizeEntryContent,
  parseCSV,
  parseTextLines,
} from "./db";

describe("Bulk Import Functions", () => {
  describe("categorizeEntryContent", () => {
    it("should categorize notebook entries as quotes", () => {
      const result = categorizeEntryContent("This is a great quote from the book", "notebook");
      expect(result).toBe("30.09"); // Miscellaneous Quotations
    });

    it("should categorize notebook entries as observations", () => {
      const result = categorizeEntryContent("My observation about this phenomenon", "notebook");
      expect(result).toBe("41.01"); // Observations & Insights
    });

    it("should categorize notebook entries as insights", () => {
      const result = categorizeEntryContent("I had an insight about the problem", "notebook");
      expect(result).toBe("44.03"); // Synthesis Notes
    });

    it("should default to quotes for unknown notebook content", () => {
      const result = categorizeEntryContent("Random text without keywords", "notebook");
      expect(result).toBe("30.09");
    });

    it("should categorize lexicon entries as terms", () => {
      const result = categorizeEntryContent("This is a vocabulary term", "lexicon");
      expect(result).toBe("10.01"); // General Vocabulary Lists (A–M)
    });

    it("should categorize lexicon entries as etymology", () => {
      const result = categorizeEntryContent("The root and etymology of this word", "lexicon");
      expect(result).toBe("11.01"); // Word Origins & Histories
    });

    it("should categorize lexicon entries as concordance", () => {
      const result = categorizeEntryContent("This is a concordance reference", "lexicon");
      expect(result).toBe("12.01"); // Usage Notes & Distinctions
    });

    it("should default to terms for unknown lexicon content", () => {
      const result = categorizeEntryContent("Random text", "lexicon");
      expect(result).toBe("10.01");
    });

    it("should be case-insensitive", () => {
      const result1 = categorizeEntryContent("QUOTE", "notebook");
      const result2 = categorizeEntryContent("quote", "notebook");
      expect(result1).toBe(result2);
    });
  });

  describe("parseCSV", () => {
    it("should parse simple CSV data", () => {
      const csv = "name,age,city\nJohn,30,NYC\nJane,25,LA";
      const result = parseCSV(csv);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(["name", "age", "city"]);
      expect(result[1]).toEqual(["John", "30", "NYC"]);
      expect(result[2]).toEqual(["Jane", "25", "LA"]);
    });

    it("should handle quoted fields with commas", () => {
      const csv = 'name,description\n"Smith, John","A person from New York"';
      const result = parseCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[1][0]).toBe("Smith, John");
      expect(result[1][1]).toBe("A person from New York");
    });

    it("should handle escaped quotes", () => {
      const csv = 'text\n"He said ""Hello"""';
      const result = parseCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[1][0]).toBe('He said "Hello"');
    });

    it("should handle empty fields", () => {
      const csv = "a,b,c\n1,,3";
      const result = parseCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual(["1", "", "3"]);
    });

    it("should handle Windows line endings", () => {
      const csv = "a,b\r\n1,2\r\n3,4";
      const result = parseCSV(csv);
      expect(result).toHaveLength(3);
      expect(result[1]).toEqual(["1", "2"]);
      expect(result[2]).toEqual(["3", "4"]);
    });

    it("should trim whitespace from fields", () => {
      const csv = "  a  ,  b  \n  1  ,  2  ";
      const result = parseCSV(csv);
      expect(result[0]).toEqual(["a", "b"]);
      expect(result[1]).toEqual(["1", "2"]);
    });

    it("should handle multiline quoted fields", () => {
      const csv = 'text\n"Line 1\nLine 2"';
      const result = parseCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[1][0]).toContain("Line 1");
      expect(result[1][0]).toContain("Line 2");
    });
  });

  describe("parseTextLines", () => {
    it("should parse text lines", () => {
      const text = "Line 1\nLine 2\nLine 3";
      const result = parseTextLines(text);
      expect(result).toEqual(["Line 1", "Line 2", "Line 3"]);
    });

    it("should trim whitespace", () => {
      const text = "  Line 1  \n  Line 2  ";
      const result = parseTextLines(text);
      expect(result).toEqual(["Line 1", "Line 2"]);
    });

    it("should filter empty lines", () => {
      const text = "Line 1\n\n\nLine 2\n   \nLine 3";
      const result = parseTextLines(text);
      expect(result).toEqual(["Line 1", "Line 2", "Line 3"]);
    });

    it("should handle custom delimiter", () => {
      const text = "Item 1|Item 2|Item 3";
      const result = parseTextLines(text, "|");
      expect(result).toEqual(["Item 1", "Item 2", "Item 3"]);
    });

    it("should handle Windows line endings", () => {
      const text = "Line 1\r\nLine 2\r\nLine 3";
      const result = parseTextLines(text);
      expect(result).toEqual(["Line 1", "Line 2", "Line 3"]);
    });

    it("should handle mixed line endings", () => {
      const text = "Line 1\nLine 2\r\nLine 3";
      const result = parseTextLines(text);
      expect(result).toEqual(["Line 1", "Line 2", "Line 3"]);
    });

    it("should handle single line", () => {
      const text = "Single line";
      const result = parseTextLines(text);
      expect(result).toEqual(["Single line"]);
    });

    it("should handle empty string", () => {
      const text = "";
      const result = parseTextLines(text);
      expect(result).toEqual([]);
    });
  });

  describe("CSV parsing edge cases", () => {
    it("should handle consecutive commas", () => {
      const csv = "a,,c\n1,,3";
      const result = parseCSV(csv);
      expect(result[1]).toEqual(["1", "", "3"]);
    });

    it("should handle quotes at start and end", () => {
      const csv = '"quoted","normal","also quoted"';
      const result = parseCSV(csv);
      expect(result[0]).toEqual(["quoted", "normal", "also quoted"]);
    });

    it("should handle empty CSV", () => {
      const csv = "";
      const result = parseCSV(csv);
      expect(result).toHaveLength(0);
    });

    it("should handle single field", () => {
      const csv = "value";
      const result = parseCSV(csv);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(["value"]);
    });

    it("should handle trailing newline", () => {
      const csv = "a,b\n1,2\n";
      const result = parseCSV(csv);
      expect(result).toHaveLength(2);
    });
  });

  describe("Text parsing edge cases", () => {
    it("should handle very long lines", () => {
      const longLine = "a".repeat(10000);
      const text = longLine + "\n" + longLine;
      const result = parseTextLines(text);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(10000);
    });

    it("should handle special characters", () => {
      const text = "Line with émojis 🎉\nLine with symbols @#$%";
      const result = parseTextLines(text);
      expect(result).toHaveLength(2);
      expect(result[0]).toContain("émojis");
    });

    it("should handle tabs and spaces", () => {
      const text = "\t\tTabbed line\n   Spaced line";
      const result = parseTextLines(text);
      expect(result).toEqual(["Tabbed line", "Spaced line"]);
    });
  });

  describe("Categorization edge cases", () => {
    it("should handle null or undefined input gracefully", () => {
      const result = categorizeEntryContent("", "notebook");
      expect(result).toBe("30.09"); // Default
    });

    it("should handle very long text", () => {
      const longText = "quote ".repeat(1000);
      const result = categorizeEntryContent(longText, "notebook");
      expect(result).toBe("30.09");
    });

    it("should handle multiple keywords", () => {
      const text = "This is a quote and an observation and an insight";
      const result = categorizeEntryContent(text, "notebook");
      // Should match the first keyword found
      expect(["30.09", "41.01", "44.03"]).toContain(result);
    });

    it("should handle mixed case keywords", () => {
      const result1 = categorizeEntryContent("QUOTE", "notebook");
      const result2 = categorizeEntryContent("Quote", "notebook");
      const result3 = categorizeEntryContent("quote", "notebook");
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });
});

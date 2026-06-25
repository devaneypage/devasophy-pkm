import { describe, it, expect } from "vitest";
import { importBooksFromCSV, importNotebookEntriesFromCSV } from "./db";

describe("CSV Import Procedures", () => {
  const testUserId = 9998;

  describe("importBooksFromCSV", () => {
    it("should import books from valid CSV", async () => {
      const csvContent = `Title,Author,Status,Rating,Reading Progress,Notes,Tags
The Great Gatsby,F. Scott Fitzgerald,completed,4.5,100,A classic novel,fiction
1984,George Orwell,reading,5,75,Dystopian masterpiece,fiction,dystopian`;

      const result = await importBooksFromCSV(testUserId, csvContent);

      expect(result).toHaveProperty("imported");
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("total");
      expect(result.total).toBe(2);
    });

    it("should handle CSV with minimal fields", async () => {
      const csvContent = `Title,Author
The Great Gatsby,F. Scott Fitzgerald`;

      const result = await importBooksFromCSV(testUserId, csvContent);

      expect(result).toHaveProperty("imported");
      expect(result.total).toBe(1);
    });

    it("should reject CSV without header", async () => {
      const csvContent = ``;

      try {
        await importBooksFromCSV(testUserId, csvContent);
        expect(true).toBe(false);
      } catch (error) {
        expect(error instanceof Error).toBe(true);
      }
    });
  });

  describe("importNotebookEntriesFromCSV", () => {
    it("should import notebook entries from valid CSV", async () => {
      const csvContent = `Text,Author,Work,Source Type,Location,Note,Tags,Collections
This is a test note,Test Author,Test Work,book,page 42,Important,learning,philosophy
Another note,Another Author,Another Work,article,section 3,Useful,research,science`;

      const result = await importNotebookEntriesFromCSV(testUserId, csvContent);

      expect(result).toHaveProperty("imported");
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("total");
      expect(result.total).toBe(2);
    });

    it("should import with minimal fields", async () => {
      const csvContent = `Text,Author
This is a test note,Test Author`;

      const result = await importNotebookEntriesFromCSV(testUserId, csvContent);

      expect(result).toHaveProperty("imported");
      expect(result.total).toBe(1);
    });

    it("should reject CSV without header", async () => {
      const csvContent = ``;

      try {
        await importNotebookEntriesFromCSV(testUserId, csvContent);
        expect(true).toBe(false);
      } catch (error) {
        expect(error instanceof Error).toBe(true);
      }
    });
  });
});

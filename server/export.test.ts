import { describe, it, expect, beforeAll } from "vitest";
import { exportBooksAsCSV, exportNotebookEntriesAsCSV, exportCombinedAsCSV, createBook } from "./db";

describe("Export Procedures", () => {
  const testUserId = 9999;

  beforeAll(async () => {
    // Create test books
    await createBook(testUserId, {
      title: "Test Book 1",
      author: "Author One",
      status: "reading",
      rating: "4.5",
      readingProgress: 50,
      notes: "Great book",
      tags: "fiction,adventure",
    });

    await createBook(testUserId, {
      title: "Test Book 2",
      author: "Author Two",
      status: "completed",
      rating: "5",
      readingProgress: 100,
      notes: "Excellent read",
      tags: "non-fiction,science",
    });
  });

  describe("exportBooksAsCSV", () => {
    it("should export all books as CSV", async () => {
      const result = await exportBooksAsCSV(testUserId);

      expect(result).toHaveProperty("csv");
      expect(result).toHaveProperty("filename");
      expect(result).toHaveProperty("count");
      expect(result.count).toBeGreaterThanOrEqual(2);
      expect(result.csv).toContain("ID,Title,Author,Status");
      expect(result.csv).toContain("Test Book 1");
      expect(result.csv).toContain("Test Book 2");
      expect(result.filename).toMatch(/^books_export_\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it("should filter books by status", async () => {
      const result = await exportBooksAsCSV(testUserId, { status: "reading" });

      expect(result.csv).toContain("Test Book 1");
      expect(result.csv).not.toContain("Test Book 2");
    });

    it("should sort books by rating", async () => {
      const result = await exportBooksAsCSV(testUserId, { sortBy: "rating" });

      expect(result.csv).toContain("Test Book 2");
      expect(result.csv).toContain("Test Book 1");
    });

    it("should escape quotes in CSV values", async () => {
      const result = await exportBooksAsCSV(testUserId);
      expect(result.csv).toMatch(/"/);
    });

    it("should produce valid CSV format", async () => {
      const result = await exportBooksAsCSV(testUserId);
      const lines = result.csv.split("\n");

      // Should have header and at least 2 data rows
      expect(lines.length).toBeGreaterThanOrEqual(3);

      // Header should have correct number of columns
      const headerCols = lines[0].split(",").length;
      expect(headerCols).toBe(9); // ID, Title, Author, Status, Reading Progress, Rating, Date Added, Notes, Tags
    });
  });

  describe("exportNotebookEntriesAsCSV", () => {
    it("should export notebook entries as CSV", async () => {
      const result = await exportNotebookEntriesAsCSV(testUserId);

      expect(result).toHaveProperty("csv");
      expect(result).toHaveProperty("filename");
      expect(result).toHaveProperty("count");
      expect(result.csv).toContain("ID,Zettelkasten ID,Text,Author");
      expect(result.filename).toMatch(/^notebook_export_\d{4}-\d{2}-\d{2}\.csv$/);
    });
  });

  describe("exportCombinedAsCSV", () => {
    it("should export combined data with proper section headers", async () => {
      const result = await exportCombinedAsCSV(testUserId);

      expect(result).toHaveProperty("csv");
      expect(result).toHaveProperty("filename");
      expect(result).toHaveProperty("booksCount");
      expect(result).toHaveProperty("notesCount");
      expect(result.booksCount).toBeGreaterThanOrEqual(2);
      expect(result.csv).toContain("=== BOOKS ===");
      expect(result.csv).toContain("=== NOTEBOOK ENTRIES ===");
      expect(result.csv).toContain("Test Book 1");
      expect(result.csv).toContain("Test Book 2");
      expect(result.filename).toMatch(/^devanomy_export_\d{4}-\d{2}-\d{2}\.csv$/);
    });
  });
});

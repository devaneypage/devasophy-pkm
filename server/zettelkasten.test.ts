import { describe, it, expect } from "vitest";
import {
  formatDateForId,
  parseZettelkastenId,
  isValidZettelkastenId,
  createBranchedId,
} from "./zettelkasten";

describe("Zettelkasten ID System", () => {
  describe("formatDateForId", () => {
    it("formats a date as YYYYMMDD", () => {
      const date = new Date(2025, 3, 23); // April 23, 2025
      const formatted = formatDateForId(date);
      expect(formatted).toBe("20250423");
    });

    it("pads month and day with leading zeros", () => {
      const date = new Date(2025, 0, 5); // January 5, 2025
      const formatted = formatDateForId(date);
      expect(formatted).toBe("20250105");
    });

    it("uses current date when no date provided", () => {
      const formatted = formatDateForId();
      // Should match YYYYMMDD format
      expect(formatted).toMatch(/^\d{8}$/);
      expect(formatted.length).toBe(8);
    });
  });

  describe("parseZettelkastenId", () => {
    it("parses a valid Zettelkasten ID", () => {
      const id = "20.03-20250423-001";
      const parsed = parseZettelkastenId(id);
      expect(parsed).toEqual({
        categoryNumber: "20.03",
        date: "20250423",
        sequence: 1,
        branch: undefined,
      });
    });

    it("parses an ID with a branch suffix", () => {
      const id = "20.03-20250423-001/a";
      const parsed = parseZettelkastenId(id);
      expect(parsed).toEqual({
        categoryNumber: "20.03",
        date: "20250423",
        sequence: 1,
        branch: "a",
      });
    });

    it("parses an ID with a complex branch suffix", () => {
      const id = "10.11-20250101-042/related-concept";
      const parsed = parseZettelkastenId(id);
      expect(parsed).toEqual({
        categoryNumber: "10.11",
        date: "20250101",
        sequence: 42,
        branch: "related-concept",
      });
    });

    it("returns null for invalid ID format", () => {
      expect(parseZettelkastenId("invalid")).toBeNull();
      expect(parseZettelkastenId("20.03-2025-001")).toBeNull(); // Wrong date format
      expect(parseZettelkastenId("20-03-20250423-001")).toBeNull(); // Wrong category format
      expect(parseZettelkastenId("")).toBeNull();
    });

    it("returns null for ID with missing components", () => {
      expect(parseZettelkastenId("20.03-20250423")).toBeNull(); // Missing sequence
      expect(parseZettelkastenId("20.03-001")).toBeNull(); // Missing date
    });
  });

  describe("isValidZettelkastenId", () => {
    it("validates correct Zettelkasten IDs", () => {
      expect(isValidZettelkastenId("20.03-20250423-001")).toBe(true);
      expect(isValidZettelkastenId("10.11-20250101-042")).toBe(true);
      expect(isValidZettelkastenId("30.05-20241225-999")).toBe(true);
    });

    it("validates IDs with branch suffixes", () => {
      expect(isValidZettelkastenId("20.03-20250423-001/a")).toBe(true);
      expect(isValidZettelkastenId("20.03-20250423-001/related")).toBe(true);
    });

    it("rejects invalid IDs", () => {
      expect(isValidZettelkastenId("invalid")).toBe(false);
      expect(isValidZettelkastenId("20.03-2025-001")).toBe(false);
      expect(isValidZettelkastenId("20-03-20250423-001")).toBe(false);
      expect(isValidZettelkastenId("")).toBe(false);
    });
  });

  describe("createBranchedId", () => {
    it("creates a branched ID from a base ID", () => {
      const baseId = "20.03-20250423-001";
      const branched = createBranchedId(baseId, "a");
      expect(branched).toBe("20.03-20250423-001/a");
    });

    it("creates a branched ID with complex suffix", () => {
      const baseId = "10.11-20250101-042";
      const branched = createBranchedId(baseId, "related-concept");
      expect(branched).toBe("10.11-20250101-042/related-concept");
    });

    it("replaces existing branch suffix", () => {
      const baseId = "20.03-20250423-001/old";
      const branched = createBranchedId(baseId, "new");
      expect(branched).toBe("20.03-20250423-001/new");
    });

    it("throws error for invalid base ID", () => {
      expect(() => createBranchedId("invalid", "a")).toThrow("Invalid base Zettelkasten ID");
      expect(() => createBranchedId("20.03-2025-001", "a")).toThrow("Invalid base Zettelkasten ID");
    });
  });

  describe("ID Format Specification", () => {
    it("follows the AC.ID-YYYYMMDD-Seq format", () => {
      const id = "20.03-20250423-001";
      const parsed = parseZettelkastenId(id);
      expect(parsed).not.toBeNull();
      if (parsed) {
        // AC: Area-Category (e.g., 20.03)
        expect(parsed.categoryNumber).toMatch(/^\d{2}\.\d{2}$/);
        // YYYYMMDD: Date
        expect(parsed.date).toMatch(/^\d{8}$/);
        // Seq: Sequence number (001-999)
        expect(parsed.sequence).toBeGreaterThanOrEqual(1);
        expect(parsed.sequence).toBeLessThanOrEqual(999);
      }
    });

    it("supports all valid category numbers", () => {
      const validCategories = ["10.01", "10.11", "20.03", "30.05", "40.99"];
      validCategories.forEach((cat) => {
        const id = `${cat}-20250423-001`;
        expect(isValidZettelkastenId(id)).toBe(true);
      });
    });

    it("supports sequence numbers 001-999", () => {
      expect(isValidZettelkastenId("20.03-20250423-001")).toBe(true);
      expect(isValidZettelkastenId("20.03-20250423-099")).toBe(true);
      expect(isValidZettelkastenId("20.03-20250423-999")).toBe(true);
      // Invalid: leading zeros missing
      expect(isValidZettelkastenId("20.03-20250423-1")).toBe(false);
      expect(isValidZettelkastenId("20.03-20250423-99")).toBe(false);
    });
  });

  describe("ID Uniqueness and Sequence", () => {
    it("extracts sequence number correctly", () => {
      const parsed = parseZettelkastenId("20.03-20250423-042");
      expect(parsed?.sequence).toBe(42);
    });

    it("handles leading zeros in sequence numbers", () => {
      const parsed = parseZettelkastenId("20.03-20250423-001");
      expect(parsed?.sequence).toBe(1);
    });

    it("preserves date information for sorting", () => {
      const id1 = parseZettelkastenId("20.03-20250101-001");
      const id2 = parseZettelkastenId("20.03-20250423-001");
      expect(id1?.date).toBe("20250101");
      expect(id2?.date).toBe("20250423");
      expect(id1?.date! < id2?.date!).toBe(true);
    });
  });

  describe("Branch ID Patterns", () => {
    it("supports simple letter branches", () => {
      expect(isValidZettelkastenId("20.03-20250423-001/a")).toBe(true);
      expect(isValidZettelkastenId("20.03-20250423-001/z")).toBe(true);
    });

    it("supports multi-character branches", () => {
      expect(isValidZettelkastenId("20.03-20250423-001/related")).toBe(true);
      expect(isValidZettelkastenId("20.03-20250423-001/follow-up")).toBe(true);
    });

    it("supports numeric branches", () => {
      expect(isValidZettelkastenId("20.03-20250423-001/1")).toBe(true);
      expect(isValidZettelkastenId("20.03-20250423-001/v2")).toBe(true);
    });
  });
});

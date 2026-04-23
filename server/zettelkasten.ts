/**
 * Zettelkasten ID Generation
 * 
 * Format: AC.ID-YYYYMMDD-Seq[/Branch]
 * Example: 20.03-20250423-001
 * 
 * Components:
 * - AC: Area-Category (Johnny Decimal prefix, e.g., 20.03)
 * - YYYYMMDD: Creation date (e.g., 20250423 = April 23, 2025)
 * - Seq: Sequential number within the day (001, 002, etc.)
 * - [/Branch]: Optional branching suffix for related notes
 */

import { getDb } from "./db";
import { notebookEntries, lexiconEntries } from "../drizzle/schema";
import { eq, and, like } from "drizzle-orm";

/**
 * Format a date as YYYYMMDD
 */
export function formatDateForId(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Get the next sequence number for a given date and category
 */
async function getNextSequenceNumber(
  userId: number,
  categoryNumber: string,
  dateStr: string,
  table: "notebook" | "lexicon"
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Build the pattern to search for: "20.03-20250423-"
  const pattern = `${categoryNumber}-${dateStr}-%`;

  const tableToQuery = table === "notebook" ? notebookEntries : lexiconEntries;

  const existingIds = await db
    .select({ zettelkastenId: tableToQuery.zettelkastenId })
    .from(tableToQuery)
    .where(
      and(
        eq(tableToQuery.userId, userId),
        like(tableToQuery.zettelkastenId, pattern)
      )
    );

  // Extract sequence numbers from existing IDs
  const sequenceNumbers = existingIds
    .map((row) => {
      if (!row.zettelkastenId) return 0;
      // Extract the sequence number from "20.03-20250423-001"
      const match = row.zettelkastenId.match(/-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  // Get the maximum sequence number and increment
  const maxSeq = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0;
  return maxSeq + 1;
}

/**
 * Generate a Zettelkasten ID for a notebook entry
 */
export async function generateNotebookZettelkastenId(
  userId: number,
  categoryNumber: string
): Promise<string> {
  const dateStr = formatDateForId();
  const seq = await getNextSequenceNumber(userId, categoryNumber, dateStr, "notebook");
  const seqStr = String(seq).padStart(3, "0");
  return `${categoryNumber}-${dateStr}-${seqStr}`;
}

/**
 * Generate a Zettelkasten ID for a lexicon entry
 */
export async function generateLexiconZettelkastenId(
  userId: number,
  categoryNumber: string
): Promise<string> {
  const dateStr = formatDateForId();
  const seq = await getNextSequenceNumber(userId, categoryNumber, dateStr, "lexicon");
  const seqStr = String(seq).padStart(3, "0");
  return `${categoryNumber}-${dateStr}-${seqStr}`;
}

/**
 * Parse a Zettelkasten ID to extract components
 */
export function parseZettelkastenId(id: string): {
  categoryNumber: string;
  date: string;
  sequence: number;
  branch?: string;
} | null {
  // Pattern: "20.03-20250423-001" or "20.03-20250423-001/a"
  const match = id.match(/^([0-9]{2}\.[0-9]{2})-(\d{8})-(\d{3})(?:\/(.+))?$/);
  if (!match) return null;

  return {
    categoryNumber: match[1],
    date: match[2],
    sequence: parseInt(match[3], 10),
    branch: match[4],
  };
}

/**
 * Validate a Zettelkasten ID format
 */
export function isValidZettelkastenId(id: string): boolean {
  return parseZettelkastenId(id) !== null;
}

/**
 * Create a branched Zettelkasten ID from an existing ID
 */
export function createBranchedId(baseId: string, branchSuffix: string): string {
  const parsed = parseZettelkastenId(baseId);
  if (!parsed) throw new Error("Invalid base Zettelkasten ID");

  // Remove existing branch if present
  const cleanId = `${parsed.categoryNumber}-${parsed.date}-${String(parsed.sequence).padStart(3, "0")}`;
  return `${cleanId}/${branchSuffix}`;
}

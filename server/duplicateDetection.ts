/**
 * Duplicate Detection System for Bulk Import
 * 
 * Provides similarity matching and duplicate detection for:
 * - Notebook entries (quotes, passages, notes)
 * - Lexicon entries (vocabulary terms, definitions)
 */

/**
 * Calculate Levenshtein distance between two strings
 * Lower distance = more similar
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = Array(len2 + 1)
    .fill(null)
    .map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[len2][len1];
}

/**
 * Calculate similarity score (0-1) between two strings
 * 1 = identical, 0 = completely different
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  return 1 - distance / maxLength;
}

/**
 * Normalize text for comparison (remove punctuation, extra spaces, etc.)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
}

/**
 * Calculate semantic similarity using word overlap
 * Useful for longer texts like quotes and definitions
 */
export function calculateWordOverlapSimilarity(str1: string, str2: string): number {
  const words1 = new Set(normalizeText(str1).split(/\s+/));
  const words2 = new Set(normalizeText(str2).split(/\s+/));

  if (words1.size === 0 || words2.size === 0) return 0;

  const arr1 = Array.from(words1);
  const arr2 = Array.from(words2);
  const intersection = new Set(arr1.filter((x) => words2.has(x)));
  const union = new Set(arr1.concat(arr2));

  return intersection.size / union.size; // Jaccard similarity
}

/**
 * Combine multiple similarity metrics for comprehensive matching
 */
export function calculateCombinedSimilarity(
  str1: string,
  str2: string,
  weights = { levenshtein: 0.4, wordOverlap: 0.6 }
): number {
  const lev = calculateSimilarity(str1, str2);
  const overlap = calculateWordOverlapSimilarity(str1, str2);

  return lev * weights.levenshtein + overlap * weights.wordOverlap;
}

/**
 * Detect potential duplicates in notebook entries
 */
export interface NotebookDuplicate {
  existingId: number;
  existingText: string;
  existingAuthor?: string;
  incomingText: string;
  incomingAuthor?: string;
  similarity: number;
  matchType: "text" | "author" | "combined";
}

export function detectNotebookDuplicates(
  incomingEntry: {
    text: string;
    author?: string;
  },
  existingEntries: Array<{
    id: number;
    text: string;
    author?: string;
  }>,
  thresholds = { text: 0.85, author: 0.9, combined: 0.8 }
): NotebookDuplicate[] {
  const duplicates: NotebookDuplicate[] = [];

  for (const existing of existingEntries) {
    // Check text similarity
    const textSimilarity = calculateCombinedSimilarity(incomingEntry.text, existing.text);

    if (textSimilarity >= thresholds.text) {
      duplicates.push({
        existingId: existing.id,
        existingText: existing.text,
        existingAuthor: existing.author,
        incomingText: incomingEntry.text,
        incomingAuthor: incomingEntry.author,
        similarity: textSimilarity,
        matchType: "text",
      });
      continue;
    }

    // Check author similarity if both have authors
    if (incomingEntry.author && existing.author) {
      const authorSimilarity = calculateSimilarity(incomingEntry.author, existing.author);

      if (authorSimilarity >= thresholds.author) {
        // Check if text is also similar enough
        if (textSimilarity >= thresholds.combined) {
          duplicates.push({
            existingId: existing.id,
            existingText: existing.text,
            existingAuthor: existing.author,
            incomingText: incomingEntry.text,
            incomingAuthor: incomingEntry.author,
            similarity: (textSimilarity + authorSimilarity) / 2,
            matchType: "combined",
          });
        }
      }
    }
  }

  // Sort by similarity (highest first)
  return duplicates.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Detect potential duplicates in lexicon entries
 */
export interface LexiconDuplicate {
  existingId: number;
  existingTerm: string;
  existingDefinition?: string;
  incomingTerm: string;
  incomingDefinition?: string;
  similarity: number;
  matchType: "term" | "definition" | "combined";
}

export function detectLexiconDuplicates(
  incomingEntry: {
    term: string;
    definition?: string;
  },
  existingEntries: Array<{
    id: number;
    term: string;
    definition?: string;
  }>,
  thresholds = { term: 0.9, definition: 0.8, combined: 0.85 }
): LexiconDuplicate[] {
  const duplicates: LexiconDuplicate[] = [];

  for (const existing of existingEntries) {
    // Check term similarity (higher threshold for terms)
    const termSimilarity = calculateSimilarity(incomingEntry.term, existing.term);

    if (termSimilarity >= thresholds.term) {
      duplicates.push({
        existingId: existing.id,
        existingTerm: existing.term,
        existingDefinition: existing.definition,
        incomingTerm: incomingEntry.term,
        incomingDefinition: incomingEntry.definition,
        similarity: termSimilarity,
        matchType: "term",
      });
      continue;
    }

    // Check definition similarity if both have definitions
    if (incomingEntry.definition && existing.definition) {
      const defSimilarity = calculateCombinedSimilarity(
        incomingEntry.definition,
        existing.definition
      );

      if (defSimilarity >= thresholds.definition) {
        // Check if terms are also similar
        if (termSimilarity >= thresholds.combined) {
          duplicates.push({
            existingId: existing.id,
            existingTerm: existing.term,
            existingDefinition: existing.definition,
            incomingTerm: incomingEntry.term,
            incomingDefinition: incomingEntry.definition,
            similarity: (termSimilarity + defSimilarity) / 2,
            matchType: "combined",
          });
        }
      }
    }
  }

  // Sort by similarity (highest first)
  return duplicates.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Merge strategies for duplicate entries
 */
export type MergeStrategy = "keep_existing" | "replace_with_incoming" | "merge_fields";

export interface MergeResult {
  strategy: MergeStrategy;
  mergedEntry: Record<string, any>;
  fieldsUpdated: string[];
}

/**
 * Merge two notebook entries
 */
export function mergeNotebookEntries(
  existing: Record<string, any>,
  incoming: Record<string, any>,
  strategy: MergeStrategy = "merge_fields"
): MergeResult {
  const fieldsUpdated: string[] = [];
  let mergedEntry = { ...existing };

  if (strategy === "keep_existing") {
    // Keep existing entry as-is
    return { strategy, mergedEntry, fieldsUpdated };
  }

  if (strategy === "replace_with_incoming") {
    // Replace with incoming entry
    mergedEntry = { ...incoming };
    fieldsUpdated.push("all");
    return { strategy, mergedEntry, fieldsUpdated };
  }

  // Merge strategy: combine fields intelligently
  if (strategy === "merge_fields") {
    // Keep existing text (primary identifier)
    // Update author if incoming is more complete
    if (incoming.author && !existing.author) {
      mergedEntry.author = incoming.author;
      fieldsUpdated.push("author");
    }

    // Update work if incoming is more complete
    if (incoming.work && !existing.work) {
      mergedEntry.work = incoming.work;
      fieldsUpdated.push("work");
    }

    // Merge tags (combine unique tags)
    if (incoming.tags || existing.tags) {
      const existingTags = new Set((existing.tags || "").split(",").filter(Boolean));
      const incomingTags = new Set((incoming.tags || "").split(",").filter(Boolean));
      const merged = Array.from(new Set(Array.from(existingTags).concat(Array.from(incomingTags))));
      if (merged.length > 0) {
        mergedEntry.tags = merged.join(",");
        if (mergedEntry.tags !== existing.tags) {
          fieldsUpdated.push("tags");
        }
      }
    }

    // Merge collections
    if (incoming.collections || existing.collections) {
      const existingColl = new Set((existing.collections || "").split(",").filter(Boolean));
      const incomingColl = new Set((incoming.collections || "").split(",").filter(Boolean));
      const merged = Array.from(new Set(Array.from(existingColl).concat(Array.from(incomingColl))));
      if (merged.length > 0) {
        mergedEntry.collections = merged.join(",");
        if (mergedEntry.collections !== existing.collections) {
          fieldsUpdated.push("collections");
        }
      }
    }

    // Append note if incoming has additional notes
    if (incoming.note && incoming.note !== existing.note) {
      mergedEntry.note = existing.note ? `${existing.note}\n---\n${incoming.note}` : incoming.note;
      fieldsUpdated.push("note");
    }

    // Mark as favorite if either is favorite
    if (incoming.favorite && !existing.favorite) {
      mergedEntry.favorite = true;
      fieldsUpdated.push("favorite");
    }
  }

  return { strategy, mergedEntry, fieldsUpdated };
}

/**
 * Merge two lexicon entries
 */
export function mergeLexiconEntries(
  existing: Record<string, any>,
  incoming: Record<string, any>,
  strategy: MergeStrategy = "merge_fields"
): MergeResult {
  const fieldsUpdated: string[] = [];
  let mergedEntry = { ...existing };

  if (strategy === "keep_existing") {
    return { strategy, mergedEntry, fieldsUpdated };
  }

  if (strategy === "replace_with_incoming") {
    mergedEntry = { ...incoming };
    fieldsUpdated.push("all");
    return { strategy, mergedEntry, fieldsUpdated };
  }

  // Merge strategy
  if (strategy === "merge_fields") {
    // Keep existing term (primary identifier)
    // Update definition if incoming is more complete
    if (incoming.definition && !existing.definition) {
      mergedEntry.definition = incoming.definition;
      fieldsUpdated.push("definition");
    }

    // Update etymology if incoming is more complete
    if (incoming.etymology && !existing.etymology) {
      mergedEntry.etymology = incoming.etymology;
      fieldsUpdated.push("etymology");
    }

    // Update origin if incoming is more complete
    if (incoming.origin && !existing.origin) {
      mergedEntry.origin = incoming.origin;
      fieldsUpdated.push("origin");
    }

    // Update part of speech if incoming is more complete
    if (incoming.partOfSpeech && !existing.partOfSpeech) {
      mergedEntry.partOfSpeech = incoming.partOfSpeech;
      fieldsUpdated.push("partOfSpeech");
    }

    // Merge notes
    if (incoming.notes && incoming.notes !== existing.notes) {
      mergedEntry.notes = existing.notes
        ? `${existing.notes}\n---\n${incoming.notes}`
        : incoming.notes;
      fieldsUpdated.push("notes");
    }

    // Update DIKW tier if incoming is more complete
    if (incoming.dikwTier && !existing.dikwTier) {
      mergedEntry.dikwTier = incoming.dikwTier;
      fieldsUpdated.push("dikwTier");
    }
  }

  return { strategy, mergedEntry, fieldsUpdated };
}

/**
 * Batch detect duplicates for multiple incoming entries
 */
export function batchDetectNotebookDuplicates(
  incomingEntries: Array<{ text: string; author?: string }>,
  existingEntries: Array<{ id: number; text: string; author?: string }>,
  thresholds?: { text: number; author: number; combined: number }
): Map<number, NotebookDuplicate[]> {
  const results = new Map<number, NotebookDuplicate[]>();

  incomingEntries.forEach((incoming, index) => {
    const duplicates = detectNotebookDuplicates(incoming, existingEntries, thresholds);
    if (duplicates.length > 0) {
      results.set(index, duplicates);
    }
  });

  return results;
}

/**
 * Batch detect duplicates for lexicon entries
 */
export function batchDetectLexiconDuplicates(
  incomingEntries: Array<{ term: string; definition?: string }>,
  existingEntries: Array<{ id: number; term: string; definition?: string }>,
  thresholds?: { term: number; definition: number; combined: number }
): Map<number, LexiconDuplicate[]> {
  const results = new Map<number, LexiconDuplicate[]>();

  incomingEntries.forEach((incoming, index) => {
    const duplicates = detectLexiconDuplicates(incoming, existingEntries, thresholds);
    if (duplicates.length > 0) {
      results.set(index, duplicates);
    }
  });

  return results;
}

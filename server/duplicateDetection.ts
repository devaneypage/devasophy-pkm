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

export type DedupModule = "commonplace" | "lexicon" | "book" | "document" | "idea";

export type DedupMatchBasis = "zettelkasten_id" | "uuid" | "title_author" | "title_body";

export interface DedupComparableRecord {
  dedupKey: string;
  module: DedupModule;
  id: number;
  label: string;
  title: string;
  body?: string;
  author?: string;
  uuid?: string;
  zettelkastenId?: string;
  entryType?: string;
  archivable: boolean;
  raw: Record<string, any>;
}

export interface DedupCandidatePair {
  leftKey: string;
  rightKey: string;
  similarity: number;
  basis: DedupMatchBasis;
  sameModule: boolean;
  allowedActions: Array<"merge" | "archive" | "delete">;
}

export interface DedupGroup {
  id: string;
  records: DedupComparableRecord[];
  candidatePairs: DedupCandidatePair[];
  sameModule: boolean;
  allowedActions: Array<"merge" | "archive" | "delete">;
  suggestedCanonicalKey: string;
  confidence: number;
  bases: DedupMatchBasis[];
}

function normalizeOptionalValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function extractComparableText(value: unknown): string {
  if (value == null) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => extractComparableText(item))
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const orderedKeys = [
      "markdown",
      "text",
      "definition",
      "abstract",
      "notes",
      "note",
      "summary",
      "url",
      "label",
      "source",
      "publication",
      "context",
      "status",
      "aliases",
      "reference",
      "author",
      "location",
      "etymology",
      "items",
    ];

    const preferred = orderedKeys
      .flatMap((key) => (key in record ? [record[key]] : []))
      .map((item) => extractComparableText(item))
      .filter(Boolean);

    if (preferred.length > 0) {
      return preferred.join(" ").trim();
    }

    return Object.values(record)
      .map((item) => extractComparableText(item))
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  return String(value).trim();
}

function stringifyRecordRecord(record: DedupComparableRecord): string {
  return [record.title, record.body ?? "", record.author ?? "", record.zettelkastenId ?? "", record.uuid ?? ""]
    .filter(Boolean)
    .join(" ");
}

function deriveCanonicalKey(records: DedupComparableRecord[]): string {
  const scored = [...records].sort((left, right) => {
    const leftScore = stringifyRecordRecord(left).length;
    const rightScore = stringifyRecordRecord(right).length;
    return rightScore - leftScore;
  });

  return scored[0]?.dedupKey ?? "";
}

function deriveAllowedActions(records: DedupComparableRecord[]): Array<"merge" | "archive" | "delete"> {
  const sameModule = new Set(records.map((record) => record.module)).size === 1;
  if (sameModule) {
    return ["merge", "archive", "delete"];
  }
  return ["archive", "delete"];
}

function compareTitleAndAuthor(left: DedupComparableRecord, right: DedupComparableRecord) {
  const leftTitle = normalizeOptionalValue(left.title);
  const rightTitle = normalizeOptionalValue(right.title);
  const leftAuthor = normalizeOptionalValue(left.author);
  const rightAuthor = normalizeOptionalValue(right.author);

  if (!leftTitle || !rightTitle || !leftAuthor || !rightAuthor) {
    return null;
  }

  const titleSimilarity = calculateCombinedSimilarity(leftTitle, rightTitle, {
    levenshtein: 0.55,
    wordOverlap: 0.45,
  });
  const authorSimilarity = calculateSimilarity(leftAuthor, rightAuthor);

  if (titleSimilarity >= 0.92 && authorSimilarity >= 0.88) {
    return {
      basis: "title_author" as const,
      similarity: (titleSimilarity * 0.6) + (authorSimilarity * 0.4),
    };
  }

  return null;
}

function compareTitleAndBody(left: DedupComparableRecord, right: DedupComparableRecord) {
  const leftTitle = normalizeOptionalValue(left.title);
  const rightTitle = normalizeOptionalValue(right.title);
  const leftBody = normalizeOptionalValue(left.body);
  const rightBody = normalizeOptionalValue(right.body);

  if (!leftTitle || !rightTitle || !leftBody || !rightBody) {
    return null;
  }

  const titleSimilarity = calculateCombinedSimilarity(leftTitle, rightTitle, {
    levenshtein: 0.65,
    wordOverlap: 0.35,
  });
  const bodySimilarity = calculateCombinedSimilarity(leftBody, rightBody, {
    levenshtein: 0.35,
    wordOverlap: 0.65,
  });

  if (titleSimilarity >= 0.88 && bodySimilarity >= 0.72) {
    return {
      basis: "title_body" as const,
      similarity: (titleSimilarity * 0.45) + (bodySimilarity * 0.55),
    };
  }

  return null;
}

export function compareDedupRecords(left: DedupComparableRecord, right: DedupComparableRecord): DedupCandidatePair | null {
  if (left.dedupKey === right.dedupKey) {
    return null;
  }

  const sameModule = left.module === right.module;
  const allowedActions = sameModule ? ["merge", "archive", "delete"] as Array<"merge" | "archive" | "delete"> : ["archive", "delete"] as Array<"merge" | "archive" | "delete">;

  if (left.zettelkastenId && right.zettelkastenId && normalizeText(left.zettelkastenId) === normalizeText(right.zettelkastenId)) {
    return {
      leftKey: left.dedupKey,
      rightKey: right.dedupKey,
      similarity: 1,
      basis: "zettelkasten_id",
      sameModule,
      allowedActions,
    };
  }

  if (left.uuid && right.uuid && sameModule && normalizeText(left.uuid) === normalizeText(right.uuid)) {
    return {
      leftKey: left.dedupKey,
      rightKey: right.dedupKey,
      similarity: 1,
      basis: "uuid",
      sameModule,
      allowedActions,
    };
  }

  const authorMatch = compareTitleAndAuthor(left, right);
  if (authorMatch) {
    return {
      leftKey: left.dedupKey,
      rightKey: right.dedupKey,
      similarity: authorMatch.similarity,
      basis: authorMatch.basis,
      sameModule,
      allowedActions,
    };
  }

  const bodyMatch = compareTitleAndBody(left, right);
  if (bodyMatch) {
    return {
      leftKey: left.dedupKey,
      rightKey: right.dedupKey,
      similarity: bodyMatch.similarity,
      basis: bodyMatch.basis,
      sameModule,
      allowedActions,
    };
  }

  return null;
}

function buildComponents(records: DedupComparableRecord[], pairs: DedupCandidatePair[]) {
  const adjacency = new Map<string, Set<string>>();

  records.forEach((record) => {
    adjacency.set(record.dedupKey, new Set());
  });

  pairs.forEach((pair) => {
    adjacency.get(pair.leftKey)?.add(pair.rightKey);
    adjacency.get(pair.rightKey)?.add(pair.leftKey);
  });

  const visited = new Set<string>();
  const groups: string[][] = [];

  for (const record of records) {
    if (visited.has(record.dedupKey)) continue;
    const neighbors = adjacency.get(record.dedupKey);
    if (!neighbors || neighbors.size === 0) continue;

    const stack = [record.dedupKey];
    const component: string[] = [];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || visited.has(current)) continue;
      visited.add(current);
      component.push(current);

      adjacency.get(current)?.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      });
    }

    if (component.length > 1) {
      groups.push(component);
    }
  }

  return groups;
}

const DEDUP_SORTED_NEIGHBORHOOD_WINDOW = 24;

function addExactBucketPairs(
  records: DedupComparableRecord[],
  candidatePairKeys: Set<string>,
  getValue: (record: DedupComparableRecord) => string | undefined
) {
  const buckets = new Map<string, number[]>();

  records.forEach((record, index) => {
    const value = getValue(record);
    if (!value) return;
    const normalized = normalizeText(value);
    if (!normalized) return;
    const bucket = buckets.get(normalized) ?? [];
    bucket.push(index);
    buckets.set(normalized, bucket);
  });

  buckets.forEach((indices) => {
    for (let left = 0; left < indices.length; left += 1) {
      for (let right = left + 1; right < indices.length; right += 1) {
        candidatePairKeys.add(`${indices[left]}:${indices[right]}`);
      }
    }
  });
}

function addSortedNeighborhoodPairs(
  records: DedupComparableRecord[],
  candidatePairKeys: Set<string>,
  getSortValue: (record: DedupComparableRecord) => string
) {
  const orderedIndices = records
    .map((record, index) => ({ index, value: getSortValue(record) }))
    .filter((item) => item.value.length > 0)
    .sort((left, right) => left.value.localeCompare(right.value))
    .map((item) => item.index);

  for (let position = 0; position < orderedIndices.length; position += 1) {
    const boundary = Math.min(
      orderedIndices.length,
      position + DEDUP_SORTED_NEIGHBORHOOD_WINDOW + 1
    );

    for (let neighbor = position + 1; neighbor < boundary; neighbor += 1) {
      const leftIndex = Math.min(orderedIndices[position], orderedIndices[neighbor]);
      const rightIndex = Math.max(orderedIndices[position], orderedIndices[neighbor]);
      candidatePairKeys.add(`${leftIndex}:${rightIndex}`);
    }
  }
}

function buildDedupCandidatePairKeys(records: DedupComparableRecord[]) {
  const candidatePairKeys = new Set<string>();

  // Exact durable identifiers must always be compared, regardless of title proximity.
  addExactBucketPairs(records, candidatePairKeys, (record) => record.zettelkastenId);
  addExactBucketPairs(
    records,
    candidatePairKeys,
    (record) => (record.uuid ? `${record.module}:${record.uuid}` : undefined)
  );

  // High-threshold fuzzy title matches are lexically close. Two complementary
  // sort keys retain reordered-word matches without evaluating every possible pair.
  addSortedNeighborhoodPairs(records, candidatePairKeys, (record) => normalizeText(record.title));
  addSortedNeighborhoodPairs(records, candidatePairKeys, (record) =>
    normalizeText(record.title).split(" ").filter(Boolean).sort().join(" ")
  );

  return candidatePairKeys;
}

export function groupDedupComparableRecords(records: DedupComparableRecord[]): DedupGroup[] {
  const pairs: DedupCandidatePair[] = [];

  for (const candidatePairKey of Array.from(buildDedupCandidatePairKeys(records))) {
    const [leftIndex, rightIndex] = candidatePairKey.split(":").map(Number);
    const match = compareDedupRecords(records[leftIndex], records[rightIndex]);
    if (match) {
      pairs.push(match);
    }
  }

  const recordsByKey = new Map(records.map((record) => [record.dedupKey, record]));

  return buildComponents(records, pairs).map((keys, index) => {
    const groupRecords = keys
      .map((key) => recordsByKey.get(key))
      .filter((record): record is DedupComparableRecord => Boolean(record));
    const groupPairs = pairs.filter((pair) => keys.includes(pair.leftKey) && keys.includes(pair.rightKey));
    const confidence = groupPairs.length > 0
      ? groupPairs.reduce((sum, pair) => sum + pair.similarity, 0) / groupPairs.length
      : 0;
    const bases = Array.from(new Set(groupPairs.map((pair) => pair.basis)));

    return {
      id: `dedup-group-${index + 1}`,
      records: groupRecords,
      candidatePairs: groupPairs,
      sameModule: new Set(groupRecords.map((record) => record.module)).size === 1,
      allowedActions: deriveAllowedActions(groupRecords),
      suggestedCanonicalKey: deriveCanonicalKey(groupRecords),
      confidence,
      bases,
    };
  }).sort((left, right) => right.confidence - left.confidence);
}

export function normalizeCommonplaceRecord(entry: Record<string, any>): DedupComparableRecord {
  const metadata = entry.metadata && typeof entry.metadata === "object" ? entry.metadata as Record<string, unknown> : {};
  const zettelkastenId = normalizeOptionalValue(metadata.zettelkastenId ?? metadata.zettelId ?? metadata.zettelkasten_id);
  const author = normalizeOptionalValue(metadata.author);

  return {
    dedupKey: `commonplace:${entry.id}`,
    module: "commonplace",
    id: entry.id,
    label: entry.title,
    title: entry.title,
    body: extractComparableText(entry.content ?? entry.summary ?? metadata),
    author,
    zettelkastenId,
    entryType: typeof entry.entryType === "string" ? entry.entryType : undefined,
    archivable: true,
    raw: entry,
  };
}

export function normalizeLexiconRecord(entry: Record<string, any>): DedupComparableRecord {
  return {
    dedupKey: `lexicon:${entry.id}`,
    module: "lexicon",
    id: entry.id,
    label: entry.term,
    title: entry.term,
    body: extractComparableText(entry.definition),
    zettelkastenId: normalizeOptionalValue(entry.zettelkastenId),
    archivable: false,
    raw: entry,
  };
}

export function normalizeBookRecord(entry: Record<string, any>): DedupComparableRecord {
  return {
    dedupKey: `book:${entry.id}`,
    module: "book",
    id: entry.id,
    label: entry.title,
    title: entry.title,
    author: normalizeOptionalValue(entry.author),
    body: extractComparableText(entry.notes),
    archivable: true,
    raw: entry,
  };
}

export function normalizeDocumentRecord(entry: Record<string, any>): DedupComparableRecord {
  return {
    dedupKey: `document:${entry.id}`,
    module: "document",
    id: entry.id,
    label: entry.title,
    title: entry.title,
    body: extractComparableText(entry.content),
    uuid: normalizeOptionalValue(entry.uuid),
    archivable: true,
    raw: entry,
  };
}

export function normalizeIdeaRecord(entry: Record<string, any>): DedupComparableRecord {
  return {
    dedupKey: `idea:${entry.id}`,
    module: "idea",
    id: entry.id,
    label: entry.title,
    title: entry.title,
    body: extractComparableText(entry.summary),
    uuid: normalizeOptionalValue(entry.uuid),
    zettelkastenId: normalizeOptionalValue(entry.zettelkastenId),
    archivable: true,
    raw: entry,
  };
}

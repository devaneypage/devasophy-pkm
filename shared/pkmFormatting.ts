import { getJohnnyDecimalSeedByCategoryNumber, johnnyDecimalModuleDefaults } from "./johnnyDecimal";

export type NormalizedLexiconImport = {
  term: string;
  partOfSpeech?: string;
  definition?: string;
  etymology?: string;
  origin?: string;
  sourceType?: string;
  imageNum?: string;
  notes?: string;
};

export type NormalizedNotebookImport = {
  text: string;
  author?: string;
  work?: string;
  sourceType?: string;
  location?: string;
  note?: string;
  tags?: string;
  collections?: string;
  favorite?: boolean;
};

export type ClavisAureaPayload = {
  meta?: {
    total_entries?: number;
    [key: string]: unknown;
  };
  entries?: unknown[];
};

const QUOTE_CATEGORY_RULES: Array<{ label: string; keywords: string[] }> = [
  {
    label: "Knowledge & Learning",
    keywords: ["knowledge", "learn", "learning", "study", "wisdom", "understand", "understanding", "truth", "insight"],
  },
  {
    label: "Writing & Expression",
    keywords: ["write", "writing", "word", "words", "language", "sentence", "essay", "draft", "poem", "poetry", "style"],
  },
  {
    label: "Books & Reading",
    keywords: ["book", "books", "reading", "read", "reader", "library", "literature", "novel", "author", "page"],
  },
  {
    label: "Research & Inquiry",
    keywords: ["research", "question", "questions", "inquiry", "investigate", "evidence", "argument", "analysis", "analyze"],
  },
  {
    label: "Philosophy & Ethics",
    keywords: ["philosophy", "ethical", "ethics", "moral", "virtue", "good", "soul", "justice", "meaning", "being"],
  },
  {
    label: "Law & Reasoning",
    keywords: ["law", "legal", "court", "judge", "reason", "reasoning", "logic", "rights", "argument", "case"],
  },
  {
    label: "Memory & Reflection",
    keywords: ["memory", "remember", "reflection", "reflect", "journal", "habit", "self", "attention", "mind"],
  },
];

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  return undefined;
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (!value) continue;
    const normalized = value.trim();
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function splitCommaList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function inferQuoteCategories(input: {
  text: string;
  note?: string;
  author?: string;
  work?: string;
}): string[] {
  const corpus = [input.text, input.note, input.author, input.work]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matched = QUOTE_CATEGORY_RULES.filter((rule) =>
    rule.keywords.some((keyword) => corpus.includes(keyword))
  ).map((rule) => rule.label);

  if (matched.length > 0) {
    return matched.slice(0, 3);
  }

  return ["General Reflections"];
}

export function enrichNotebookImportWithCategories(input: NormalizedNotebookImport): NormalizedNotebookImport {
  const inferredCategories = inferQuoteCategories({
    text: input.text,
    note: input.note,
    author: input.author,
    work: input.work,
  });

  const mergedTags = uniqueStrings([...splitCommaList(input.tags), ...inferredCategories]);
  const mergedCollections = uniqueStrings([...splitCommaList(input.collections), inferredCategories[0]]);

  return {
    ...input,
    tags: mergedTags.length > 0 ? mergedTags.join(", ") : undefined,
    collections: mergedCollections.length > 0 ? mergedCollections.join(", ") : undefined,
  };
}

export function extractClavisAureaEntries(input: unknown): unknown[] {
  if (Array.isArray(input)) return input;

  const record = asRecord(input);
  if (!record) return [];

  if (Array.isArray(record.entries)) return record.entries;
  if (Array.isArray(record.data)) return record.data;

  return [];
}

export function validateClavisAureaPayload(input: unknown): {
  isValid: boolean;
  totalEntries: number;
  declaredTotal?: number;
} {
  const record = asRecord(input);
  const entries = extractClavisAureaEntries(input);
  const declaredTotal = record?.meta && asRecord(record.meta)
    ? Number(asRecord(record.meta)?.total_entries ?? NaN)
    : undefined;

  return {
    isValid: entries.length > 0,
    totalEntries: entries.length,
    declaredTotal: Number.isFinite(declaredTotal) ? declaredTotal : undefined,
  };
}

export function detectImportPayloadType(input: unknown): "quotes" | "lexicon" | null {
  const record = asRecord(input);
  const wrappedLexicon = record && Array.isArray(record.entries);
  const items = Array.isArray(input)
    ? input
    : wrappedLexicon
      ? extractClavisAureaEntries(input)
      : [input];

  const hasQuoteLikeShape = items.some((item) => {
    const entry = asRecord(item);
    if (!entry) return false;
    return typeof entry.text === "string" || typeof entry.quote === "string";
  });

  if (hasQuoteLikeShape) {
    return "quotes";
  }

  const hasLexiconLikeShape = items.some((item) => {
    const entry = asRecord(item);
    if (!entry) return false;
    return typeof entry.term === "string" || typeof entry.word === "string";
  });

  if (wrappedLexicon || hasLexiconLikeShape) {
    return "lexicon";
  }

  return null;
}

export function normalizeLexiconImportItem(input: unknown): NormalizedLexiconImport | null {
  const record = asRecord(input);
  if (!record) return null;

  const term = asString(record.term) ?? asString(record.word);
  if (!term) return null;

  return {
    term,
    partOfSpeech: asString(record.partOfSpeech) ?? asString(record.part_of_speech) ?? asString(record.pos),
    definition: asString(record.definition) ?? asString(record.meaning),
    etymology: asString(record.etymology),
    origin: asString(record.origin),
    sourceType: asString(record.sourceType) ?? asString(record.source_type),
    imageNum: asString(record.imageNum) ?? asString(record.image_num),
    notes: asString(record.notes),
  };
}

export function normalizeNotebookImportItem(input: unknown): NormalizedNotebookImport | null {
  const record = asRecord(input);
  if (!record) return null;

  const sourceRecord = asRecord(record.source);
  const text = asString(record.text) ?? asString(record.quote);
  if (!text) return null;

  const tagsValue = record.tags;
  const tags = Array.isArray(tagsValue)
    ? tagsValue.map((tag) => asString(tag)).filter(Boolean).join(",")
    : asString(tagsValue);

  return enrichNotebookImportWithCategories({
    text,
    author: asString(record.author) ?? asString(record.authors) ?? asString(record.by) ?? asString(sourceRecord?.authors),
    work: asString(record.work) ?? asString(record.source) ?? asString(sourceRecord?.title),
    sourceType: asString(record.sourceType) ?? asString(sourceRecord?.sourceType) ?? asString(sourceRecord?.format),
    location: asString(record.location) ?? asString(record.page),
    note: asString(record.note) ?? asString(record.notes),
    tags,
    collections: asString(record.collection) ?? asString(record.collections),
    favorite: asBoolean(record.favorite),
  });
}

export function normalizeNotebookImportPayload(input: unknown): NormalizedNotebookImport[] {
  const items = Array.isArray(input) ? input : [input];
  return items
    .map((item) => normalizeNotebookImportItem(item))
    .filter((item): item is NormalizedNotebookImport => item !== null);
}

export function normalizeLexiconImportPayload(input: unknown): NormalizedLexiconImport[] {
  const items = extractClavisAureaEntries(input);
  const source = items.length > 0 ? items : Array.isArray(input) ? input : [input];

  return source
    .map((item) => normalizeLexiconImportItem(item))
    .filter((item): item is NormalizedLexiconImport => item !== null);
}

export function inferCsvColumnMapping(
  headerRow: string[],
  importType: "quotes" | "lexicon"
): Record<string, number> {
  const normalizedHeaders = headerRow.map((value) => value.trim().toLowerCase().replace(/^"|"$/g, ""));
  const synonymMap: Record<string, string[]> = importType === "quotes"
    ? {
        text: ["text", "quote", "quotation", "content"],
        author: ["author", "authors", "by"],
        work: ["work", "source", "title"],
        sourceType: ["sourcetype", "source_type", "format"],
        location: ["location", "page"],
        note: ["note", "notes"],
        tags: ["tags"],
        collections: ["collections", "collection"],
        favorite: ["favorite"],
      }
    : {
        term: ["term", "word"],
        partOfSpeech: ["partofspeech", "part_of_speech", "pos"],
        definition: ["definition", "meaning"],
        etymology: ["etymology"],
        origin: ["origin"],
        sourceType: ["sourcetype", "source_type", "format"],
        imageNum: ["imagenum", "image_num"],
        notes: ["notes", "note"],
        dikwTier: ["dikwtier", "dikw_tier"],
      };

  const mapping: Record<string, number> = {};

  for (const [field, synonyms] of Object.entries(synonymMap)) {
    const index = normalizedHeaders.findIndex((header) => synonyms.includes(header));
    if (index >= 0) {
      mapping[field] = index;
    }
  }

  return mapping;
}

export type PreImportValidationIssue = {
  severity: "error" | "warning";
  rowLabel: string;
  message: string;
  preview?: string;
};

export type PreImportTaxonomySuggestion = {
  rowLabel: string;
  preview: string;
  categoryNumber: string;
  categoryName: string;
  reason: string;
  confidence: "high" | "medium";
};

export type PreImportTaxonomyGroup = {
  categoryNumber: string;
  categoryName: string;
  count: number;
};

export type PreImportSummary = {
  importType: "quotes" | "lexicon";
  fileFormat: "json" | "csv" | "text";
  totalInputRows: number;
  candidateRows: number;
  validEntries: number;
  invalidEntries: number;
  warningCount: number;
  duplicateCandidateCount: number;
  inferredMapping: Record<string, number>;
  detectedSource: string;
  samplePreviews: string[];
  taxonomySuggestionCount: number;
  taxonomySuggestions: PreImportTaxonomySuggestion[];
  taxonomyGroups: PreImportTaxonomyGroup[];
  issues: PreImportValidationIssue[];
};

function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentValue.trim());
      currentValue = "";
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      currentRow.push(currentValue.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function buildCsvRecords(
  rows: string[][],
  importType: "quotes" | "lexicon",
  providedMapping: Record<string, number>,
  skipHeader: boolean
): { records: Record<string, string>[]; mapping: Record<string, number>; totalRows: number } {
  if (rows.length === 0) {
    return { records: [], mapping: {}, totalRows: 0 };
  }

  const headerRow = rows[0];
  const mapping = Object.keys(providedMapping).length > 0
    ? providedMapping
    : inferCsvColumnMapping(headerRow, importType);
  const startIndex = skipHeader ? 1 : 0;
  const records = rows.slice(startIndex).map((row) => {
    const record: Record<string, string> = {};
    for (const [field, columnIndex] of Object.entries(mapping)) {
      record[field] = row[columnIndex] ?? "";
    }
    return record;
  });

  return {
    records,
    mapping,
    totalRows: rows.length,
  };
}

function buildTextRecords(input: string, importType: "quotes" | "lexicon"): Record<string, string>[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (importType === "quotes"
      ? ({ text: line } as Record<string, string>)
      : ({ term: line } as Record<string, string>)));
}

function countIncomingDuplicates(
  entries: Array<NormalizedNotebookImport | NormalizedLexiconImport>,
  importType: "quotes" | "lexicon"
): number {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  entries.forEach((entry) => {
    const key = importType === "quotes"
      ? `${(entry as NormalizedNotebookImport).text.trim().toLowerCase()}::${((entry as NormalizedNotebookImport).author ?? "").trim().toLowerCase()}`
      : `${(entry as NormalizedLexiconImport).term.trim().toLowerCase()}::${((entry as NormalizedLexiconImport).definition ?? "").trim().toLowerCase()}`;

    if (seen.has(key)) {
      duplicates.add(key);
    } else {
      seen.add(key);
    }
  });

  return duplicates.size;
}

function resolveTaxonomyCategoryName(categoryNumber: string): string {
  return getJohnnyDecimalSeedByCategoryNumber(categoryNumber)?.categoryName ?? categoryNumber;
}

function buildNotebookTaxonomySuggestion(entry: NormalizedNotebookImport): Omit<PreImportTaxonomySuggestion, "rowLabel" | "preview"> {
  const corpus = [entry.text, entry.note, entry.author, entry.work, entry.sourceType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (["insight", "synthesis", "framework", "realization", "discovery", "argument", "thesis"].some((keyword) => corpus.includes(keyword))) {
    return {
      categoryNumber: "44.03",
      categoryName: resolveTaxonomyCategoryName("44.03"),
      reason: "Matched synthesis and insight language in the imported note.",
      confidence: "high",
    };
  }

  if (["observation", "general note", "reflection", "research fragment", "annotation"].some((keyword) => corpus.includes(keyword))) {
    return {
      categoryNumber: johnnyDecimalModuleDefaults.notebookNote,
      categoryName: resolveTaxonomyCategoryName(johnnyDecimalModuleDefaults.notebookNote),
      reason: "Matched note-like and observational language in the imported entry.",
      confidence: "high",
    };
  }

  return {
    categoryNumber: johnnyDecimalModuleDefaults.notebookQuote,
    categoryName: resolveTaxonomyCategoryName(johnnyDecimalModuleDefaults.notebookQuote),
    reason: "Defaulted to the quotation lane for notebook imports without stronger note or synthesis cues.",
    confidence: corpus.includes("quote") || corpus.includes("excerpt") || corpus.includes("passage") ? "high" : "medium",
  };
}

function buildLexiconTaxonomySuggestion(entry: NormalizedLexiconImport): Omit<PreImportTaxonomySuggestion, "rowLabel" | "preview"> {
  const corpus = [entry.term, entry.definition, entry.etymology, entry.origin, entry.notes, entry.sourceType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const firstLetter = entry.term.trim().charAt(0).toUpperCase();
  const generalVocabularyCategory = firstLetter >= "N" ? "10.02" : johnnyDecimalModuleDefaults.lexiconGeneral;

  if (corpus.includes("latin")) {
    return {
      categoryNumber: "14.01",
      categoryName: resolveTaxonomyCategoryName("14.01"),
      reason: "Matched Latin-language cues in the imported lexicon entry.",
      confidence: "high",
    };
  }

  if (corpus.includes("french")) {
    return {
      categoryNumber: "14.02",
      categoryName: resolveTaxonomyCategoryName("14.02"),
      reason: "Matched French-language cues in the imported lexicon entry.",
      confidence: "high",
    };
  }

  if (["etymology", "origin", "root", "proto", "derived from"].some((keyword) => corpus.includes(keyword))) {
    return {
      categoryNumber: johnnyDecimalModuleDefaults.lexiconEtymology,
      categoryName: resolveTaxonomyCategoryName(johnnyDecimalModuleDefaults.lexiconEtymology),
      reason: "Matched etymology and origin language in the imported lexicon entry.",
      confidence: "high",
    };
  }

  if (["concordance", "reference", "index", "cross-reference", "see also"].some((keyword) => corpus.includes(keyword))) {
    return {
      categoryNumber: johnnyDecimalModuleDefaults.lexiconConcordance,
      categoryName: resolveTaxonomyCategoryName(johnnyDecimalModuleDefaults.lexiconConcordance),
      reason: "Matched concordance or reference cues in the imported lexicon entry.",
      confidence: "high",
    };
  }

  return {
    categoryNumber: generalVocabularyCategory,
    categoryName: resolveTaxonomyCategoryName(generalVocabularyCategory),
    reason: `Placed the term in the general vocabulary band for the ${firstLetter >= "N" ? "N–Z" : "A–M"} range.`,
    confidence: "medium",
  };
}

function buildTaxonomySuggestions(
  entries: Array<NormalizedNotebookImport | NormalizedLexiconImport>,
  importType: "quotes" | "lexicon"
): { suggestions: PreImportTaxonomySuggestion[]; groups: PreImportTaxonomyGroup[] } {
  const suggestions = entries.map((entry, index) => {
    const baseSuggestion = importType === "quotes"
      ? buildNotebookTaxonomySuggestion(entry as NormalizedNotebookImport)
      : buildLexiconTaxonomySuggestion(entry as NormalizedLexiconImport);

    const preview = importType === "quotes"
      ? (entry as NormalizedNotebookImport).text.slice(0, 96)
      : `${(entry as NormalizedLexiconImport).term}${(entry as NormalizedLexiconImport).definition ? ` — ${(entry as NormalizedLexiconImport).definition?.slice(0, 72)}` : ""}`;

    return {
      rowLabel: `Row ${index + 1}`,
      preview,
      ...baseSuggestion,
    };
  });

  const groups = Array.from(
    suggestions.reduce((map, suggestion) => {
      const key = suggestion.categoryNumber;
      const current = map.get(key);
      if (current) {
        current.count += 1;
      } else {
        map.set(key, {
          categoryNumber: suggestion.categoryNumber,
          categoryName: suggestion.categoryName,
          count: 1,
        });
      }
      return map;
    }, new Map<string, PreImportTaxonomyGroup>()).values()
  ).sort((a, b) => b.count - a.count || a.categoryNumber.localeCompare(b.categoryNumber));

  return { suggestions, groups };
}

export function analyzePreImportInput(input: {
  rawText: string;
  importType: "quotes" | "lexicon";
  fileFormat: "json" | "csv" | "text";
  columnMapping?: Record<string, number>;
  skipHeader?: boolean;
}): PreImportSummary {
  const issues: PreImportValidationIssue[] = [];
  const samplePreviews: string[] = [];
  let normalizedEntries: Array<NormalizedNotebookImport | NormalizedLexiconImport> = [];
  let candidateRows = 0;
  let totalInputRows = 0;
  let inferredMapping: Record<string, number> = input.columnMapping ?? {};
  let detectedSource = input.fileFormat.toUpperCase();

  if (!input.rawText.trim()) {
    return {
      importType: input.importType,
      fileFormat: input.fileFormat,
      totalInputRows: 0,
      candidateRows: 0,
      validEntries: 0,
      invalidEntries: 0,
      warningCount: 0,
      duplicateCandidateCount: 0,
      inferredMapping: {},
      detectedSource: detectedSource,
      samplePreviews: [],
      taxonomySuggestionCount: 0,
      taxonomySuggestions: [],
      taxonomyGroups: [],
      issues: [{ severity: "error", rowLabel: "Input", message: "No import data detected." }],
    };
  }

  try {
    if (input.fileFormat === "json") {
      const parsed = JSON.parse(input.rawText);
      const sourceEntries = input.importType === "lexicon"
        ? extractClavisAureaEntries(parsed).length > 0
          ? extractClavisAureaEntries(parsed)
          : Array.isArray(parsed)
            ? parsed
            : [parsed]
        : Array.isArray(parsed)
          ? parsed
          : [parsed];
      candidateRows = sourceEntries.length;
      totalInputRows = sourceEntries.length;
      normalizedEntries = input.importType === "quotes"
        ? normalizeNotebookImportPayload(parsed)
        : normalizeLexiconImportPayload(parsed);
      if (input.importType === "lexicon") {
        const validation = validateClavisAureaPayload(parsed);
        if (validation.declaredTotal !== undefined && validation.declaredTotal !== validation.totalEntries) {
          issues.push({
            severity: "warning",
            rowLabel: "Metadata",
            message: `Declared entry count is ${validation.declaredTotal}, but ${validation.totalEntries} entries were found.`,
          });
        }
        if (validation.isValid) {
          detectedSource = "JSON · Clavis Aurea wrapper";
        }
      }
    } else if (input.fileFormat === "csv") {
      const parsedRows = parseCsvRows(input.rawText);
      const csv = buildCsvRecords(parsedRows, input.importType, input.columnMapping ?? {}, input.skipHeader ?? true);
      inferredMapping = csv.mapping;
      totalInputRows = csv.totalRows;
      candidateRows = csv.records.length;
      normalizedEntries = input.importType === "quotes"
        ? csv.records.map((record) => normalizeNotebookImportItem(record)).filter((item): item is NormalizedNotebookImport => item !== null)
        : csv.records.map((record) => normalizeLexiconImportItem(record)).filter((item): item is NormalizedLexiconImport => item !== null);

      const requiredField = input.importType === "quotes" ? "text" : "term";
      if (inferredMapping[requiredField] === undefined) {
        issues.push({
          severity: "error",
          rowLabel: "Mapping",
          message: `Unable to infer the required '${requiredField}' column from the CSV header.`,
        });
      }
      detectedSource = "CSV";
    } else {
      const records = buildTextRecords(input.rawText, input.importType);
      totalInputRows = records.length;
      candidateRows = records.length;
      normalizedEntries = input.importType === "quotes"
        ? records.map((record) => normalizeNotebookImportItem(record)).filter((item): item is NormalizedNotebookImport => item !== null)
        : records.map((record) => normalizeLexiconImportItem(record)).filter((item): item is NormalizedLexiconImport => item !== null);
      detectedSource = "Plain text";
    }
  } catch (error) {
    issues.push({
      severity: "error",
      rowLabel: "Parsing",
      message: error instanceof Error ? error.message : "Unable to parse the import input.",
    });
  }

  const validEntries = normalizedEntries.length;
  const invalidEntries = Math.max(candidateRows - validEntries, 0);

  if (invalidEntries > 0) {
    issues.push({
      severity: "warning",
      rowLabel: "Validation",
      message: `${invalidEntries} row${invalidEntries === 1 ? " was" : "s were"} skipped because required fields were missing or malformed.`,
    });
  }

  const duplicateCandidateCount = countIncomingDuplicates(normalizedEntries, input.importType);
  if (duplicateCandidateCount > 0) {
    issues.push({
      severity: "warning",
      rowLabel: "Duplicates",
      message: `${duplicateCandidateCount} possible duplicate group${duplicateCandidateCount === 1 ? " was" : "s were"} detected within this import batch.`,
    });
  }

  normalizedEntries.slice(0, 3).forEach((entry, index) => {
    samplePreviews.push(
      input.importType === "quotes"
        ? `${index + 1}. ${(entry as NormalizedNotebookImport).text.slice(0, 96)}`
        : `${index + 1}. ${(entry as NormalizedLexiconImport).term}${(entry as NormalizedLexiconImport).definition ? ` — ${(entry as NormalizedLexiconImport).definition?.slice(0, 72)}` : ""}`
    );
  });

  const taxonomyReview = buildTaxonomySuggestions(normalizedEntries, input.importType);

  if (taxonomyReview.suggestions.length > 0) {
    issues.push({
      severity: "warning",
      rowLabel: "Taxonomy",
      message: `${taxonomyReview.suggestions.length} valid ${input.importType === "quotes" ? "notebook entries" : "lexicon entries"} now have suggested Johnny Decimal categories ready for review before import.`,
    });
  }

  if (validEntries > 0 && input.importType === "quotes") {
    const categoryEnriched = normalizedEntries.filter((entry) => Boolean((entry as NormalizedNotebookImport).collections));
    if (categoryEnriched.length === validEntries) {
      issues.push({
        severity: "warning",
        rowLabel: "Auto-categorization",
        message: "All valid quote entries will receive inferred tags and collections during import review.",
      });
    }
  }

  return {
    importType: input.importType,
    fileFormat: input.fileFormat,
    totalInputRows,
    candidateRows,
    validEntries,
    invalidEntries,
    warningCount: issues.filter((issue) => issue.severity === "warning").length,
    duplicateCandidateCount,
    inferredMapping,
    detectedSource,
    samplePreviews,
    taxonomySuggestionCount: taxonomyReview.suggestions.length,
    taxonomySuggestions: taxonomyReview.suggestions.slice(0, 5),
    taxonomyGroups: taxonomyReview.groups,
    issues,
  };
}

export function buildNotebookReferenceInsert(input: {
  text: string;
  author?: string | null;
  work?: string | null;
  note?: string | null;
}) {
  const credit = [input.author || "Unknown", input.work || ""].filter(Boolean).join(", ");
  return `> ${input.text}\n> — ${credit}\n\n${input.note ? `${input.note}\n\n` : ""}`;
}

export function buildLexiconReferenceInsert(input: {
  term: string;
  partOfSpeech?: string | null;
  definition?: string | null;
  notes?: string | null;
}) {
  return `**${input.term}** (${input.partOfSpeech || "term"}): ${input.definition || "No definition available."}\n\n${input.notes ? `${input.notes}\n\n` : ""}`;
}

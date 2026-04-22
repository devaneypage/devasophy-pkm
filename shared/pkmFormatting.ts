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

  const text = asString(record.text) ?? asString(record.quote);
  if (!text) return null;

  const tagsValue = record.tags;
  const tags = Array.isArray(tagsValue)
    ? tagsValue.map((tag) => asString(tag)).filter(Boolean).join(",")
    : asString(tagsValue);

  return {
    text,
    author: asString(record.author) ?? asString(record.by),
    work: asString(record.work) ?? asString(record.source),
    sourceType: asString(record.sourceType),
    location: asString(record.location) ?? asString(record.page),
    note: asString(record.note) ?? asString(record.notes),
    tags,
    collections: asString(record.collection) ?? asString(record.collections),
    favorite: asBoolean(record.favorite),
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

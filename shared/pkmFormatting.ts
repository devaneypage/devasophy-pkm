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

  const text = asString(record.text) ?? asString(record.quote);
  if (!text) return null;

  const tagsValue = record.tags;
  const tags = Array.isArray(tagsValue)
    ? tagsValue.map((tag) => asString(tag)).filter(Boolean).join(",")
    : asString(tagsValue);

  return enrichNotebookImportWithCategories({
    text,
    author: asString(record.author) ?? asString(record.by),
    work: asString(record.work) ?? asString(record.source),
    sourceType: asString(record.sourceType),
    location: asString(record.location) ?? asString(record.page),
    note: asString(record.note) ?? asString(record.notes),
    tags,
    collections: asString(record.collection) ?? asString(record.collections),
    favorite: asBoolean(record.favorite),
  });
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

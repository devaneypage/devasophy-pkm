import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  json,
  bigint,
  date,
  decimal,
  longtext,
  index,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  passwordHash: text("password_hash"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Johnny Decimal Taxonomy ─────────────────────────────
export const jdAreas = mysqlTable("jd_areas", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 10 }).notNull(), // "10", "20"
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }).default("#1f65d8"),
  sortOrder: int("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jdCategories = mysqlTable("jd_categories", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  areaId: bigint("area_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => jdAreas.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 10 }).notNull(), // "10.01", "30.17"
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: int("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Commonplace Entries ─────────────────────────────────
export const commonplaceEntries = mysqlTable(
  "commonplace_entries",
  {
    id: serial("id").primaryKey(),
    userId: bigint("user_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jdCategoryId: bigint("jd_category_id", {
      mode: "number",
      unsigned: true,
    }).references(() => jdCategories.id, { onDelete: "set null" }),
    title: varchar("title", { length: 500 }),
    content: longtext("content"),
    excerpt: text("excerpt"),
    dikwTier: mysqlEnum("dikw_tier", [
      "data",
      "information",
      "knowledge",
      "wisdom",
    ]).default("information"),
    entryType: mysqlEnum("entry_type", [
      "note",
      "quote",
      "bookmark",
      "idea",
      "book_ref",
      "article",
      "glossary_term",
      "list",
    ]).default("note"),
    tags: json("tags").$type<string[]>(),
    linkedEntryIds: json("linked_entry_ids").$type<number[]>(),
    zettelkastenId: varchar("zettelkasten_id", { length: 50 }),
    wordCount: int("word_count").default(0),
    charCount: int("char_count").default(0),
    status: mysqlEnum("status", ["active", "archived", "draft"]).default(
      "active"
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_cp_user").on(table.userId),
    index("idx_cp_dikw").on(table.dikwTier),
    index("idx_cp_type").on(table.entryType),
    index("idx_cp_status").on(table.status),
  ]
);

// ─── Quotations ──────────────────────────────────────────
export const quotations = mysqlTable(
  "quotations",
  {
    id: serial("id").primaryKey(),
    userId: bigint("user_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jdCategoryId: bigint("jd_category_id", {
      mode: "number",
      unsigned: true,
    }).references(() => jdCategories.id, { onDelete: "set null" }),
    quoteText: text("quote_text").notNull(),
    author: varchar("author", { length: 255 }),
    sourceWork: varchar("source_work", { length: 500 }),
    sourceDate: varchar("source_date", { length: 100 }),
    dikwTier: mysqlEnum("dikw_tier", [
      "data",
      "information",
      "knowledge",
      "wisdom",
    ]).default("wisdom"),
    tags: json("tags").$type<string[]>(),
    linkedEntryIds: json("linked_entry_ids").$type<number[]>(),
    lexiconWords: json("lexicon_words").$type<string[]>(),
    personalNote: text("personal_note"),
    zettelkastenId: varchar("zettelkasten_id", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_q_user").on(table.userId),
    index("idx_q_dikw").on(table.dikwTier),
    index("idx_q_author").on(table.author),
  ]
);

// ─── Lexicon Entries ─────────────────────────────────────
export const lexiconEntries = mysqlTable(
  "lexicon_entries",
  {
    id: serial("id").primaryKey(),
    userId: bigint("user_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    headword: varchar("headword", { length: 255 }).notNull(),
    pronunciation: varchar("pronunciation", { length: 255 }),
    language: varchar("language", { length: 100 }),
    partOfSpeech: varchar("part_of_speech", { length: 50 }),
    definitions: json("definitions").$type<
      { num: number; text: string }[]
    >(),
    etymology: text("etymology"),
    relatedWords: json("related_words").$type<string[]>(),
    tags: json("tags").$type<string[]>(),
    dikwTier: mysqlEnum("dikw_tier", [
      "data",
      "information",
      "knowledge",
      "wisdom",
    ]).default("knowledge"),
    zettelkastenId: varchar("zettelkasten_id", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_lex_user").on(table.userId),
    index("idx_lex_headword").on(table.headword),
  ]
);

// ─── Spaced Repetition Cards ─────────────────────────────
export const srCards = mysqlTable("sr_cards", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lexiconId: bigint("lexicon_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => lexiconEntries.id, { onDelete: "cascade" }),
  dueDate: date("due_date"),
  easeFactor: decimal("ease_factor", { precision: 3, scale: 2 }).default(
    "2.5"
  ),
  intervalDays: int("interval_days").default(0),
  repCount: int("rep_count").default(0),
  status: mysqlEnum("status", ["new", "learning", "review", "graduated"])
    .default("new"),
  lastResult: mysqlEnum("last_result", ["easy", "good", "hard", "again"]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Research Documents ──────────────────────────────────
export const researchDocuments = mysqlTable(
  "research_documents",
  {
    id: serial("id").primaryKey(),
    userId: bigint("user_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jdCategoryId: bigint("jd_category_id", {
      mode: "number",
      unsigned: true,
    }).references(() => jdCategories.id, { onDelete: "set null" }),
    title: varchar("title", { length: 500 }).notNull(),
    content: longtext("content"),
    status: mysqlEnum("status", [
      "planned",
      "draft",
      "in_progress",
      "completed",
    ]).default("draft"),
    wordCount: int("word_count").default(0),
    charCount: int("char_count").default(0),
    bibliography: json("bibliography").$type<
      { type: string; id: number; text: string }[]
    >(),
    dikwTier: mysqlEnum("dikw_tier", [
      "data",
      "information",
      "knowledge",
      "wisdom",
    ]).default("knowledge"),
    tags: json("tags").$type<string[]>(),
    linkedEntryIds: json("linked_entry_ids").$type<number[]>(),
    zettelkastenId: varchar("zettelkasten_id", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_doc_user").on(table.userId),
    index("idx_doc_status").on(table.status),
  ]
);

// ─── Cross-Module Links ──────────────────────────────────
export const entryLinks = mysqlTable(
  "entry_links",
  {
    id: serial("id").primaryKey(),
    userId: bigint("user_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceType: varchar("source_type", { length: 50 }).notNull(),
    sourceId: int("source_id").notNull(),
    targetType: varchar("target_type", { length: 50 }).notNull(),
    targetId: int("target_id").notNull(),
    linkType: mysqlEnum("link_type", [
      "references",
      "cites",
      "expands",
      "contradicts",
      "relates",
    ]).default("relates"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_link_unique").on(
      table.sourceType,
      table.sourceId,
      table.targetType,
      table.targetId
    ),
  ]
);

// ─── Activity Log ────────────────────────────────────────
export const activityLog = mysqlTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: int("entity_id").notNull(),
  entityTitle: varchar("entity_title", { length: 255 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

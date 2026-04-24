import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Johnny Decimal Taxonomy: Areas, Categories, and IDs
 * Structure: Area (10, 20, 30...) → Category (10.01, 10.02...) → ID (10.01-001, 10.01-002...)
 */
export const taxonomyAreas = mysqlTable("taxonomy_areas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  areaNumber: int("areaNumber").notNull(), // 10, 20, 30, etc.
  areaName: varchar("areaName", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const taxonomyCategories = mysqlTable("taxonomy_categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  areaId: int("areaId").notNull(),
  categoryNumber: varchar("categoryNumber", { length: 10 }).notNull(), // "10.01", "10.02", etc.
  categoryName: varchar("categoryName", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Module 1: Commonplace Notebook
 * Stores quotes, passages, observations with full source metadata
 */
export const notebookEntries = mysqlTable("notebook_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId"), // Johnny Decimal category
  uuid: varchar("uuid", { length: 64 }).notNull().unique(),
  zettelkastenId: varchar("zettelkasten_id", { length: 50 }).unique(), // Format: AC.ID-YYYYMMDD-Seq
  text: text("text").notNull(), // The quote or passage
  author: varchar("author", { length: 255 }),
  work: varchar("work", { length: 255 }), // Book, article, source title
  sourceType: varchar("sourceType", { length: 100 }), // "Book", "Article", "Web", "Video", "TV", etc.
  location: varchar("location", { length: 255 }), // Page number, timestamp, URL
  note: text("note"), // User's personal notes
  tags: text("tags"), // Comma-separated or JSON array
  collections: varchar("collections", { length: 255 }), // Collection/category label
  favorite: boolean("favorite").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotebookEntry = typeof notebookEntries.$inferSelect;
export type InsertNotebookEntry = typeof notebookEntries.$inferInsert;

/**
 * Module 2: Clavis Aurea — Personal Lexicon and Concordance
 * Stores vocabulary entries with definitions, etymology, and metadata
 */
export const lexiconEntries = mysqlTable("lexicon_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId"), // Johnny Decimal category
  zettelkastenId: varchar("zettelkasten_id", { length: 50 }).unique(), // Format: AC.ID-YYYYMMDD-Seq
  term: varchar("term", { length: 255 }).notNull(),
  partOfSpeech: varchar("partOfSpeech", { length: 100 }), // noun, verb, adjective, phrase, etc.
  definition: text("definition"),
  etymology: text("etymology"),
  origin: varchar("origin", { length: 255 }), // Language origin (Latin, Greek, French, etc.)
  sourceType: varchar("sourceType", { length: 100 }), // "Dictionary", "Word of the Day", "Decorative art", etc.
  imageNum: varchar("imageNum", { length: 50 }), // Reference to source image
  notes: text("notes"),
  dateAdded: timestamp("dateAdded").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LexiconEntry = typeof lexiconEntries.$inferSelect;
export type InsertLexiconEntry = typeof lexiconEntries.$inferInsert;

/**
 * Module 3: Research & Writing Studio
 * Stores documents with Markdown content and project/folder organization
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId"), // Johnny Decimal category
  uuid: varchar("uuid", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"), // Markdown content
  project: varchar("project", { length: 255 }), // Project name
  folder: varchar("folder", { length: 255 }), // Folder path
  status: mysqlEnum("status", ["draft", "in_progress", "completed", "archived"]).default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Cross-Module Semantic Linking
 * Bi-directional links between entries across all three modules
 */
export const semanticLinks = mysqlTable("semantic_links", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sourceType: mysqlEnum("sourceType", ["notebook", "lexicon", "document"]).notNull(),
  sourceId: int("sourceId").notNull(), // ID of source entry
  targetType: mysqlEnum("targetType", ["notebook", "lexicon", "document"]).notNull(),
  targetId: int("targetId").notNull(), // ID of target entry
  linkType: varchar("linkType", { length: 100 }), // "references", "related_to", "inspired_by", etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SemanticLink = typeof semanticLinks.$inferSelect;
export type InsertSemanticLink = typeof semanticLinks.$inferInsert;

/**
 * Tags for organizing and cross-referencing entries
 */
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }), // Hex color code
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

/**
 * Entry-to-Tag mapping for flexible tagging
 */
export const entryTags = mysqlTable("entry_tags", {
  id: int("id").autoincrement().primaryKey(),
  entryType: mysqlEnum("entryType", ["notebook", "lexicon", "document"]).notNull(),
  entryId: int("entryId").notNull(),
  tagId: int("tagId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EntryTag = typeof entryTags.$inferSelect;
export type InsertEntryTag = typeof entryTags.$inferInsert;

/**
 * Import history for tracking bulk imports
 */
export const importHistory = mysqlTable("import_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  importType: mysqlEnum("importType", ["notebook_json", "notebook_csv", "lexicon_json", "lexicon_csv"]).notNull(),
  fileName: varchar("fileName", { length: 255 }),
  totalRecords: int("totalRecords"),
  successfulRecords: int("successfulRecords"),
  failedRecords: int("failedRecords"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending"),
  errorLog: text("errorLog"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type ImportHistory = typeof importHistory.$inferSelect;
export type InsertImportHistory = typeof importHistory.$inferInsert;

/**
 * Export history for tracking exports
 */
export const exportHistory = mysqlTable("export_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  exportType: mysqlEnum("exportType", ["notebook_markdown", "notebook_json", "lexicon_markdown", "lexicon_json", "document_markdown", "full_backup"]).notNull(),
  fileName: varchar("fileName", { length: 255 }),
  recordCount: int("recordCount"),
  fileSize: int("fileSize"), // in bytes
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending"),
  downloadUrl: varchar("downloadUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type ExportHistory = typeof exportHistory.$inferSelect;
export type InsertExportHistory = typeof exportHistory.$inferInsert;

/**
 * Search index for unified search across modules
 */
export const searchIndex = mysqlTable("search_index", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  entryType: mysqlEnum("entryType", ["notebook", "lexicon", "document"]).notNull(),
  entryId: int("entryId").notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content"), // Indexed content
  tags: text("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SearchIndex = typeof searchIndex.$inferSelect;
export type InsertSearchIndex = typeof searchIndex.$inferInsert;


/**
 * Phase 4: Projects Module (Action Layer)
 * Tracks long-term projects and initiatives
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId"), // Johnny Decimal category
  uuid: varchar("uuid", { length: 64 }).notNull().unique(),
  zettelkastenId: varchar("zettelkasten_id", { length: 50 }).unique(), // Format: AC.ID-YYYYMMDD-Seq
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "completed", "archived", "on-hold"]).default("active"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  tags: text("tags"), // Comma-separated or JSON array
  linkedEntries: text("linkedEntries"), // JSON array of {type, id} for notebook/lexicon links
  favorite: boolean("favorite").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Phase 5: Tasks Module (Action Layer)
 * Tracks actionable items and todos
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId"), // Johnny Decimal category
  projectId: int("projectId"), // Optional: link to a project
  uuid: varchar("uuid", { length: 64 }).notNull().unique(),
  zettelkastenId: varchar("zettelkasten_id", { length: 50 }).unique(), // Format: AC.ID-YYYYMMDD-Seq
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["todo", "in-progress", "completed", "blocked"]).default("todo"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: timestamp("dueDate"),
  completedDate: timestamp("completedDate"),
  tags: text("tags"), // Comma-separated or JSON array
  linkedEntries: text("linkedEntries"), // JSON array of {type, id} for notebook/lexicon links
  linkedProjectId: int("linkedProjectId"), // Reference to project
  favorite: boolean("favorite").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

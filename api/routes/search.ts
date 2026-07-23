import { Router } from "express";
import { requireAuth } from "./auth";
import { getDb } from "../db";
import { commonplaceEntries, quotations, lexiconEntries, researchDocuments } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";

export const searchRouter = Router();
searchRouter.use(requireAuth);

searchRouter.get("/", async (req, res) => {
  const db = getDb();
  const userId = req.user!.id;
  const q = req.query.q as string;
  if (!q || q.length < 2) { res.json([]); return; }
  const like = `%${q}%`;

  const cp = await db.select({
    id: commonplaceEntries.id, title: commonplaceEntries.title,
    type: sql<string>`'note'`, dikwTier: commonplaceEntries.dikwTier,
    entryType: commonplaceEntries.entryType, updatedAt: commonplaceEntries.updatedAt,
  }).from(commonplaceEntries).where(and(eq(commonplaceEntries.userId, userId), sql`(${commonplaceEntries.title} LIKE ${like} OR ${commonplaceEntries.content} LIKE ${like})`)).limit(10);

  const qt = await db.select({
    id: quotations.id, title: quotations.quoteText,
    type: sql<string>`'quotation'`, dikwTier: quotations.dikwTier,
    entryType: sql<string>`'quote'`, updatedAt: quotations.updatedAt,
  }).from(quotations).where(and(eq(quotations.userId, userId), sql`(${quotations.quoteText} LIKE ${like} OR ${quotations.author} LIKE ${like})`)).limit(10);

  const lx = await db.select({
    id: lexiconEntries.id, title: lexiconEntries.headword,
    type: sql<string>`'lexicon'`, dikwTier: lexiconEntries.dikwTier,
    entryType: sql<string>`'glossary_term'`, updatedAt: lexiconEntries.updatedAt,
  }).from(lexiconEntries).where(and(eq(lexiconEntries.userId, userId), sql`${lexiconEntries.headword} LIKE ${like}`)).limit(10);

  const docs = await db.select({
    id: researchDocuments.id, title: researchDocuments.title,
    type: sql<string>`'document'`, dikwTier: researchDocuments.dikwTier,
    entryType: sql<string>`'article'`, updatedAt: researchDocuments.updatedAt,
  }).from(researchDocuments).where(and(eq(researchDocuments.userId, userId), sql`${researchDocuments.title} LIKE ${like}`)).limit(10);

  const results = [...cp, ...qt, ...lx, ...docs]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 20)
    .map((r) => ({ ...r, module: r.type === "note" ? "Notes" : r.type === "quotation" ? "Quotations" : r.type === "lexicon" ? "Vocabulary" : "Research" }));

  res.json(results);
});

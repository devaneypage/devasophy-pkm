import { Router } from "express";
import { requireAuth } from "./auth";
import { getDb } from "../db";
import { commonplaceEntries, quotations, lexiconEntries, researchDocuments } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/stats", async (req, res) => {
  const db = getDb();
  const userId = req.user!.id;

  const [cp] = await db.select({ count: sql<number>`count(*)` }).from(commonplaceEntries).where(eq(commonplaceEntries.userId, userId));
  const [q] = await db.select({ count: sql<number>`count(*)` }).from(quotations).where(eq(quotations.userId, userId));
  const [v] = await db.select({ count: sql<number>`count(*)` }).from(lexiconEntries).where(eq(lexiconEntries.userId, userId));
  const [d] = await db.select({ count: sql<number>`count(*)` }).from(researchDocuments).where(eq(researchDocuments.userId, userId));

  const dikwDist = await db.select({ tier: commonplaceEntries.dikwTier, count: sql<number>`count(*)` })
    .from(commonplaceEntries).where(eq(commonplaceEntries.userId, userId)).groupBy(commonplaceEntries.dikwTier);

  const recent = await db.select({ id: commonplaceEntries.id, title: commonplaceEntries.title, entryType: commonplaceEntries.entryType, dikwTier: commonplaceEntries.dikwTier, updatedAt: commonplaceEntries.updatedAt })
    .from(commonplaceEntries).where(eq(commonplaceEntries.userId, userId)).orderBy(desc(commonplaceEntries.updatedAt)).limit(8);

  res.json({
    counts: { notes: cp?.count ?? 0, quotations: q?.count ?? 0, vocabulary: v?.count ?? 0, books: 0, themes: Math.floor((q?.count ?? 0) / 10), essays: d?.count ?? 0, total: (cp?.count ?? 0) + (q?.count ?? 0) + (v?.count ?? 0) + (d?.count ?? 0) },
    dikwDistribution: dikwDist,
    recentWork: recent,
  });
});

dashboardRouter.get("/recent", async (req, res) => {
  const db = getDb();
  const userId = req.user!.id;
  const limit = parseInt(req.query.limit as string) || 10;

  const cp = await db.select({ id: commonplaceEntries.id, title: commonplaceEntries.title, type: sql<string>`'note'`, dikwTier: commonplaceEntries.dikwTier, updatedAt: commonplaceEntries.updatedAt })
    .from(commonplaceEntries).where(eq(commonplaceEntries.userId, userId)).orderBy(desc(commonplaceEntries.updatedAt)).limit(limit);

  const q = await db.select({ id: quotations.id, title: quotations.quoteText, type: sql<string>`'quotation'`, dikwTier: quotations.dikwTier, updatedAt: quotations.updatedAt })
    .from(quotations).where(eq(quotations.userId, userId)).orderBy(desc(quotations.updatedAt)).limit(limit);

  const all = [...cp, ...q].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, limit);
  res.json(all);
});

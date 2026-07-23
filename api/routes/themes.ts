import { Router } from "express";
import { requireAuth } from "./auth";
import { getDb } from "../db";
import { commonplaceEntries, quotations } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const themesRouter = Router();
themesRouter.use(requireAuth);

themesRouter.get("/", async (req, res) => {
  const db = getDb();
  const cp = await db.select({ tags: commonplaceEntries.tags }).from(commonplaceEntries).where(eq(commonplaceEntries.userId, req.user!.id));
  const q = await db.select({ tags: quotations.tags }).from(quotations).where(eq(quotations.userId, req.user!.id));

  const tagCounts: Record<string, number> = {};
  [...cp, ...q].forEach((row) => {
    ((row.tags ?? []) as string[]).forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    });
  });

  const themes = Object.entries(tagCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  res.json(themes);
});

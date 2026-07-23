import { Router } from "express";
import { requireAuth } from "./auth";
import { getDb } from "../db";
import { commonplaceEntries } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const notesRouter = Router();
notesRouter.use(requireAuth);

notesRouter.get("/", async (req, res) => {
  const db = getDb();
  const userId = req.user!.id;
  const conditions = [eq(commonplaceEntries.userId, userId)];
  const search = req.query.search as string;
  const dikw = req.query.dikw as string;
  const type = req.query.type as string;

  if (dikw) conditions.push(eq(commonplaceEntries.dikwTier, dikw as any));
  if (type) conditions.push(eq(commonplaceEntries.entryType, type as any));

  const baseQuery = conditions.length > 1 ? and(...conditions) : conditions[0];
  let query = db.select().from(commonplaceEntries).where(baseQuery).orderBy(desc(commonplaceEntries.updatedAt)).limit(100);

  if (search) {
    query = db.select().from(commonplaceEntries).where(
      and(baseQuery, sql`(${commonplaceEntries.title} LIKE ${`%${search}%`} OR ${commonplaceEntries.content} LIKE ${`%${search}%`})`)
    ).orderBy(desc(commonplaceEntries.updatedAt)).limit(100);
  }

  const items = await query;
  res.json(items);
});

notesRouter.get("/:id", async (req, res) => {
  const db = getDb();
  const rows = await db.select().from(commonplaceEntries).where(
    and(eq(commonplaceEntries.id, parseInt(req.params.id)), eq(commonplaceEntries.userId, req.user!.id))
  ).limit(1);
  res.json(rows[0] ?? null);
});

notesRouter.post("/", async (req, res) => {
  const db = getDb();
  const [item] = await db.insert(commonplaceEntries).values({ ...req.body, userId: req.user!.id });
  res.json({ id: item.insertId, ...req.body });
});

notesRouter.patch("/:id", async (req, res) => {
  const db = getDb();
  await db.update(commonplaceEntries).set(req.body).where(
    and(eq(commonplaceEntries.id, parseInt(req.params.id)), eq(commonplaceEntries.userId, req.user!.id))
  );
  const rows = await db.select().from(commonplaceEntries).where(eq(commonplaceEntries.id, parseInt(req.params.id))).limit(1);
  res.json(rows[0]);
});

notesRouter.delete("/:id", async (req, res) => {
  const db = getDb();
  await db.delete(commonplaceEntries).where(
    and(eq(commonplaceEntries.id, parseInt(req.params.id)), eq(commonplaceEntries.userId, req.user!.id))
  );
  res.json({ success: true });
});

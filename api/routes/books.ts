import { Router } from "express";
import { requireAuth } from "./auth";
import { getDb } from "../db";
import { commonplaceEntries } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const booksRouter = Router();
booksRouter.use(requireAuth);

booksRouter.get("/", async (req, res) => {
  const db = getDb();
  const cond = [eq(commonplaceEntries.userId, req.user!.id), eq(commonplaceEntries.entryType, "book_ref")];
  if (req.query.search) {
    res.json(await db.select().from(commonplaceEntries).where(and(...cond, sql`${commonplaceEntries.title} LIKE ${`%${req.query.search}%`}`)).orderBy(desc(commonplaceEntries.updatedAt)).limit(100));
    return;
  }
  res.json(await db.select().from(commonplaceEntries).where(and(...cond)).orderBy(desc(commonplaceEntries.updatedAt)).limit(100));
});

booksRouter.post("/", async (req, res) => {
  const db = getDb();
  const [item] = await db.insert(commonplaceEntries).values({ ...req.body, userId: req.user!.id, entryType: "book_ref" });
  res.json({ id: item.insertId, ...req.body });
});

booksRouter.patch("/:id", async (req, res) => {
  const db = getDb();
  await db.update(commonplaceEntries).set(req.body).where(
    and(eq(commonplaceEntries.id, parseInt(req.params.id)), eq(commonplaceEntries.userId, req.user!.id))
  );
  const rows = await db.select().from(commonplaceEntries).where(eq(commonplaceEntries.id, parseInt(req.params.id))).limit(1);
  res.json(rows[0]);
});

booksRouter.delete("/:id", async (req, res) => {
  const db = getDb();
  await db.delete(commonplaceEntries).where(
    and(eq(commonplaceEntries.id, parseInt(req.params.id)), eq(commonplaceEntries.userId, req.user!.id))
  );
  res.json({ success: true });
});

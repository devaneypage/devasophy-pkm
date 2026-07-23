import { Router } from "express";
import { requireAuth } from "./auth";
import { getDb } from "../db";
import { lexiconEntries } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";

export const vocabularyRouter = Router();
vocabularyRouter.use(requireAuth);

vocabularyRouter.get("/", async (req, res) => {
  const db = getDb();
  const cond = [eq(lexiconEntries.userId, req.user!.id)];
  if (req.query.search) {
    const items = await db.select().from(lexiconEntries).where(and(...cond, sql`(${lexiconEntries.headword} LIKE ${`%${req.query.search}%`} OR ${lexiconEntries.definitions} LIKE ${`%${req.query.search}%`})`)).orderBy(lexiconEntries.headword).limit(200);
    res.json(items); return;
  }
  if (req.query.letter) {
    const items = await db.select().from(lexiconEntries).where(and(...cond, sql`${lexiconEntries.headword} LIKE ${`${req.query.letter}%`}`)).orderBy(lexiconEntries.headword).limit(200);
    res.json(items); return;
  }
  const items = await db.select().from(lexiconEntries).where(cond.length > 1 ? and(...cond) : cond[0]).orderBy(lexiconEntries.headword).limit(200);
  res.json(items);
});

vocabularyRouter.post("/", async (req, res) => {
  const db = getDb();
  const [item] = await db.insert(lexiconEntries).values({ ...req.body, userId: req.user!.id });
  res.json({ id: item.insertId, ...req.body });
});

vocabularyRouter.patch("/:id", async (req, res) => {
  const db = getDb();
  await db.update(lexiconEntries).set(req.body).where(
    and(eq(lexiconEntries.id, parseInt(req.params.id)), eq(lexiconEntries.userId, req.user!.id))
  );
  const rows = await db.select().from(lexiconEntries).where(eq(lexiconEntries.id, parseInt(req.params.id))).limit(1);
  res.json(rows[0]);
});

vocabularyRouter.delete("/:id", async (req, res) => {
  const db = getDb();
  await db.delete(lexiconEntries).where(
    and(eq(lexiconEntries.id, parseInt(req.params.id)), eq(lexiconEntries.userId, req.user!.id))
  );
  res.json({ success: true });
});

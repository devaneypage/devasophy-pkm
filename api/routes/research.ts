import { Router } from "express";
import { requireAuth } from "./auth";
import { getDb } from "../db";
import { researchDocuments } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const researchRouter = Router();
researchRouter.use(requireAuth);

researchRouter.get("/", async (req, res) => {
  const db = getDb();
  const cond = [eq(researchDocuments.userId, req.user!.id)];
  if (req.query.status) cond.push(eq(researchDocuments.status, req.query.status as any));
  const base = cond.length > 1 ? and(...cond) : cond[0];
  let query = db.select().from(researchDocuments).where(base).orderBy(desc(researchDocuments.updatedAt)).limit(100);
  if (req.query.search) query = db.select().from(researchDocuments).where(and(base, sql`${researchDocuments.title} LIKE ${`%${req.query.search}%`}`)).orderBy(desc(researchDocuments.updatedAt)).limit(100);
  res.json(await query);
});

researchRouter.get("/:id", async (req, res) => {
  const db = getDb();
  const rows = await db.select().from(researchDocuments).where(
    and(eq(researchDocuments.id, parseInt(req.params.id)), eq(researchDocuments.userId, req.user!.id))
  ).limit(1);
  res.json(rows[0] ?? null);
});

researchRouter.post("/", async (req, res) => {
  const db = getDb();
  const [item] = await db.insert(researchDocuments).values({ ...req.body, userId: req.user!.id });
  res.json({ id: item.insertId, ...req.body });
});

researchRouter.patch("/:id", async (req, res) => {
  const db = getDb();
  await db.update(researchDocuments).set(req.body).where(
    and(eq(researchDocuments.id, parseInt(req.params.id)), eq(researchDocuments.userId, req.user!.id))
  );
  const rows = await db.select().from(researchDocuments).where(eq(researchDocuments.id, parseInt(req.params.id))).limit(1);
  res.json(rows[0]);
});

researchRouter.delete("/:id", async (req, res) => {
  const db = getDb();
  await db.delete(researchDocuments).where(
    and(eq(researchDocuments.id, parseInt(req.params.id)), eq(researchDocuments.userId, req.user!.id))
  );
  res.json({ success: true });
});

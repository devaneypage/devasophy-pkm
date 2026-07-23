import { Router } from "express";
import { requireAuth } from "./auth";
import { getDb } from "../db";
import { quotations } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const quotationsRouter = Router();
quotationsRouter.use(requireAuth);

quotationsRouter.get("/", async (req, res) => {
  const db = getDb();
  const conditions = [eq(quotations.userId, req.user!.id)];
  const search = req.query.search as string;
  if (req.query.dikw) conditions.push(eq(quotations.dikwTier, req.query.dikw as any));
  const baseQuery = conditions.length > 1 ? and(...conditions) : conditions[0];
  let query = db.select().from(quotations).where(baseQuery).orderBy(desc(quotations.updatedAt)).limit(100);
  if (search) query = db.select().from(quotations).where(and(baseQuery, sql`(${quotations.quoteText} LIKE ${`%${search}%`} OR ${quotations.author} LIKE ${`%${search}%`})`)).orderBy(desc(quotations.updatedAt)).limit(100);
  res.json(await query);
});

quotationsRouter.post("/", async (req, res) => {
  const db = getDb();
  const [item] = await db.insert(quotations).values({ ...req.body, userId: req.user!.id });
  res.json({ id: item.insertId, ...req.body });
});

quotationsRouter.patch("/:id", async (req, res) => {
  const db = getDb();
  await db.update(quotations).set(req.body).where(
    and(eq(quotations.id, parseInt(req.params.id)), eq(quotations.userId, req.user!.id))
  );
  const rows = await db.select().from(quotations).where(eq(quotations.id, parseInt(req.params.id))).limit(1);
  res.json(rows[0]);
});

quotationsRouter.delete("/:id", async (req, res) => {
  const db = getDb();
  await db.delete(quotations).where(
    and(eq(quotations.id, parseInt(req.params.id)), eq(quotations.userId, req.user!.id))
  );
  res.json({ success: true });
});

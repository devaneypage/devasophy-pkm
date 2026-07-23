import { Router } from "express";
import { requireAuth } from "./auth";
import { getDb } from "../db";
import { researchDocuments } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const plansRouter = Router();
plansRouter.use(requireAuth);

plansRouter.get("/", async (req, res) => {
  const db = getDb();
  const items = await db.select().from(researchDocuments)
    .where(and(eq(researchDocuments.userId, req.user!.id), eq(researchDocuments.status, "planned")))
    .orderBy(desc(researchDocuments.updatedAt)).limit(100);
  res.json(items);
});

plansRouter.post("/", async (req, res) => {
  const db = getDb();
  const [item] = await db.insert(researchDocuments).values({ ...req.body, userId: req.user!.id, status: "planned" });
  res.json({ id: item.insertId, ...req.body });
});

plansRouter.patch("/:id", async (req, res) => {
  const db = getDb();
  await db.update(researchDocuments).set(req.body).where(
    and(eq(researchDocuments.id, parseInt(req.params.id)), eq(researchDocuments.userId, req.user!.id))
  );
  res.json({ success: true });
});

plansRouter.delete("/:id", async (req, res) => {
  const db = getDb();
  await db.delete(researchDocuments).where(
    and(eq(researchDocuments.id, parseInt(req.params.id)), eq(researchDocuments.userId, req.user!.id))
  );
  res.json({ success: true });
});

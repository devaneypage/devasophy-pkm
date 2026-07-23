import { Router } from "express";
import { requireAuth } from "./auth";
import { getDb } from "../db";
import { commonplaceEntries } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const ideasRouter = Router();
ideasRouter.use(requireAuth);

ideasRouter.get("/", async (req, res) => {
  const db = getDb();
  const items = await db.select().from(commonplaceEntries)
    .where(and(eq(commonplaceEntries.userId, req.user!.id), eq(commonplaceEntries.entryType, "idea")))
    .orderBy(desc(commonplaceEntries.updatedAt)).limit(100);
  res.json(items);
});

ideasRouter.post("/", async (req, res) => {
  const db = getDb();
  const [item] = await db.insert(commonplaceEntries).values({ ...req.body, userId: req.user!.id, entryType: "idea" });
  res.json({ id: item.insertId, ...req.body });
});

ideasRouter.patch("/:id", async (req, res) => {
  const db = getDb();
  await db.update(commonplaceEntries).set(req.body).where(
    and(eq(commonplaceEntries.id, parseInt(req.params.id)), eq(commonplaceEntries.userId, req.user!.id))
  );
  res.json({ success: true });
});

ideasRouter.delete("/:id", async (req, res) => {
  const db = getDb();
  await db.delete(commonplaceEntries).where(
    and(eq(commonplaceEntries.id, parseInt(req.params.id)), eq(commonplaceEntries.userId, req.user!.id))
  );
  res.json({ success: true });
});

import { Router } from "express";
import { requireAuth } from "./auth";
import { getDb } from "../db";
import { commonplaceEntries, quotations, lexiconEntries, researchDocuments } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const exportRouter = Router();
exportRouter.use(requireAuth);

exportRouter.get("/json", async (req, res) => {
  const db = getDb();
  const userId = req.user!.id;

  const [cp, qt, lx, docs] = await Promise.all([
    db.select().from(commonplaceEntries).where(eq(commonplaceEntries.userId, userId)).orderBy(desc(commonplaceEntries.updatedAt)),
    db.select().from(quotations).where(eq(quotations.userId, userId)).orderBy(desc(quotations.updatedAt)),
    db.select().from(lexiconEntries).where(eq(lexiconEntries.userId, userId)).orderBy(lexiconEntries.headword),
    db.select().from(researchDocuments).where(eq(researchDocuments.userId, userId)).orderBy(desc(researchDocuments.updatedAt)),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    user: { id: req.user!.id, name: req.user!.name },
    notes: cp,
    quotations: qt,
    vocabulary: lx,
    research: docs,
  };

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", 'attachment; filename="devasophy-backup.json"');
  res.send(JSON.stringify(data, null, 2));
});

exportRouter.get("/markdown", async (req, res) => {
  const db = getDb();
  const userId = req.user!.id;

  const [cp, qt, lx, docs] = await Promise.all([
    db.select().from(commonplaceEntries).where(eq(commonplaceEntries.userId, userId)).orderBy(desc(commonplaceEntries.updatedAt)),
    db.select().from(quotations).where(eq(quotations.userId, userId)).orderBy(desc(quotations.updatedAt)),
    db.select().from(lexiconEntries).where(eq(lexiconEntries.userId, userId)).orderBy(lexiconEntries.headword),
    db.select().from(researchDocuments).where(eq(researchDocuments.userId, userId)).orderBy(desc(researchDocuments.updatedAt)),
  ]);

  let md = "# Devasophy PKM Export\n\n";
  md += `Exported: ${new Date().toLocaleString()}\n\n---\n\n`;

  md += "# Notes\n\n";
  cp.forEach((n) => {
    md += `## ${n.title}\n\n${n.content ?? ""}\n\n`;
    md += `*Type: ${n.entryType} | DIKW: ${n.dikwTier} | Tags: ${(n.tags as string[] ?? []).join(", ")}*\n\n---\n\n`;
  });

  md += "# Quotations\n\n";
  qt.forEach((q) => {
    md += `> "${q.quoteText}"\n\n\u2014 ${q.author}${q.sourceWork ? `, *${q.sourceWork}*` : ""}\n\n`;
    md += `*DIKW: ${q.dikwTier}*\n\n---\n\n`;
  });

  md += "# Vocabulary\n\n";
  lx.forEach((v) => {
    md += `## ${v.headword}\n\n`;
    md += `${v.pronunciation ? `*${v.pronunciation}* ` : ""}${v.partOfSpeech ? `(${v.partOfSpeech})` : ""}\n\n`;
    const defs = (v.definitions as { num: number; text: string }[] | null) ?? [];
    defs.forEach((d) => { md += `${d.num}. ${d.text}\n\n`; });
    if (v.etymology) md += `**Etymology:** ${v.etymology}\n\n`;
    md += "---\n\n";
  });

  md += "# Research Documents\n\n";
  docs.forEach((d) => {
    md += `## ${d.title}\n\n${d.content ?? ""}\n\n`;
    md += `*Status: ${d.status} | DIKW: ${d.dikwTier}*\n\n---\n\n`;
  });

  res.setHeader("Content-Type", "text/markdown");
  res.setHeader("Content-Disposition", 'attachment; filename="devasophy-export.md"');
  res.send(md);
});

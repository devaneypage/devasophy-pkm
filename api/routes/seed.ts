import { Router } from "express";
import { requireAuth } from "./auth";
import { getDb } from "../db";
import { commonplaceEntries, quotations, lexiconEntries, researchDocuments } from "@db/schema";
import { eq, sql } from "drizzle-orm";

export const seedRouter = Router();
seedRouter.use(requireAuth);

const SEED_NOTES = [
  { title: "Reading queue \u2014 Q3 philosophy of mind", content: "A curated queue for the third quarter focused on philosophy of mind, consciousness studies, and cognitive architecture.", entryType: "list" as const, dikwTier: "information" as const, tags: ["queue", "mind", "Q3"] },
  { title: "Marginalia as a discipline of attention", content: "Marginalia is not mere annotation\u2014it is a discipline of attention. Each mark in the margin is a moment of directed focus, a claim that this passage merits cognitive investment.", entryType: "article" as const, dikwTier: "knowledge" as const, tags: ["reading", "annotation", "attention"] },
  { title: "Taxonomy vs. Ontology \u2014 a distinction", content: "A taxonomy organizes; an ontology grounds. Taxonomy is pragmatic arrangement. Ontology is metaphysical commitment. Understanding this distinction is foundational to the entire PKM system.", entryType: "glossary_term" as const, dikwTier: "knowledge" as const, tags: ["schema", "distinction", "foundations"] },
  { title: "Principles of durable architecture", content: "1. Separation of concerns. 2. Loose coupling, tight cohesion. 3. Progressive enhancement. 4. Semantic structure. 5. Version everything.", entryType: "list" as const, dikwTier: "wisdom" as const, tags: ["principles", "architecture"] },
  { title: "Thinking, Fast and Slow", content: "Two systems drive the way we think. System 1 is fast, intuitive, and emotional; System 2 is slower, more deliberative, and more logical.", entryType: "book_ref" as const, dikwTier: "information" as const, tags: ["cognition", "bias", "psychology"] },
  { title: "The Structure of Scientific Revolutions", content: "Science does not progress via steady accumulation of knowledge, but through paradigm shifts\u2014sudden transformations in the fundamental assumptions governing a field.", entryType: "book_ref" as const, dikwTier: "knowledge" as const, tags: ["paradigm", "philosophy of science"] },
  { title: "Against the tyranny of the feed", content: "The infinite scroll is the enemy of deep thought. When information is arranged by recency rather than relevance, the architecture itself inhibits synthesis.", entryType: "article" as const, dikwTier: "knowledge" as const, tags: ["attention", "media", "focus"] },
  { title: "Epistemics \u2014 the study of knowledge itself", content: "Epistemics concerns how we know what we know. It is the metadiscipline that undergirds all systematic inquiry.", entryType: "glossary_term" as const, dikwTier: "data" as const, tags: ["knowledge", "epistemology"] },
  { title: "Systemic Taxonomy v2 \u2014 top-level regions", content: "01 THE CORE (Foundations) \u00b7 02 ATELIER (Practice) \u00b7 03 ARCHIVES (Memory) \u00b7 04 NETWORK (Relations) \u00b7 05 DRAFTS (Flux) \u00b7 06 CANON (Sources)", entryType: "list" as const, dikwTier: "information" as const, tags: ["taxonomy", "schema", "system"] },
  { title: "That which is measured tends to improve", content: "Key insight: quantitative self-tracking creates feedback loops. What we measure, we tend to optimize. But beware\u2014measuring the wrong things optimizes the wrong behaviors.", entryType: "quote" as const, dikwTier: "information" as const, tags: ["metrics", "measurement"] },
  { title: "How to Take Smart Notes", content: "The slip-box method: write one idea per note, give each a unique ID, link related notes, and develop ideas from the bottom up through connection.", entryType: "book_ref" as const, dikwTier: "knowledge" as const, tags: ["zettelkasten", "note-taking", "methodology"] },
  { title: "Emergence and the limits of reductionism", content: "Some properties only exist at higher levels of organization. Consciousness cannot be reduced to neurons; culture cannot be reduced to individuals.", entryType: "article" as const, dikwTier: "knowledge" as const, tags: ["emergence", "complexity", "systems"] },
  { title: "The architecture of silence in digital gardens", content: "Whitespace is not emptiness\u2014it is the negative space that gives meaning to content. The best PKM systems have room for silence.", entryType: "article" as const, dikwTier: "knowledge" as const, tags: ["PKM", "whitespace", "design"] },
  { title: "A Pattern Language", content: "Christopher Alexander's masterwork on architectural patterns. Each pattern describes a problem and a solution in a way that can be applied repeatedly.", entryType: "book_ref" as const, dikwTier: "knowledge" as const, tags: ["design", "structure", "patterns"] },
  { title: "We are what we repeatedly do", content: "Excellence, then, is not an act, but a habit. The compound effect of daily practice accumulates into mastery.", entryType: "quote" as const, dikwTier: "wisdom" as const, tags: ["habit", "virtue", "practice"] },
  { title: "Ontology \u2014 a structured account of being", content: "Ontology is the philosophical study of existence. In knowledge management, it refers to the categorical structure that determines what kinds of things exist in your system.", entryType: "glossary_term" as const, dikwTier: "data" as const, tags: ["metaphysics", "structure"] },
  { title: "On the noblest pleasure of understanding", content: "The noblest pleasure is the joy of understanding. Not accumulation, not productivity\u2014comprehension.", entryType: "quote" as const, dikwTier: "wisdom" as const, tags: ["epistemics", "joy", "understanding"] },
  { title: "The unexamined life is not worth living", content: "Socratic wisdom: self-examination is the foundation of a meaningful existence. Without reflection, experience is merely event.", entryType: "quote" as const, dikwTier: "wisdom" as const, tags: ["examined life", "philosophy", "socrates"] },
];

const SEED_QUOTES = [
  { quoteText: "The unexamined life is not worth living.", author: "Socrates", sourceWork: "Apology", sourceDate: "c. 399 BC", dikwTier: "wisdom" as const, tags: ["socrates", "examined life"] },
  { quoteText: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", sourceWork: "Nicomachean Ethics", sourceDate: "c. 350 BC", dikwTier: "wisdom" as const, tags: ["habit", "virtue", "excellence"] },
  { quoteText: "That which is measured tends to improve.", author: "Karl Pearson", sourceWork: "The Grammar of Science", sourceDate: "1892", dikwTier: "information" as const, tags: ["metrics", "measurement"] },
  { quoteText: "The noblest pleasure is the joy of understanding.", author: "Leonardo da Vinci", sourceWork: "Notebooks", sourceDate: "c. 1510", dikwTier: "wisdom" as const, tags: ["understanding", "joy"] },
];

const SEED_LEXICON = [
  { headword: "Epistemics", pronunciation: "/\u026a\u02ccp\u026ast\u0259\u02c8m\u026aks/", language: "English", partOfSpeech: "noun", definitions: [{ num: 1, text: "The study of knowledge itself; how we know what we know." }], etymology: "From Greek epist\u0113m\u0113 'knowledge' + -ics" },
  { headword: "Ontology", pronunciation: "/\u0252n\u02c8t\u0252l\u0259d\u0292i/", language: "Greek via English", partOfSpeech: "noun", definitions: [{ num: 1, text: "The branch of metaphysics dealing with the nature of being." }, { num: 2, text: "A particular theory about the nature of being or the kinds of things that have existence." }], etymology: "From Greek ont- 'being' (from \u014dn) + -logy 'study of'" },
  { headword: "Taxonomy", pronunciation: "/tak\u02c8s\u0252n\u0259mi/", language: "Greek via English", partOfSpeech: "noun", definitions: [{ num: 1, text: "The science or practice of classification." }, { num: 2, text: "A particular scheme of classification." }], etymology: "From Greek taxis 'arrangement' + nomia 'distribution'" },
];

seedRouter.post("/", async (req, res) => {
  const db = getDb();
  const userId = req.user!.id;

  const [existing] = await db.select({ count: sql<number>`count(*)` }).from(commonplaceEntries).where(eq(commonplaceEntries.userId, userId));
  if ((existing?.count ?? 0) > 0) {
    res.json({ message: "Already seeded", count: existing.count });
    return;
  }

  for (const n of SEED_NOTES) {
    await db.insert(commonplaceEntries).values({ ...n, userId, status: "active", wordCount: (n.content ?? "").split(/\s+/).length, charCount: (n.content ?? "").length });
  }

  for (const q of SEED_QUOTES) {
    await db.insert(quotations).values({ ...q, userId });
  }

  for (const v of SEED_LEXICON) {
    await db.insert(lexiconEntries).values({ ...v, userId, dikwTier: "knowledge" });
  }

  await db.insert(researchDocuments).values({
    userId, title: "The Architecture of Thought: A Working Thesis",
    content: "## Abstract\n\nThis working document explores the structural properties of personal knowledge management systems...",
    status: "draft", dikwTier: "knowledge", wordCount: 15, charCount: 100,
  });

  res.json({ message: "Seeded", notes: SEED_NOTES.length, quotes: SEED_QUOTES.length, lexicon: SEED_LEXICON.length });
});

/**
 * Duplicate Detection Routes for tRPC
 * These routes are added to the bulkImport router
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  bulkImportNotebookWithDuplicateDetection,
  bulkImportLexiconWithDuplicateDetection,
  getDb,
} from "./db";
import { detectNotebookDuplicates, detectLexiconDuplicates } from "./duplicateDetection";
import { notebookEntries, lexiconEntries } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const duplicateDetectionRouter = router({
  notebookWithDuplicateDetection: protectedProcedure
    .input(
      z.object({
        entries: z.array(
          z.object({
            text: z.string(),
            author: z.string().optional(),
            work: z.string().optional(),
            sourceType: z.string().optional(),
            location: z.string().optional(),
            note: z.string().optional(),
            tags: z.string().optional(),
            collections: z.string().optional(),
            favorite: z.boolean().optional(),
          })
        ),
        autoCategory: z.boolean().optional(),
        onDuplicate: z.enum(["skip", "merge", "replace"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await bulkImportNotebookWithDuplicateDetection(ctx.user.id, input.entries, {
        autoCategory: input.autoCategory,
        onDuplicate: input.onDuplicate,
      });
    }),

  lexiconWithDuplicateDetection: protectedProcedure
    .input(
      z.object({
        entries: z.array(
          z.object({
            term: z.string(),
            partOfSpeech: z.string().optional(),
            definition: z.string().optional(),
            etymology: z.string().optional(),
            origin: z.string().optional(),
            sourceType: z.string().optional(),
            imageNum: z.string().optional(),
            notes: z.string().optional(),
            dikwTier: z.string().optional(),
          })
        ),
        autoCategory: z.boolean().optional(),
        onDuplicate: z.enum(["skip", "merge", "replace"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await bulkImportLexiconWithDuplicateDetection(ctx.user.id, input.entries, {
        autoCategory: input.autoCategory,
        onDuplicate: input.onDuplicate,
      });
    }),

  detectNotebookDuplicates: protectedProcedure
    .input(
      z.object({
        text: z.string(),
        author: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existingEntriesRaw = await db
        .select({ id: notebookEntries.id, text: notebookEntries.text, author: notebookEntries.author })
        .from(notebookEntries)
        .where(eq(notebookEntries.userId, ctx.user.id));

      const existingEntries = existingEntriesRaw.map((e) => ({
        id: e.id,
        text: e.text,
        author: e.author || undefined,
      }));

      return detectNotebookDuplicates(
        { text: input.text, author: input.author || undefined },
        existingEntries
      );
    }),

  detectLexiconDuplicates: protectedProcedure
    .input(
      z.object({
        term: z.string(),
        definition: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existingEntriesRaw = await db
        .select({ id: lexiconEntries.id, term: lexiconEntries.term, definition: lexiconEntries.definition })
        .from(lexiconEntries)
        .where(eq(lexiconEntries.userId, ctx.user.id));

      const existingEntries = existingEntriesRaw.map((e) => ({
        id: e.id,
        term: e.term,
        definition: e.definition || undefined,
      }));

      return detectLexiconDuplicates(
        { term: input.term, definition: input.definition || undefined },
        existingEntries
      );
    }),
});

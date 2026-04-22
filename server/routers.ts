import { readFile } from "node:fs/promises";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import {
  createNotebookEntry,
  getNotebookEntries,
  getNotebookEntry,
  updateNotebookEntry,
  deleteNotebookEntry,
  createLexiconEntry,
  getLexiconEntries,
  getLexiconEntry,
  updateLexiconEntry,
  deleteLexiconEntry,
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  createSemanticLink,
  getSemanticLinks,
  deleteSemanticLink,
  getTaxonomyAreas,
  getTaxonomyCategories,
  getTaxonomyTree,
  seedJohnnyDecimalTaxonomy,
  searchAllModules,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================================
  // NOTEBOOK MODULE
  // ============================================================================
  notebook: router({
    create: protectedProcedure
      .input(
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
          uuid: z.string(),
          categoryId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await createNotebookEntry(ctx.user.id, input);
      }),

    list: protectedProcedure
      .input(
        z.object({
          categoryId: z.number().optional(),
          search: z.string().optional(),
          sortBy: z.enum(["recent", "oldest"]).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await getNotebookEntries(ctx.user.id, input);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getNotebookEntry(ctx.user.id, input.id);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          text: z.string().optional(),
          author: z.string().optional(),
          work: z.string().optional(),
          sourceType: z.string().optional(),
          location: z.string().optional(),
          note: z.string().optional(),
          tags: z.string().optional(),
          collections: z.string().optional(),
          favorite: z.boolean().optional(),
          categoryId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await updateNotebookEntry(ctx.user.id, id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await deleteNotebookEntry(ctx.user.id, input.id);
      }),
  }),

  // ============================================================================
  // LEXICON MODULE (Clavis Aurea)
  // ============================================================================
  lexicon: router({
    create: protectedProcedure
      .input(
        z.object({
          term: z.string(),
          partOfSpeech: z.string().optional(),
          definition: z.string().optional(),
          etymology: z.string().optional(),
          origin: z.string().optional(),
          sourceType: z.string().optional(),
          imageNum: z.string().optional(),
          notes: z.string().optional(),
          categoryId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await createLexiconEntry(ctx.user.id, input);
      }),

    list: protectedProcedure
      .input(
        z.object({
          categoryId: z.number().optional(),
          search: z.string().optional(),
          partOfSpeech: z.string().optional(),
          sourceType: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await getLexiconEntries(ctx.user.id, input);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getLexiconEntry(ctx.user.id, input.id);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          term: z.string().optional(),
          partOfSpeech: z.string().optional(),
          definition: z.string().optional(),
          etymology: z.string().optional(),
          origin: z.string().optional(),
          sourceType: z.string().optional(),
          imageNum: z.string().optional(),
          notes: z.string().optional(),
          categoryId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await updateLexiconEntry(ctx.user.id, id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await deleteLexiconEntry(ctx.user.id, input.id);
      }),
  }),

  // ============================================================================
  // DOCUMENTS MODULE (Research & Writing Studio)
  // ============================================================================
  documents: router({
    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          content: z.string().optional(),
          project: z.string().optional(),
          folder: z.string().optional(),
          status: z.enum(["draft", "in_progress", "completed", "archived"]).optional(),
          uuid: z.string(),
          categoryId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await createDocument(ctx.user.id, input);
      }),

    list: protectedProcedure
      .input(
        z.object({
          categoryId: z.number().optional(),
          project: z.string().optional(),
          status: z.enum(["draft", "in_progress", "completed", "archived"]).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await getDocuments(ctx.user.id, input);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getDocument(ctx.user.id, input.id);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          content: z.string().optional(),
          project: z.string().optional(),
          folder: z.string().optional(),
          status: z.enum(["draft", "in_progress", "completed", "archived"]).optional(),
          categoryId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await updateDocument(ctx.user.id, id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await deleteDocument(ctx.user.id, input.id);
      }),
  }),

  // ============================================================================
  // SEMANTIC LINKS
  // ============================================================================
  links: router({
    create: protectedProcedure
      .input(
        z.object({
          sourceType: z.enum(["notebook", "lexicon", "document"]),
          sourceId: z.number(),
          targetType: z.enum(["notebook", "lexicon", "document"]),
          targetId: z.number(),
          linkType: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await createSemanticLink(ctx.user.id, input);
      }),

    list: protectedProcedure
      .input(
        z.object({
          sourceType: z.enum(["notebook", "lexicon", "document"]),
          sourceId: z.number(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await getSemanticLinks(ctx.user.id, input.sourceType, input.sourceId);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await deleteSemanticLink(ctx.user.id, input.id);
      }),
  }),

  // ============================================================================
  // TAXONOMY
  // ============================================================================
  taxonomy: router({
    seed: protectedProcedure.mutation(async ({ ctx }) => {
      await seedJohnnyDecimalTaxonomy(ctx.user.id);
      return { success: true } as const;
    }),

    getAreas: protectedProcedure.query(async ({ ctx }) => {
      return await getTaxonomyAreas(ctx.user.id);
    }),

    getCategories: protectedProcedure
      .input(z.object({ areaId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getTaxonomyCategories(ctx.user.id, input.areaId);
      }),

    getTree: protectedProcedure.query(async ({ ctx }) => {
      return await getTaxonomyTree(ctx.user.id);
    }),
  }),

  autofill: router({
    loadUploadedFile: protectedProcedure
      .input(z.object({ source: z.enum(["quotes", "lexicon"]) }))
      .mutation(async ({ input }) => {
        const sources = {
          quotes: {
            fileName: "Quotes-All_with_notes_with_metadata.json",
            path: "/home/ubuntu/upload/Quotes-All_with_notes_with_metadata.json",
          },
          lexicon: {
            fileName: "Clavis_Aurea_Complete.json",
            path: "/home/ubuntu/upload/Clavis_Aurea_Complete.json",
          },
        } as const;

        const target = sources[input.source];
        const text = await readFile(target.path, "utf8");

        return {
          source: input.source,
          fileName: target.fileName,
          text,
        };
      }),
  }),

  // ============================================================================
  // SEARCH
  // ============================================================================
  search: router({
    unified: protectedProcedure
      .input(
        z.object({
          query: z.string(),
          moduleFilter: z.enum(["all", "notebook", "lexicon", "document"]).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await searchAllModules(ctx.user.id, input.query, input);
      }),
  }),
});

export type AppRouter = typeof appRouter;

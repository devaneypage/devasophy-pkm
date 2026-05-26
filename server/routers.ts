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
  getEnrichedDocumentLinks,
  getTaxonomyAreas,
  getTaxonomyCategories,
  getTaxonomyTree,
  seedJohnnyDecimalTaxonomy,
  searchAllModules,
  createProject,
  getProject,
  listProjects,
  updateProject,
  deleteProject,
  createTask,
  getTask,
  listTasks,
  updateTask,
  deleteTask,
  bulkImportNotebookEntries,
  bulkImportLexiconEntries,
  bulkImportNotebookFromCSV,
  bulkImportLexiconFromCSV,
  bulkImportNotebookFromText,
  bulkImportLexiconFromText,
  bulkImportNotebookWithDuplicateDetection,
  bulkImportLexiconWithDuplicateDetection,
} from "./db";
import {
  generateNotebookZettelkastenId,
  generateLexiconZettelkastenId,
} from "./zettelkasten";
import { duplicateDetectionRouter } from "./duplicateDetectionRoutes";

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
          zettelkastenId: z.string().optional(),
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
          zettelkastenId: z.string().optional(),
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

    linkedReferences: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getEnrichedDocumentLinks(ctx.user.id, input.id);
      }),

    researchAssist: protectedProcedure
      .input(
        z.object({
          documentId: z.number(),
          messages: z.array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const document = await getDocument(ctx.user.id, input.documentId);
        if (!document) {
          throw new Error("Document not found");
        }

        const linkedReferences = await getEnrichedDocumentLinks(ctx.user.id, input.documentId);
        const { invokeLLM } = await import("./_core/llm");

        const referenceContext = linkedReferences.length > 0
          ? linkedReferences
              .slice(0, 8)
              .map((reference, index) => `${index + 1}. [${reference.targetType}] ${reference.targetTitle}\nRelationship: ${reference.linkType || "related"}\nMetadata: ${reference.targetMetadata || "none"}\nExcerpt: ${reference.targetExcerpt || reference.targetPreview}`)
              .join("\n\n")
          : "No linked references are currently attached to this document.";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are the Devasophy Research Assistant. Help the user think, synthesize, outline, compare sources, and refine arguments. Ground your answer in the current document and linked PKM references when available. If context is missing, say so plainly and suggest what to add next.",
            },
            {
              role: "user",
              content: `Current document title: ${document.title}\nProject: ${document.project || "General research"}\nFolder: ${document.folder || "Working drafts"}\nStatus: ${document.status || "draft"}\n\nCurrent document content:\n${document.content || "(This draft is currently empty.)"}\n\nLinked references:\n${referenceContext}`,
            },
            ...input.messages,
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        const normalizedResponse = typeof rawContent === "string"
          ? rawContent
          : Array.isArray(rawContent)
            ? rawContent
                .map((part) => (part && typeof part === "object" && "type" in part && part.type === "text" && "text" in part ? part.text : ""))
                .join("\n")
            : "";

        return {
          response: normalizedResponse,
          contextCount: linkedReferences.length,
        };
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
  // ZETTELKASTEN ID GENERATION
  // ============================================================================
  zettelkasten: router({
    generateNotebookId: protectedProcedure
      .input(
        z.object({
          categoryNumber: z.string(),
        })
      )
      .query(async ({ ctx, input }) => {
        const id = await generateNotebookZettelkastenId(ctx.user.id, input.categoryNumber);
        return { zettelkastenId: id };
      }),

    generateLexiconId: protectedProcedure
      .input(
        z.object({
          categoryNumber: z.string(),
        })
      )
      .query(async ({ ctx, input }) => {
        const id = await generateLexiconZettelkastenId(ctx.user.id, input.categoryNumber);
        return { zettelkastenId: id };
      }),
  }),

  // ============================================================================
  // GLOSSARY
  // ============================================================================
  glossary: router({
    composeWithScribe: protectedProcedure
      .input(
        z.object({
          prompt: z.string(),
          glossaryContext: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const systemPrompt = `You are a sophisticated writing assistant inspired by the Clavis Aurea lexicon. Your task is to compose elegant, philosophical prose that naturally weaves in vocabulary from the provided lexicon. The composition should be polished, evocative, and intellectually rigorous. Respond with only the composition itself, no preamble.`;
        
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: `Lexicon context: ${input.glossaryContext}

Composition request: ${input.prompt}`,
            },
          ],
        });
        
        const composition = response.choices[0]?.message?.content || "";
        return { composition };
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

  // ============================================================================
  // PROJECTS (Action Layer - Phase 4)
  // ============================================================================
  projects: router({
    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          categoryId: z.number().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          tags: z.string().optional(),
          zettelkastenId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await createProject(ctx.user.id, input);
      }),
    list: protectedProcedure
      .input(
        z.object({
          status: z.enum(["active", "completed", "archived", "on-hold"]).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await listProjects(ctx.user.id, { status: input.status });
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getProject(ctx.user.id, input.id);
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          status: z.enum(["active", "completed", "archived", "on-hold"]).optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          tags: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await updateProject(ctx.user.id, id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await deleteProject(ctx.user.id, input.id);
      }),
  }),

  // ============================================================================
  // TASKS (Action Layer - Phase 5)
  // ============================================================================
  tasks: router({
    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          categoryId: z.number().optional(),
          projectId: z.number().optional(),
          status: z.enum(["todo", "in-progress", "completed", "blocked"]).optional(),
          priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
          dueDate: z.date().optional(),
          tags: z.string().optional(),
          zettelkastenId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await createTask(ctx.user.id, input);
      }),
    list: protectedProcedure
      .input(
        z.object({
          projectId: z.number().optional(),
          status: z.enum(["todo", "in-progress", "completed", "blocked"]).optional(),
          priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await listTasks(ctx.user.id, input);
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getTask(ctx.user.id, input.id);
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          status: z.enum(["todo", "in-progress", "completed", "blocked"]).optional(),
          priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
          dueDate: z.date().optional(),
          completedDate: z.date().optional(),
          tags: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await updateTask(ctx.user.id, id, data);
      }),
     delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await deleteTask(ctx.user.id, input.id);
      }),
  }),

  // ============================================================================
  // BULK IMPORT MODULE
  // ============================================================================
  bulkImport: router({
    notebookJSON: protectedProcedure
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
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await bulkImportNotebookEntries(ctx.user.id, input.entries, {
          autoCategory: input.autoCategory,
        });
      }),

    lexiconJSON: protectedProcedure
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
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await bulkImportLexiconEntries(ctx.user.id, input.entries, {
          autoCategory: input.autoCategory,
        });
      }),

    notebookCSV: protectedProcedure
      .input(
        z.object({
          csvContent: z.string(),
          columnMapping: z.record(z.string(), z.number()),
          autoCategory: z.boolean().optional(),
          skipHeader: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await bulkImportNotebookFromCSV(
          ctx.user.id,
          input.csvContent,
          input.columnMapping,
          {
            autoCategory: input.autoCategory,
            skipHeader: input.skipHeader,
          }
        );
      }),

    lexiconCSV: protectedProcedure
      .input(
        z.object({
          csvContent: z.string(),
          columnMapping: z.record(z.string(), z.number()),
          autoCategory: z.boolean().optional(),
          skipHeader: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await bulkImportLexiconFromCSV(
          ctx.user.id,
          input.csvContent,
          input.columnMapping,
          {
            autoCategory: input.autoCategory,
            skipHeader: input.skipHeader,
          }
        );
      }),

    notebookText: protectedProcedure
      .input(
        z.object({
          textContent: z.string(),
          autoCategory: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await bulkImportNotebookFromText(ctx.user.id, input.textContent, {
          autoCategory: input.autoCategory,
        });
      }),

    lexiconText: protectedProcedure
      .input(
        z.object({
          textContent: z.string(),
          autoCategory: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await bulkImportLexiconFromText(ctx.user.id, input.textContent, {
          autoCategory: input.autoCategory,
        });
      }),
    ...duplicateDetectionRouter._def.procedures,
  }),
});
export type AppRouter = typeof appRouter;

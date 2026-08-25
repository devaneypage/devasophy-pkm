import { eq, and, like, desc, asc, between, count, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  notebookEntries,
  lexiconEntries,
  documents,
  semanticLinks,
  tags,
  entryTags,
  taxonomyAreas,
  taxonomyCategories,
  importHistory,
  exportHistory,
  searchIndex,
  goals,
  projects,
  tasks,
  ideas,
  books,
  commonplaceBoards,
  commonplaceColumns,
  commonplaceEntries,
  workspaceFeatureFlags,
  type InsertCommonplaceBoard,
  type InsertCommonplaceColumn,
  type InsertCommonplaceEntry,
  type CommonplaceEntryType,
  type InsertWorkspaceFeatureFlag,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { johnnyDecimalModuleDefaults, johnnyDecimalSeeds } from "../shared/johnnyDecimal";
import {
  COMMONPLACE_WORKSPACE_FLAG,
  getWorkspaceFeatureFlagDefinition,
  isKnownWorkspaceFeatureFlag,
  workspaceFeatureFlagDefinitions,
  type WorkspaceFeatureFlagKey,
} from "../shared/featureFlags";
import { buildPageInfo } from "../shared/pagination";
import {
  groupDedupComparableRecords,
  mergeLexiconEntries,
  mergeNotebookEntries,
  normalizeText,
  normalizeBookRecord,
  normalizeCommonplaceRecord,
  normalizeDocumentRecord,
  normalizeIdeaRecord,
  normalizeLexiconRecord,
  type DedupComparableRecord,
  type DedupGroup,
  type DedupModule,
} from "./duplicateDetection";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// NOTEBOOK ENTRIES
// ============================================================================

export async function createNotebookEntry(userId: number, entry: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notebookEntries).values({
    userId,
    ...entry,
  });
  return result;
}

export type NotebookListFilters = {
  categoryId?: number;
  search?: string;
  sortBy?: "recent" | "oldest";
  page?: number;
  pageSize?: number;
};

function buildNotebookConditions(userId: number, filters?: Omit<NotebookListFilters, "page" | "pageSize">) {
  const conditions = [eq(notebookEntries.userId, userId)];

  if (filters?.categoryId) {
    conditions.push(eq(notebookEntries.categoryId, filters.categoryId));
  }

  if (filters?.search) {
    conditions.push(like(notebookEntries.text, `%${filters.search}%`));
  }

  return conditions;
}

export async function getNotebookEntries(userId: number, filters?: NotebookListFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 25;
  const conditions = buildNotebookConditions(userId, filters);
  const orderBy = filters?.sortBy === "recent" 
    ? desc(notebookEntries.createdAt)
    : asc(notebookEntries.createdAt);

  const [totalRow] = await db
    .select({ total: count() })
    .from(notebookEntries)
    .where(and(...conditions));
  const total = totalRow?.total ?? 0;

  const items = await db
    .select()
    .from(notebookEntries)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    items,
    pageInfo: buildPageInfo(total, page, pageSize),
  };
}

export async function getNotebookEntriesForExport(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(notebookEntries)
    .where(eq(notebookEntries.userId, userId))
    .orderBy(asc(notebookEntries.createdAt));
}

export async function getNotebookEntry(userId: number, entryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(notebookEntries)
    .where(and(eq(notebookEntries.userId, userId), eq(notebookEntries.id, entryId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateNotebookEntry(userId: number, entryId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(notebookEntries)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(notebookEntries.userId, userId), eq(notebookEntries.id, entryId)));
}

export async function deleteNotebookEntry(userId: number, entryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .delete(notebookEntries)
    .where(and(eq(notebookEntries.userId, userId), eq(notebookEntries.id, entryId)));
}

// ============================================================================
// LEXICON ENTRIES
// ============================================================================

export async function createLexiconEntry(userId: number, entry: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(lexiconEntries).values({
    userId,
    ...entry,
  });
  return result;
}

export async function getLexiconEntries(userId: number, filters?: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [eq(lexiconEntries.userId, userId)];
  
  if (filters?.categoryId) {
    conditions.push(eq(lexiconEntries.categoryId, filters.categoryId));
  }
  
  if (filters?.search) {
    conditions.push(like(lexiconEntries.term, `%${filters.search}%`));
  }
  
  if (filters?.partOfSpeech) {
    conditions.push(eq(lexiconEntries.partOfSpeech, filters.partOfSpeech));
  }
  
  if (filters?.sourceType) {
    conditions.push(eq(lexiconEntries.sourceType, filters.sourceType));
  }
  
  return await db
    .select()
    .from(lexiconEntries)
    .where(and(...conditions))
    .orderBy(asc(lexiconEntries.term));
}

export async function getLexiconEntry(userId: number, entryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(lexiconEntries)
    .where(and(eq(lexiconEntries.userId, userId), eq(lexiconEntries.id, entryId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateLexiconEntry(userId: number, entryId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(lexiconEntries)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(lexiconEntries.userId, userId), eq(lexiconEntries.id, entryId)));
}

export async function deleteLexiconEntry(userId: number, entryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .delete(lexiconEntries)
    .where(and(eq(lexiconEntries.userId, userId), eq(lexiconEntries.id, entryId)));
}

// ============================================================================
// DOCUMENTS
// ============================================================================

export async function createDocument(userId: number, doc: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(documents).values({
    userId,
    ...doc,
  });
  return result;
}

export async function getDocuments(userId: number, filters?: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [eq(documents.userId, userId)];
  
  if (filters?.categoryId) {
    conditions.push(eq(documents.categoryId, filters.categoryId));
  }
  
  if (filters?.project) {
    conditions.push(eq(documents.project, filters.project));
  }
  
  if (filters?.status) {
    conditions.push(eq(documents.status, filters.status));
  }
  
  return await db
    .select()
    .from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.updatedAt));
}

export async function getDocument(userId: number, docId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(documents)
    .where(and(eq(documents.userId, userId), eq(documents.id, docId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateDocument(userId: number, docId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(documents)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(documents.userId, userId), eq(documents.id, docId)));
}

export async function deleteDocument(userId: number, docId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .delete(documents)
    .where(and(eq(documents.userId, userId), eq(documents.id, docId)));
}

// ============================================================================
// SEMANTIC LINKS
// ============================================================================

export async function createSemanticLink(userId: number, link: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(semanticLinks).values({
    userId,
    ...link,
  });
}

export async function getSemanticLinks(userId: number, sourceType: "notebook" | "lexicon" | "document", sourceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(semanticLinks)
    .where(
      and(
        eq(semanticLinks.userId, userId),
        eq(semanticLinks.sourceType, sourceType),
        eq(semanticLinks.sourceId, sourceId)
      )
    );
}

export async function deleteSemanticLink(userId: number, linkId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .delete(semanticLinks)
    .where(and(eq(semanticLinks.userId, userId), eq(semanticLinks.id, linkId)));
}

export async function getEnrichedDocumentLinks(userId: number, documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const links = await getSemanticLinks(userId, "document", documentId);
  if (links.length === 0) {
    return [];
  }

  const notebookIds = Array.from(new Set(links.filter((link) => link.targetType === "notebook").map((link) => link.targetId)));
  const lexiconIds = Array.from(new Set(links.filter((link) => link.targetType === "lexicon").map((link) => link.targetId)));
  const documentIds = Array.from(new Set(links.filter((link) => link.targetType === "document").map((link) => link.targetId)));

  const [notebookRows, lexiconRows, documentRows] = await Promise.all([
    notebookIds.length > 0
      ? db
          .select()
          .from(notebookEntries)
          .where(and(eq(notebookEntries.userId, userId), inArray(notebookEntries.id, notebookIds)))
      : Promise.resolve([]),
    lexiconIds.length > 0
      ? db
          .select()
          .from(lexiconEntries)
          .where(and(eq(lexiconEntries.userId, userId), inArray(lexiconEntries.id, lexiconIds)))
      : Promise.resolve([]),
    documentIds.length > 0
      ? db
          .select()
          .from(documents)
          .where(and(eq(documents.userId, userId), inArray(documents.id, documentIds)))
      : Promise.resolve([]),
  ]);

  const notebookMap = new Map(
    notebookRows.map((entry) => [
      entry.id,
      {
        title: entry.author ? `${entry.author}${entry.work ? ` — ${entry.work}` : ""}` : entry.work || "Notebook entry",
        preview: entry.note || entry.text,
        excerpt: entry.text,
        href: `/notebook/${entry.id}`,
        metadata: [entry.sourceType, entry.location].filter(Boolean).join(" • "),
      },
    ])
  );

  const lexiconMap = new Map(
    lexiconRows.map((entry) => [
      entry.id,
      {
        title: entry.term,
        preview: entry.definition || entry.notes || "No definition available.",
        excerpt: entry.definition || entry.notes || entry.term,
        href: `/lexicon/${entry.id}`,
        metadata: [entry.partOfSpeech, entry.dikwTier].filter(Boolean).join(" • "),
      },
    ])
  );

  const documentMap = new Map(
    documentRows.map((entry) => [
      entry.id,
      {
        title: entry.title,
        preview: entry.content?.slice(0, 220) || "No document excerpt available.",
        excerpt: entry.content || entry.title,
        href: `/documents`,
        metadata: [entry.project, entry.folder, entry.status].filter(Boolean).join(" • "),
      },
    ])
  );

  return links.map((link) => {
    const target =
      link.targetType === "notebook"
        ? notebookMap.get(link.targetId)
        : link.targetType === "lexicon"
          ? lexiconMap.get(link.targetId)
          : documentMap.get(link.targetId);

    return {
      ...link,
      targetTitle: target?.title || `Linked ${link.targetType} record`,
      targetPreview: target?.preview || "Linked material is no longer available.",
      targetExcerpt: target?.excerpt || "",
      targetHref: target?.href || "/documents",
      targetMetadata: target?.metadata || "",
    };
  });
}

// ============================================================================
// TAXONOMY
// ============================================================================

export async function seedJohnnyDecimalTaxonomy(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existingAreas = await db
    .select()
    .from(taxonomyAreas)
    .where(eq(taxonomyAreas.userId, userId));

  const areaNumbers = new Set(existingAreas.map((area) => area.areaNumber));
  const uniqueAreaSeeds = new Map<number, { areaName: string; description: string }>();

  for (const seed of johnnyDecimalSeeds) {
    if (!uniqueAreaSeeds.has(seed.areaNumber)) {
      uniqueAreaSeeds.set(seed.areaNumber, {
        areaName: seed.areaName,
        description: seed.areaDescription,
      });
    }
  }

  for (const [areaNumber, areaSeed] of Array.from(uniqueAreaSeeds.entries())) {
    if (!areaNumbers.has(areaNumber)) {
      await db.insert(taxonomyAreas).values({
        userId,
        areaNumber,
        areaName: areaSeed.areaName,
        description: areaSeed.description,
      });
    }
  }

  const refreshedAreas = await db
    .select()
    .from(taxonomyAreas)
    .where(eq(taxonomyAreas.userId, userId));

  const areaByNumber = new Map(refreshedAreas.map((area) => [area.areaNumber, area]));

  const existingCategories = await db
    .select()
    .from(taxonomyCategories)
    .where(eq(taxonomyCategories.userId, userId));

  const categoryNumbers = new Set(existingCategories.map((category) => category.categoryNumber));

  for (const seed of johnnyDecimalSeeds) {
    if (categoryNumbers.has(seed.categoryNumber)) {
      continue;
    }

    const area = areaByNumber.get(seed.areaNumber);
    if (!area) {
      continue;
    }

    await db.insert(taxonomyCategories).values({
      userId,
      areaId: area.id,
      categoryNumber: seed.categoryNumber,
      categoryName: seed.categoryName,
      description: seed.categoryDescription,
    });
  }
}

export async function getTaxonomyAreas(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await seedJohnnyDecimalTaxonomy(userId);

  return await db
    .select()
    .from(taxonomyAreas)
    .where(eq(taxonomyAreas.userId, userId))
    .orderBy(asc(taxonomyAreas.areaNumber));
}

export async function getTaxonomyCategories(userId: number, areaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await seedJohnnyDecimalTaxonomy(userId);

  return await db
    .select()
    .from(taxonomyCategories)
    .where(
      and(
        eq(taxonomyCategories.userId, userId),
        eq(taxonomyCategories.areaId, areaId)
      )
    )
    .orderBy(asc(taxonomyCategories.categoryNumber));
}

export async function getTaxonomyCategoryIdByNumber(userId: number, categoryNumber: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await seedJohnnyDecimalTaxonomy(userId);

  const rows = await db
    .select({ id: taxonomyCategories.id })
    .from(taxonomyCategories)
    .where(
      and(
        eq(taxonomyCategories.userId, userId),
        eq(taxonomyCategories.categoryNumber, categoryNumber)
      )
    );

  return rows[0]?.id ?? null;
}

export async function getTaxonomyTree(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await seedJohnnyDecimalTaxonomy(userId);

  const [areas, categories, notebookRows, lexiconRows, documentRows, projectRows, taskRows] = await Promise.all([
    db
      .select()
      .from(taxonomyAreas)
      .where(eq(taxonomyAreas.userId, userId))
      .orderBy(asc(taxonomyAreas.areaNumber)),
    db
      .select()
      .from(taxonomyCategories)
      .where(eq(taxonomyCategories.userId, userId))
      .orderBy(asc(taxonomyCategories.categoryNumber)),
    db.select({ categoryId: notebookEntries.categoryId }).from(notebookEntries).where(eq(notebookEntries.userId, userId)),
    db.select({ categoryId: lexiconEntries.categoryId }).from(lexiconEntries).where(eq(lexiconEntries.userId, userId)),
    db.select({ categoryId: documents.categoryId }).from(documents).where(eq(documents.userId, userId)),
    db.select({ categoryId: projects.categoryId }).from(projects).where(eq(projects.userId, userId)),
    db.select({ categoryId: tasks.categoryId }).from(tasks).where(eq(tasks.userId, userId)),
  ]);

  const categoryCountMap = new Map<number, number>();

  [notebookRows, lexiconRows, documentRows, projectRows, taskRows].forEach((rows) => {
    rows.forEach((row) => {
      if (!row.categoryId) {
        return;
      }

      categoryCountMap.set(row.categoryId, (categoryCountMap.get(row.categoryId) ?? 0) + 1);
    });
  });

  return areas.map((area) => {
    const areaCategories = categories
      .filter((category) => category.areaId === area.id)
      .map((category) => ({
        ...category,
        count: categoryCountMap.get(category.id) ?? 0,
      }));

    return {
      ...area,
      count: areaCategories.reduce((sum, category) => sum + category.count, 0),
      categories: areaCategories,
    };
  });
}

// ============================================================================
// SEARCH
// ============================================================================

export async function searchAllModules(userId: number, query: string, filters?: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const searchTerm = `%${query}%`;
  
  const notebookResults = await db
    .select()
    .from(notebookEntries)
    .where(
      and(
        eq(notebookEntries.userId, userId),
        like(notebookEntries.text, searchTerm)
      )
    );
  
  const lexiconResults = await db
    .select()
    .from(lexiconEntries)
    .where(
      and(
        eq(lexiconEntries.userId, userId),
        like(lexiconEntries.term, searchTerm)
      )
    );
  
  const documentResults = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.userId, userId),
        like(documents.title, searchTerm)
      )
    );
  
  return {
    notebook: notebookResults,
    lexicon: lexiconResults,
    documents: documentResults,
  };
}


// ============================================================================
// Goals Module (Action Layer)
// ============================================================================

export async function createGoal(
  userId: number,
  data: {
    title: string;
    description?: string;
    categoryId?: number;
    status?: string;
    horizon?: string;
    targetDate?: Date;
    tags?: string;
    linkedProjectId?: number;
    zettelkastenId?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { v4: uuidv4 } = await import("uuid");
  const result = await db.insert(goals).values({
    userId,
    uuid: uuidv4(),
    title: data.title,
    description: data.description,
    categoryId: data.categoryId,
    status: (data.status || "active") as any,
    horizon: (data.horizon || "seasonal") as any,
    targetDate: data.targetDate,
    tags: data.tags,
    linkedProjectId: data.linkedProjectId,
    zettelkastenId: data.zettelkastenId,
  });

  return result;
}

export async function getGoal(userId: number, goalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.id, goalId)))
    .limit(1)
    .then((rows) => rows[0]);
}

export async function listGoals(
  userId: number,
  filters?: { status?: string; horizon?: string; linkedProjectId?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(goals.userId, userId)];

  if (filters?.status) {
    conditions.push(eq(goals.status, filters.status as any));
  }
  if (filters?.horizon) {
    conditions.push(eq(goals.horizon, filters.horizon as any));
  }
  if (filters?.linkedProjectId) {
    conditions.push(eq(goals.linkedProjectId, filters.linkedProjectId));
  }

  return db
    .select()
    .from(goals)
    .where(and(...conditions))
    .orderBy(asc(goals.targetDate), desc(goals.createdAt));
}

export async function updateGoal(
  userId: number,
  goalId: number,
  data: Partial<{
    title: string;
    description: string;
    status: "active" | "achieved" | "paused" | "archived";
    horizon: "immediate" | "seasonal" | "annual" | "long_term";
    targetDate: Date;
    tags: string;
    linkedProjectId: number;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, any> = { updatedAt: new Date() };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.horizon !== undefined) updateData.horizon = data.horizon;
  if (data.targetDate !== undefined) updateData.targetDate = data.targetDate;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.linkedProjectId !== undefined) updateData.linkedProjectId = data.linkedProjectId;

  return db
    .update(goals)
    .set(updateData)
    .where(and(eq(goals.userId, userId), eq(goals.id, goalId)));
}

export async function deleteGoal(userId: number, goalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .delete(goals)
    .where(and(eq(goals.userId, userId), eq(goals.id, goalId)));
}

// ============================================================================
// Projects Module (Action Layer)
// ============================================================================

export async function createProject(
  userId: number,
  data: {
    title: string;
    description?: string;
    categoryId?: number;
    startDate?: Date;
    endDate?: Date;
    tags?: string;
    zettelkastenId?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { v4: uuidv4 } = await import("uuid");
  const result = await db.insert(projects).values({
    userId,
    uuid: uuidv4(),
    title: data.title,
    description: data.description,
    categoryId: data.categoryId,
    startDate: data.startDate,
    endDate: data.endDate,
    tags: data.tags,
    zettelkastenId: data.zettelkastenId,
  });

  return result;
}

export async function getProject(userId: number, projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.id, projectId)))
    .limit(1)
    .then((rows) => rows[0]);
}

export async function listProjects(userId: number, filters?: { status?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query: any = db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId));

  if (filters?.status) {
    query = query.where(eq(projects.status, filters.status as any));
  }

  return query.orderBy(desc(projects.createdAt));
}

export async function updateProject(
  userId: number,
  projectId: number,
  data: Partial<{
    title: string;
    description: string;
    status: "active" | "completed" | "archived" | "on-hold";
    startDate: Date;
    endDate: Date;
    tags: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, any> = { updatedAt: new Date() };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.endDate !== undefined) updateData.endDate = data.endDate;
  if (data.tags !== undefined) updateData.tags = data.tags;

  return db
    .update(projects)
    .set(updateData)
    .where(and(eq(projects.userId, userId), eq(projects.id, projectId)));
}

export async function deleteProject(userId: number, projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .delete(projects)
    .where(and(eq(projects.userId, userId), eq(projects.id, projectId)));
}

// ============================================================================
// Tasks Module (Action Layer)
// ============================================================================

export async function createTask(
  userId: number,
  data: {
    title: string;
    description?: string;
    categoryId?: number;
    projectId?: number;
    status?: string;
    priority?: string;
    dueDate?: Date;
    tags?: string;
    zettelkastenId?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { v4: uuidv4 } = await import("uuid");
  const result = await db.insert(tasks).values({
    userId,
    uuid: uuidv4(),
    title: data.title,
    description: data.description,
    categoryId: data.categoryId,
    projectId: data.projectId,
    status: (data.status || "todo") as any,
    priority: (data.priority || "medium") as any,
    dueDate: data.dueDate,
    tags: data.tags,
    zettelkastenId: data.zettelkastenId,
  });

  return result;
}

export async function getTask(userId: number, taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)))
    .limit(1)
    .then((rows) => rows[0]);
}

export async function listTasks(
  userId: number,
  filters?: { projectId?: number; status?: string; priority?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(tasks.userId, userId)];

  if (filters?.projectId) {
    conditions.push(eq(tasks.projectId, filters.projectId));
  }
  if (filters?.status) {
    conditions.push(eq(tasks.status, filters.status as any));
  }
  if (filters?.priority) {
    conditions.push(eq(tasks.priority, filters.priority as any));
  }

  return db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(asc(tasks.dueDate), desc(tasks.createdAt));
}

export async function updateTask(
  userId: number,
  taskId: number,
  data: Partial<{
    title: string;
    description: string;
    status: "todo" | "in-progress" | "completed" | "blocked";
    priority: "low" | "medium" | "high" | "urgent";
    dueDate: Date;
    completedDate: Date;
    tags: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, any> = { updatedAt: new Date() };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
  if (data.completedDate !== undefined) updateData.completedDate = data.completedDate;
  if (data.tags !== undefined) updateData.tags = data.tags;

  return db
    .update(tasks)
    .set(updateData)
    .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)));
}

export async function deleteTask(userId: number, taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .delete(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)));
}

// ============================================================================
// Ideas Module (Synthesis Layer)
// ============================================================================

export async function createIdea(
  userId: number,
  data: {
    title: string;
    summary?: string;
    categoryId?: number;
    linkedGoalId?: number;
    status?: string;
    dikwTier?: string;
    sparkType?: string;
    sourceModule?: string;
    insightStage?: string;
    tags?: string;
    linkedEntries?: string;
    zettelkastenId?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { v4: uuidv4 } = await import("uuid");
  return db.insert(ideas).values({
    userId,
    uuid: uuidv4(),
    title: data.title,
    summary: data.summary,
    categoryId: data.categoryId,
    linkedGoalId: data.linkedGoalId,
    status: (data.status || "seed") as any,
    dikwTier: (data.dikwTier || "knowledge") as any,
    sparkType: (data.sparkType || "theme") as any,
    sourceModule: (data.sourceModule || "manual") as any,
    insightStage: (data.insightStage || "capture") as any,
    tags: data.tags,
    linkedEntries: data.linkedEntries,
    zettelkastenId: data.zettelkastenId,
  });
}

export async function getIdea(userId: number, ideaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(ideas)
    .where(and(eq(ideas.userId, userId), eq(ideas.id, ideaId)))
    .limit(1)
    .then((rows) => rows[0]);
}

export async function listIdeas(
  userId: number,
  filters?: {
    status?: string;
    dikwTier?: string;
    sparkType?: string;
    insightStage?: string;
    linkedGoalId?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(ideas.userId, userId)];

  if (filters?.status) {
    conditions.push(eq(ideas.status, filters.status as any));
  }
  if (filters?.dikwTier) {
    conditions.push(eq(ideas.dikwTier, filters.dikwTier as any));
  }
  if (filters?.sparkType) {
    conditions.push(eq(ideas.sparkType, filters.sparkType as any));
  }
  if (filters?.insightStage) {
    conditions.push(eq(ideas.insightStage, filters.insightStage as any));
  }
  if (filters?.linkedGoalId) {
    conditions.push(eq(ideas.linkedGoalId, filters.linkedGoalId));
  }

  return db
    .select()
    .from(ideas)
    .where(and(...conditions))
    .orderBy(desc(ideas.updatedAt), desc(ideas.createdAt));
}

export async function updateIdea(
  userId: number,
  ideaId: number,
  data: Partial<{
    title: string;
    summary: string;
    status: "seed" | "germinating" | "incubating" | "developed" | "archived";
    dikwTier: "data" | "information" | "knowledge" | "wisdom";
    sparkType: "question" | "theme" | "argument" | "framework" | "experiment";
    sourceModule: "notebook" | "lexicon" | "documents" | "goals" | "manual";
    insightStage: "capture" | "connection" | "synthesis" | "expression";
    tags: string;
    linkedGoalId: number;
    linkedEntries: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, any> = { updatedAt: new Date() };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.summary !== undefined) updateData.summary = data.summary;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.dikwTier !== undefined) updateData.dikwTier = data.dikwTier;
  if (data.sparkType !== undefined) updateData.sparkType = data.sparkType;
  if (data.sourceModule !== undefined) updateData.sourceModule = data.sourceModule;
  if (data.insightStage !== undefined) updateData.insightStage = data.insightStage;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.linkedGoalId !== undefined) updateData.linkedGoalId = data.linkedGoalId;
  if (data.linkedEntries !== undefined) updateData.linkedEntries = data.linkedEntries;

  return db
    .update(ideas)
    .set(updateData)
    .where(and(eq(ideas.userId, userId), eq(ideas.id, ideaId)));
}

export async function deleteIdea(userId: number, ideaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .delete(ideas)
    .where(and(eq(ideas.userId, userId), eq(ideas.id, ideaId)));
}


// ============================================================================
// BULK IMPORT PROCEDURES
// ============================================================================

/**
 * Auto-categorize entries based on content analysis
 * Maps content keywords to Johnny Decimal categories
 */
export function categorizeEntryContent(text: string, entryType: 'notebook' | 'lexicon'): string | null {
  // Simple keyword-based categorization
  // In production, this could use ML or more sophisticated NLP

  const lowerText = text.toLowerCase();

  if (entryType === 'notebook') {
    if (lowerText.includes('quote') || lowerText.includes('passage') || lowerText.includes('excerpt')) {
      return johnnyDecimalModuleDefaults.notebookQuote;
    }
    if (lowerText.includes('observation') || lowerText.includes('note') || lowerText.includes('thought')) {
      return johnnyDecimalModuleDefaults.notebookNote;
    }
    if (lowerText.includes('insight') || lowerText.includes('discovery') || lowerText.includes('realization')) {
      return "44.03";
    }
    return johnnyDecimalModuleDefaults.notebookQuote;
  } else if (entryType === 'lexicon') {
    if (lowerText.includes('etymology') || lowerText.includes('origin') || lowerText.includes('root')) {
      return johnnyDecimalModuleDefaults.lexiconEtymology;
    }
    if (lowerText.includes('concordance') || lowerText.includes('reference') || lowerText.includes('index')) {
      return johnnyDecimalModuleDefaults.lexiconConcordance;
    }
    if (lowerText.includes('term') || lowerText.includes('word') || lowerText.includes('vocabulary')) {
      return johnnyDecimalModuleDefaults.lexiconGeneral;
    }
    return johnnyDecimalModuleDefaults.lexiconGeneral;
  }

  return null;
}

/**
 * Bulk import notebook entries from JSON
 */
export async function bulkImportNotebookEntries(
  userId: number,
  entries: Array<{
    text: string;
    author?: string;
    work?: string;
    sourceType?: string;
    location?: string;
    note?: string;
    tags?: string;
    collections?: string;
    favorite?: boolean;
  }>,
  options?: {
    autoCategory?: boolean;
    generateIds?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const entry of entries) {
    try {
      if (!entry.text) {
        results.failed++;
        results.errors.push("Entry text is required");
        continue;
      }

      const uuid = `uuid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const categoryNumber = options?.autoCategory ? categorizeEntryContent(entry.text, 'notebook') : undefined;
      const categoryId = categoryNumber ? (await getTaxonomyCategoryIdByNumber(userId, categoryNumber)) ?? undefined : undefined;

      await db.insert(notebookEntries).values({
        userId,
        uuid,
        categoryId: categoryId || undefined,
        text: entry.text,
        author: entry.author,
        work: entry.work,
        sourceType: entry.sourceType,
        location: entry.location,
        note: entry.note,
        tags: entry.tags,
        collections: entry.collections,
        favorite: entry.favorite || false,
      });

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to import entry: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return results;
}

/**
 * Bulk import lexicon entries from JSON
 */
export async function bulkImportLexiconEntries(
  userId: number,
  entries: Array<{
    term: string;
    partOfSpeech?: string;
    definition?: string;
    etymology?: string;
    origin?: string;
    sourceType?: string;
    imageNum?: string;
    notes?: string;
    dikwTier?: string;
  }>,
  options?: {
    autoCategory?: boolean;
    generateIds?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const entry of entries) {
    try {
      if (!entry.term) {
        results.failed++;
        results.errors.push("Term is required");
        continue;
      }

      const categoryNumber = options?.autoCategory ? categorizeEntryContent(entry.definition || entry.term, 'lexicon') : undefined;
      const categoryId = categoryNumber ? (await getTaxonomyCategoryIdByNumber(userId, categoryNumber)) ?? undefined : undefined;

      await db.insert(lexiconEntries).values({
        userId,
        categoryId: categoryId || undefined,
        term: entry.term,
        partOfSpeech: entry.partOfSpeech,
        definition: entry.definition,
        etymology: entry.etymology,
        origin: entry.origin,
        sourceType: entry.sourceType,
        imageNum: entry.imageNum,
        notes: entry.notes,
        dikwTier: entry.dikwTier || 'information',
      });

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to import term: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return results;
}

/**
 * Parse CSV data into rows
 */
export function parseCSV(csvContent: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // Skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(field => field)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      }
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip \n in \r\n
      }
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Bulk import notebook entries from CSV
 */
export async function bulkImportNotebookFromCSV(
  userId: number,
  csvContent: string,
  columnMapping: Record<string, number>,
  options?: {
    autoCategory?: boolean;
    skipHeader?: boolean;
  }
) {
  const rows = parseCSV(csvContent);
  const startRow = options?.skipHeader ? 1 : 0;
  const entries: Parameters<typeof bulkImportNotebookEntries>[1] = [];

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    const entry: Parameters<typeof bulkImportNotebookEntries>[1][0] = {
      text: row[columnMapping.text] || '',
      author: row[columnMapping.author] || undefined,
      work: row[columnMapping.work] || undefined,
      sourceType: row[columnMapping.sourceType] || undefined,
      location: row[columnMapping.location] || undefined,
      note: row[columnMapping.note] || undefined,
      tags: row[columnMapping.tags] || undefined,
      collections: row[columnMapping.collections] || undefined,
      favorite: row[columnMapping.favorite]?.toLowerCase() === 'true',
    };
    entries.push(entry);
  }

  return bulkImportNotebookEntries(userId, entries, options);
}

/**
 * Bulk import lexicon entries from CSV
 */
export async function bulkImportLexiconFromCSV(
  userId: number,
  csvContent: string,
  columnMapping: Record<string, number>,
  options?: {
    autoCategory?: boolean;
    skipHeader?: boolean;
  }
) {
  const rows = parseCSV(csvContent);
  const startRow = options?.skipHeader ? 1 : 0;
  const entries: Parameters<typeof bulkImportLexiconEntries>[1] = [];

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    const entry: Parameters<typeof bulkImportLexiconEntries>[1][0] = {
      term: row[columnMapping.term] || '',
      partOfSpeech: row[columnMapping.partOfSpeech] || undefined,
      definition: row[columnMapping.definition] || undefined,
      etymology: row[columnMapping.etymology] || undefined,
      origin: row[columnMapping.origin] || undefined,
      sourceType: row[columnMapping.sourceType] || undefined,
      imageNum: row[columnMapping.imageNum] || undefined,
      notes: row[columnMapping.notes] || undefined,
      dikwTier: row[columnMapping.dikwTier] || 'information',
    };
    entries.push(entry);
  }

  return bulkImportLexiconEntries(userId, entries, options);
}

/**
 * Parse plain text entries (one per line)
 */
export function parseTextLines(textContent: string, delimiter: string = '\n'): string[] {
  return textContent
    .split(delimiter)
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * Bulk import notebook entries from plain text
 */
export async function bulkImportNotebookFromText(
  userId: number,
  textContent: string,
  options?: {
    autoCategory?: boolean;
  }
) {
  const lines = parseTextLines(textContent);
  const entries: Parameters<typeof bulkImportNotebookEntries>[1] = lines.map(line => ({
    text: line,
  }));

  return bulkImportNotebookEntries(userId, entries, options);
}

/**
 * Bulk import lexicon entries from plain text
 */
export async function bulkImportLexiconFromText(
  userId: number,
  textContent: string,
  options?: {
    autoCategory?: boolean;
  }
) {
  const lines = parseTextLines(textContent);
  const entries: Parameters<typeof bulkImportLexiconEntries>[1] = lines.map(line => ({
    term: line,
  }));

  return bulkImportLexiconEntries(userId, entries, options);
}


/**
 * Bulk import notebook entries with duplicate detection
 */
export async function bulkImportNotebookWithDuplicateDetection(
  userId: number,
  entries: Array<{
    text: string;
    author?: string;
    work?: string;
    sourceType?: string;
    location?: string;
    note?: string;
    tags?: string;
    collections?: string;
    favorite?: boolean;
  }>,
  options?: {
    autoCategory?: boolean;
    generateIds?: boolean;
    onDuplicate?: "skip" | "merge" | "replace";
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Import the duplicate detection functions
  const { detectNotebookDuplicates, mergeNotebookEntries } = await import("./duplicateDetection");

  // Get existing entries for comparison
  const existingEntriesRaw = await db
    .select({ id: notebookEntries.id, text: notebookEntries.text, author: notebookEntries.author })
    .from(notebookEntries)
    .where(eq(notebookEntries.userId, userId));

  const existingEntries = existingEntriesRaw.map((e) => ({
    id: e.id,
    text: e.text,
    author: e.author || undefined,
  }));

  const results = {
    successful: 0,
    failed: 0,
    duplicatesFound: 0,
    duplicatesMerged: 0,
    errors: [] as string[],
    duplicates: [] as Array<{
      incomingIndex: number;
      incomingText: string;
      matchedEntryId: number;
      matchedText: string;
      similarity: number;
      action: string;
    }>,
  };

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    try {
      if (!entry.text) {
        results.failed++;
        results.errors.push(`Entry ${i}: text is required`);
        continue;
      }

      // Check for duplicates
      const duplicates = detectNotebookDuplicates(
        { text: entry.text, author: entry.author || undefined },
        existingEntries
      );

      if (duplicates.length > 0) {
        results.duplicatesFound++;
        const duplicate = duplicates[0]; // Most similar match

        results.duplicates.push({
          incomingIndex: i,
          incomingText: entry.text,
          matchedEntryId: duplicate.existingId,
          matchedText: duplicate.existingText,
          similarity: duplicate.similarity,
          action: options?.onDuplicate || "skip",
        });

        if (options?.onDuplicate === "merge") {
          // Merge with existing entry
          const existingEntry = existingEntries.find((e) => e.id === duplicate.existingId);
          if (existingEntry) {
            const merged = mergeNotebookEntries(
              {
                id: existingEntry.id,
                text: existingEntry.text,
                author: existingEntry.author,
              },
              entry,
              "merge_fields"
            );

            // Update the existing entry with merged data
            await db
              .update(notebookEntries)
              .set(merged.mergedEntry)
              .where(eq(notebookEntries.id, existingEntry.id));

            results.duplicatesMerged++;
            results.successful++;
          }
        } else if (options?.onDuplicate === "replace") {
          // Replace existing entry
          await db
            .update(notebookEntries)
            .set(entry)
            .where(eq(notebookEntries.id, duplicate.existingId));

          results.duplicatesMerged++;
          results.successful++;
        } else {
          // Skip (default)
          results.failed++;
          results.errors.push(`Entry ${i}: duplicate of entry ${duplicate.existingId} (similarity: ${(duplicate.similarity * 100).toFixed(1)}%)`);
        }
      } else {
        // No duplicate, insert normally
        const uuid = `uuid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const categoryNumber = options?.autoCategory
          ? categorizeEntryContent(entry.text, "notebook")
          : undefined;
        const categoryId = categoryNumber
          ? (await getTaxonomyCategoryIdByNumber(userId, categoryNumber)) ?? undefined
          : undefined;

        await db.insert(notebookEntries).values({
          userId,
          uuid,
          categoryId: categoryId || undefined,
          text: entry.text,
          author: entry.author,
          work: entry.work,
          sourceType: entry.sourceType,
          location: entry.location,
          note: entry.note,
          tags: entry.tags,
          collections: entry.collections,
          favorite: entry.favorite || false,
        });

        results.successful++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push(
        `Entry ${i}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return results;
}

/**
 * Bulk import lexicon entries with duplicate detection
 */
export async function bulkImportLexiconWithDuplicateDetection(
  userId: number,
  entries: Array<{
    term: string;
    partOfSpeech?: string;
    definition?: string;
    etymology?: string;
    origin?: string;
    sourceType?: string;
    imageNum?: string;
    notes?: string;
    dikwTier?: string;
  }>,
  options?: {
    autoCategory?: boolean;
    generateIds?: boolean;
    onDuplicate?: "skip" | "merge" | "replace";
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Import the duplicate detection functions
  const { detectLexiconDuplicates, mergeLexiconEntries } = await import("./duplicateDetection");

  // Get existing entries for comparison
  const existingEntriesRaw = await db
    .select({ id: lexiconEntries.id, term: lexiconEntries.term, definition: lexiconEntries.definition })
    .from(lexiconEntries)
    .where(eq(lexiconEntries.userId, userId));

  const existingEntries = existingEntriesRaw.map((e) => ({
    id: e.id,
    term: e.term,
    definition: e.definition || undefined,
  }));

  const results = {
    successful: 0,
    failed: 0,
    duplicatesFound: 0,
    duplicatesMerged: 0,
    errors: [] as string[],
    duplicates: [] as Array<{
      incomingIndex: number;
      incomingTerm: string;
      matchedEntryId: number;
      matchedTerm: string;
      similarity: number;
      action: string;
    }>,
  };

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    try {
      if (!entry.term) {
        results.failed++;
        results.errors.push(`Entry ${i}: term is required`);
        continue;
      }

      // Check for duplicates
      const duplicates = detectLexiconDuplicates(
        { term: entry.term, definition: entry.definition || undefined },
        existingEntries
      );

      if (duplicates.length > 0) {
        results.duplicatesFound++;
        const duplicate = duplicates[0]; // Most similar match

        results.duplicates.push({
          incomingIndex: i,
          incomingTerm: entry.term,
          matchedEntryId: duplicate.existingId,
          matchedTerm: duplicate.existingTerm,
          similarity: duplicate.similarity,
          action: options?.onDuplicate || "skip",
        });

        if (options?.onDuplicate === "merge") {
          // Merge with existing entry
          const existingEntry = existingEntries.find((e) => e.id === duplicate.existingId);
          if (existingEntry) {
            const merged = mergeLexiconEntries(
              {
                id: existingEntry.id,
                term: existingEntry.term,
                definition: existingEntry.definition || undefined,
              },
              entry,
              "merge_fields"
            );

            // Update the existing entry with merged data
            await db
              .update(lexiconEntries)
              .set(merged.mergedEntry)
              .where(eq(lexiconEntries.id, existingEntry.id));

            results.duplicatesMerged++;
            results.successful++;
          }
        } else if (options?.onDuplicate === "replace") {
          // Replace existing entry
          await db
            .update(lexiconEntries)
            .set(entry)
            .where(eq(lexiconEntries.id, duplicate.existingId));

          results.duplicatesMerged++;
          results.successful++;
        } else {
          // Skip (default)
          results.failed++;
          results.errors.push(
            `Entry ${i}: duplicate of entry ${duplicate.existingId} (similarity: ${(duplicate.similarity * 100).toFixed(1)}%)`
          );
        }
      } else {
        // No duplicate, insert normally
        const categoryNumber = options?.autoCategory
          ? categorizeEntryContent(entry.definition || entry.term, "lexicon")
          : undefined;
        const categoryId = categoryNumber
          ? (await getTaxonomyCategoryIdByNumber(userId, categoryNumber)) ?? undefined
          : undefined;

        await db.insert(lexiconEntries).values({
          userId,
          categoryId: categoryId || undefined,
          term: entry.term,
          partOfSpeech: entry.partOfSpeech,
          definition: entry.definition,
          etymology: entry.etymology,
          origin: entry.origin,
          sourceType: entry.sourceType,
          imageNum: entry.imageNum,
          notes: entry.notes,
          dikwTier: entry.dikwTier || "information",
        });

        results.successful++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push(
        `Entry ${i}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return results;
}


// ============================================================================
// COMMONPLACE BOARD SYSTEM
// ============================================================================

export const DEFAULT_COMMONPLACE_COLUMNS = [
  { title: "01 - Foundations", colorToken: "vermillion", position: 0 },
  { title: "02 - Atelier", colorToken: "bright_blue", position: 1 },
  { title: "03 - Archives", colorToken: "green", position: 2 },
  { title: "04 - Network", colorToken: "pink", position: 3 },
  { title: "05 - Drafts", colorToken: "orange", position: 4 },
  { title: "06 - Sources", colorToken: "violet", position: 5 },
] as const;

export type CommonplaceBoardSnapshot = {
  board: Awaited<ReturnType<typeof ensureDefaultCommonplaceBoard>>;
  columns: Array<typeof commonplaceColumns.$inferSelect>;
  entries: Array<typeof commonplaceEntries.$inferSelect>;
};

export async function createCommonplaceBoard(userId: number, input: Pick<InsertCommonplaceBoard, "title" | "description"> & { isDefault?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(commonplaceBoards).values({
    userId,
    title: input.title,
    description: input.description ?? null,
    isDefault: input.isDefault ?? false,
  });

  const createdBoard = await db
    .select()
    .from(commonplaceBoards)
    .where(
      and(
        eq(commonplaceBoards.userId, userId),
        eq(commonplaceBoards.title, input.title),
        eq(commonplaceBoards.isDefault, input.isDefault ?? false)
      )
    )
    .orderBy(desc(commonplaceBoards.id))
    .limit(1);

  if (!createdBoard[0]) {
    throw new Error("Failed to create commonplace board");
  }

  return createdBoard[0];
}

export async function listCommonplaceBoards(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(commonplaceBoards)
    .where(eq(commonplaceBoards.userId, userId))
    .orderBy(desc(commonplaceBoards.isDefault), asc(commonplaceBoards.title));
}

export async function ensureDefaultCommonplaceBoard(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existingBoard = await db
    .select()
    .from(commonplaceBoards)
    .where(and(eq(commonplaceBoards.userId, userId), eq(commonplaceBoards.isDefault, true)))
    .limit(1);

  let board = existingBoard[0];

  if (!board) {
    const created = await createCommonplaceBoard(userId, {
      title: "Commonplace",
      description: "Fresh working board for research notes, books, quotes, and other captures.",
      isDefault: true,
    });

    await db.insert(commonplaceColumns).values(
      DEFAULT_COMMONPLACE_COLUMNS.map((column) => ({
        userId,
        boardId: created.id,
        title: column.title,
        colorToken: column.colorToken,
        position: column.position,
      }))
    );

    const seededBoard = await db
      .select()
      .from(commonplaceBoards)
      .where(eq(commonplaceBoards.id, created.id))
      .limit(1);

    board = seededBoard[0];
  }

  if (!board) {
    throw new Error("Unable to initialize default commonplace board");
  }

  return board;
}

export async function getCommonplaceBoardSnapshot(userId: number, boardId?: number): Promise<CommonplaceBoardSnapshot> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const board = boardId
    ? (
        await db
          .select()
          .from(commonplaceBoards)
          .where(and(eq(commonplaceBoards.userId, userId), eq(commonplaceBoards.id, boardId)))
          .limit(1)
      )[0]
    : await ensureDefaultCommonplaceBoard(userId);

  if (!board) {
    throw new Error("Commonplace board not found");
  }

  const [columns, entries] = await Promise.all([
    db
      .select()
      .from(commonplaceColumns)
      .where(and(eq(commonplaceColumns.userId, userId), eq(commonplaceColumns.boardId, board.id)))
      .orderBy(asc(commonplaceColumns.position), asc(commonplaceColumns.id)),
    db
      .select()
      .from(commonplaceEntries)
      .where(and(eq(commonplaceEntries.userId, userId), eq(commonplaceEntries.boardId, board.id)))
      .orderBy(asc(commonplaceEntries.position), desc(commonplaceEntries.updatedAt)),
  ]);

  return { board, columns, entries };
}

export async function createCommonplaceColumn(userId: number, input: Pick<InsertCommonplaceColumn, "boardId" | "title" | "colorToken"> & { position?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existingColumns = await db
    .select()
    .from(commonplaceColumns)
    .where(and(eq(commonplaceColumns.userId, userId), eq(commonplaceColumns.boardId, input.boardId)))
    .orderBy(desc(commonplaceColumns.position));

  const position = input.position ?? ((existingColumns[0]?.position ?? -1) + 1);

  await db.insert(commonplaceColumns).values({
    userId,
    boardId: input.boardId,
    title: input.title,
    colorToken: input.colorToken ?? null,
    position,
  });

  const createdColumn = await db
    .select()
    .from(commonplaceColumns)
    .where(
      and(
        eq(commonplaceColumns.userId, userId),
        eq(commonplaceColumns.boardId, input.boardId),
        eq(commonplaceColumns.title, input.title),
        eq(commonplaceColumns.position, position)
      )
    )
    .orderBy(desc(commonplaceColumns.id))
    .limit(1);

  if (!createdColumn[0]) {
    throw new Error("Failed to create commonplace column");
  }

  return createdColumn[0];
}

export async function updateCommonplaceColumn(userId: number, columnId: number, data: Partial<Pick<InsertCommonplaceColumn, "title" | "colorToken" | "position">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(commonplaceColumns)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(commonplaceColumns.userId, userId), eq(commonplaceColumns.id, columnId)));
}

export async function deleteCommonplaceColumn(userId: number, columnId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(commonplaceColumns)
    .where(and(eq(commonplaceColumns.userId, userId), eq(commonplaceColumns.id, columnId)))
    .limit(1);

  const column = existing[0];
  if (!column) {
    return { success: false } as const;
  }

  const boardColumns = await db
    .select()
    .from(commonplaceColumns)
    .where(and(eq(commonplaceColumns.userId, userId), eq(commonplaceColumns.boardId, column.boardId)))
    .orderBy(asc(commonplaceColumns.position));

  if (boardColumns.length <= 1) {
    throw new Error("Cannot delete the only remaining board column");
  }

  const fallbackColumn = boardColumns.find((item) => item.id !== columnId);
  if (!fallbackColumn) {
    throw new Error("Fallback column not available");
  }

  await db
    .update(commonplaceEntries)
    .set({ columnId: fallbackColumn.id, updatedAt: new Date() })
    .where(and(eq(commonplaceEntries.userId, userId), eq(commonplaceEntries.columnId, columnId)));

  await db
    .delete(commonplaceColumns)
    .where(and(eq(commonplaceColumns.userId, userId), eq(commonplaceColumns.id, columnId)));

  return { success: true } as const;
}

export async function createCommonplaceEntry(
  userId: number,
  input: Pick<InsertCommonplaceEntry, "boardId" | "columnId" | "entryType" | "title" | "summary" | "content" | "metadata" | "tags"> & { position?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existingEntries = await db
    .select()
    .from(commonplaceEntries)
    .where(and(eq(commonplaceEntries.userId, userId), eq(commonplaceEntries.columnId, input.columnId)))
    .orderBy(desc(commonplaceEntries.position));

  const position = input.position ?? ((existingEntries[0]?.position ?? -1) + 1);

  await db.insert(commonplaceEntries).values({
    userId,
    boardId: input.boardId,
    columnId: input.columnId,
    entryType: input.entryType,
    title: input.title,
    summary: input.summary ?? null,
    content: input.content ?? null,
    metadata: input.metadata ?? null,
    tags: input.tags ?? null,
    position,
  });

  const createdEntry = await db
    .select()
    .from(commonplaceEntries)
    .where(
      and(
        eq(commonplaceEntries.userId, userId),
        eq(commonplaceEntries.boardId, input.boardId),
        eq(commonplaceEntries.columnId, input.columnId),
        eq(commonplaceEntries.entryType, input.entryType),
        eq(commonplaceEntries.title, input.title),
        eq(commonplaceEntries.position, position)
      )
    )
    .orderBy(desc(commonplaceEntries.id))
    .limit(1);

  if (!createdEntry[0]) {
    throw new Error("Failed to create commonplace entry");
  }

  return createdEntry[0];
}

export async function updateCommonplaceEntry(
  userId: number,
  entryId: number,
  data: Partial<Pick<InsertCommonplaceEntry, "columnId" | "entryType" | "title" | "summary" | "content" | "metadata" | "tags" | "position">> & { isArchived?: boolean }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(commonplaceEntries)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(commonplaceEntries.userId, userId), eq(commonplaceEntries.id, entryId)));
}

export async function getCommonplaceEntry(userId: number, entryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select()
    .from(commonplaceEntries)
    .where(and(eq(commonplaceEntries.userId, userId), eq(commonplaceEntries.id, entryId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function deleteCommonplaceEntry(userId: number, entryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .delete(commonplaceEntries)
    .where(and(eq(commonplaceEntries.userId, userId), eq(commonplaceEntries.id, entryId)));
}

export async function moveCommonplaceEntry(
  userId: number,
  entryId: number,
  input: {
    columnId: number;
    position: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(commonplaceEntries)
    .set({
      columnId: input.columnId,
      position: input.position,
      updatedAt: new Date(),
    })
    .where(and(eq(commonplaceEntries.userId, userId), eq(commonplaceEntries.id, entryId)));
}

export async function reorderCommonplaceColumns(
  userId: number,
  orderedColumnIds: number[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await Promise.all(
    orderedColumnIds.map((columnId, index) =>
      db
        .update(commonplaceColumns)
        .set({ position: index, updatedAt: new Date() })
        .where(and(eq(commonplaceColumns.userId, userId), eq(commonplaceColumns.id, columnId)))
    )
  );

  return { success: true } as const;
}

export async function listCommonplaceEntries(
  userId: number,
  filters?: {
    boardId?: number;
    columnId?: number;
    entryType?: CommonplaceEntryType;
    search?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(commonplaceEntries.userId, userId)];

  if (filters?.boardId) {
    conditions.push(eq(commonplaceEntries.boardId, filters.boardId));
  }

  if (filters?.columnId) {
    conditions.push(eq(commonplaceEntries.columnId, filters.columnId));
  }

  if (filters?.entryType) {
    conditions.push(eq(commonplaceEntries.entryType, filters.entryType));
  }

  if (filters?.search) {
    conditions.push(like(commonplaceEntries.title, `%${filters.search}%`));
  }

  return db
    .select()
    .from(commonplaceEntries)
    .where(and(...conditions))
    .orderBy(asc(commonplaceEntries.position), desc(commonplaceEntries.updatedAt));
}

export async function saveCommonplaceBoardSnapshot(
  userId: number,
  input: {
    sourceBoardId: number;
    title: string;
    description?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const source = await getCommonplaceBoardSnapshot(userId, input.sourceBoardId);
  const savedBoard = await createCommonplaceBoard(userId, {
    title: input.title,
    description: input.description ?? `Saved snapshot of ${source.board.title}`,
    isDefault: false,
  });

  const columnIdMap = new Map<number, number>();

  for (const column of source.columns) {
    const clonedColumn = await createCommonplaceColumn(userId, {
      boardId: savedBoard.id,
      title: column.title,
      colorToken: column.colorToken ?? undefined,
      position: column.position,
    });

    columnIdMap.set(column.id, clonedColumn.id);
  }

  for (const entry of source.entries) {
    const targetColumnId = columnIdMap.get(entry.columnId);
    if (!targetColumnId) {
      continue;
    }

    await createCommonplaceEntry(userId, {
      boardId: savedBoard.id,
      columnId: targetColumnId,
      entryType: entry.entryType,
      title: entry.title,
      summary: entry.summary ?? undefined,
      content: entry.content ?? undefined,
      metadata: entry.metadata ?? undefined,
      tags: entry.tags ?? undefined,
      position: entry.position,
    });
  }

  return getCommonplaceBoardSnapshot(userId, savedBoard.id);
}

const DEFAULT_WORKSPACE_FEATURE_FLAGS: Array<Pick<InsertWorkspaceFeatureFlag, "flagKey" | "description" | "enabled">> = Object.entries(
  workspaceFeatureFlagDefinitions
).map(([flagKey, definition]) => ({
  flagKey: flagKey as WorkspaceFeatureFlagKey,
  description: definition.description,
  enabled: definition.defaultEnabled,
}));

async function seedWorkspaceFeatureFlags(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(workspaceFeatureFlags)
    .where(eq(workspaceFeatureFlags.userId, userId));

  const existingKeys = new Set(existing.map((flag) => flag.flagKey));
  const missingFlags = DEFAULT_WORKSPACE_FEATURE_FLAGS.filter((flag) => !existingKeys.has(flag.flagKey));

  if (missingFlags.length > 0) {
    await db.insert(workspaceFeatureFlags).values(
      missingFlags.map((flag) => ({
        userId,
        flagKey: flag.flagKey,
        description: flag.description,
        enabled: flag.enabled,
      }))
    );
  }
}

export async function listWorkspaceFeatureFlags(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await seedWorkspaceFeatureFlags(userId);

  return db
    .select()
    .from(workspaceFeatureFlags)
    .where(eq(workspaceFeatureFlags.userId, userId))
    .orderBy(asc(workspaceFeatureFlags.flagKey));
}

export async function getWorkspaceFeatureFlag(userId: number, flagKey: WorkspaceFeatureFlagKey) {
  const flags = await listWorkspaceFeatureFlags(userId);
  const match = flags.find((flag) => flag.flagKey === flagKey);

  return {
    key: flagKey,
    label: getWorkspaceFeatureFlagDefinition(flagKey).label,
    description: getWorkspaceFeatureFlagDefinition(flagKey).description,
    enabled: match?.enabled ?? getWorkspaceFeatureFlagDefinition(flagKey).defaultEnabled,
  };
}

export async function isCommonplaceWorkspaceEnabled(userId: number) {
  const commonplaceFlag = await getWorkspaceFeatureFlag(userId, COMMONPLACE_WORKSPACE_FLAG);
  return commonplaceFlag.enabled;
}

export async function updateWorkspaceFeatureFlag(userId: number, flagKey: WorkspaceFeatureFlagKey, enabled: boolean) {
  if (!isKnownWorkspaceFeatureFlag(flagKey)) {
    throw new Error(`Unknown workspace feature flag: ${flagKey}`);
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await seedWorkspaceFeatureFlags(userId);

  const existing = await db
    .select()
    .from(workspaceFeatureFlags)
    .where(and(eq(workspaceFeatureFlags.userId, userId), eq(workspaceFeatureFlags.flagKey, flagKey)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(workspaceFeatureFlags)
      .set({
        enabled,
        description: getWorkspaceFeatureFlagDefinition(flagKey).description,
        updatedAt: new Date(),
      })
      .where(and(eq(workspaceFeatureFlags.userId, userId), eq(workspaceFeatureFlags.flagKey, flagKey)));
  } else {
    await db.insert(workspaceFeatureFlags).values({
      userId,
      flagKey,
      description: getWorkspaceFeatureFlagDefinition(flagKey).description,
      enabled,
    });
  }

  return getWorkspaceFeatureFlag(userId, flagKey);
}

export type DeduplicationAction = "merge" | "archive" | "delete";

export type DeduplicationApplyInput = {
  canonicalKey: string;
  targetKeys: string[];
  action: DeduplicationAction;
};

function uniqueCsv(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .flatMap((value) => (value ?? "").split(","))
        .map((value) => value.trim())
        .filter(Boolean)
    )
  ).join(",");
}

function parseMaybeJsonArray(value: unknown) {
  if (!value) return [] as string[];
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value !== "string") return [String(value)];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => JSON.stringify(item)) : [value];
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
}

function mergeStringArrays(left: unknown, right: unknown) {
  return JSON.stringify(Array.from(new Set([...parseMaybeJsonArray(left), ...parseMaybeJsonArray(right)])));
}

function appendDistinctText(primary?: string | null, secondary?: string | null) {
  const left = primary?.trim();
  const right = secondary?.trim();
  if (!left) return right ?? undefined;
  if (!right || normalizeText(left) === normalizeText(right)) return left;
  return `${left}\n\n---\n\n${right}`;
}

function parseDedupKey(key: string): { module: DedupModule; id: number } {
  const [module, rawId] = key.split(":");
  const id = Number(rawId);
  if (!module || Number.isNaN(id)) {
    throw new Error(`Invalid deduplication key: ${key}`);
  }
  return { module: module as DedupModule, id };
}

function mergeCommonplaceEntriesForDedup(existing: Record<string, any>, incoming: Record<string, any>) {
  const existingMetadata = existing.metadata && typeof existing.metadata === "object" ? existing.metadata : {};
  const incomingMetadata = incoming.metadata && typeof incoming.metadata === "object" ? incoming.metadata : {};

  return {
    title: existing.title,
    summary: appendDistinctText(existing.summary, incoming.summary),
    content: existing.content ?? incoming.content ?? null,
    metadata: { ...incomingMetadata, ...existingMetadata },
    tags: uniqueCsv([existing.tags, incoming.tags]),
    isArchived: false,
  };
}

function mergeBookEntriesForDedup(existing: Record<string, any>, incoming: Record<string, any>) {
  const statusRank: Record<string, number> = {
    want_to_read: 0,
    reading: 1,
    completed: 2,
  };

  const bestStatus = (statusRank[incoming.status] ?? -1) > (statusRank[existing.status] ?? -1)
    ? incoming.status
    : existing.status;

  return {
    title: existing.title,
    author: existing.author ?? incoming.author ?? null,
    notes: appendDistinctText(existing.notes, incoming.notes),
    tags: uniqueCsv([existing.tags, incoming.tags]),
    rating: existing.rating ?? incoming.rating ?? null,
    readingProgress: Math.max(Number(existing.readingProgress ?? 0), Number(incoming.readingProgress ?? 0)),
    status: bestStatus,
  };
}

function mergeDocumentEntriesForDedup(existing: Record<string, any>, incoming: Record<string, any>) {
  return {
    title: existing.title,
    content: appendDistinctText(existing.content, incoming.content),
    project: existing.project ?? incoming.project ?? null,
    folder: existing.folder ?? incoming.folder ?? null,
    status: existing.status === "archived" && incoming.status !== "archived" ? incoming.status : existing.status,
  };
}

function mergeIdeaEntriesForDedup(existing: Record<string, any>, incoming: Record<string, any>) {
  return {
    title: existing.title,
    summary: appendDistinctText(existing.summary, incoming.summary),
    tags: uniqueCsv([existing.tags, incoming.tags]),
    linkedEntries: mergeStringArrays(existing.linkedEntries, incoming.linkedEntries),
    linkedGoalId: existing.linkedGoalId ?? incoming.linkedGoalId ?? null,
    sourceModule: existing.sourceModule ?? incoming.sourceModule,
    status: existing.status === "archived" && incoming.status !== "archived" ? incoming.status : existing.status,
  };
}

export async function listDedupComparableRecords(userId: number): Promise<DedupComparableRecord[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [commonplaceRows, lexiconRows, bookRows, documentRows, ideaRows] = await Promise.all([
    db.select().from(commonplaceEntries).where(eq(commonplaceEntries.userId, userId)),
    db.select().from(lexiconEntries).where(eq(lexiconEntries.userId, userId)),
    db.select().from(books).where(eq(books.userId, userId)),
    db.select().from(documents).where(eq(documents.userId, userId)),
    db.select().from(ideas).where(eq(ideas.userId, userId)),
  ]);

  return [
    ...commonplaceRows.map((row) => normalizeCommonplaceRecord(row)),
    ...lexiconRows.map((row) => normalizeLexiconRecord(row)),
    ...bookRows.map((row) => normalizeBookRecord(row)),
    ...documentRows.map((row) => normalizeDocumentRecord(row)),
    ...ideaRows.map((row) => normalizeIdeaRecord(row)),
  ];
}

export async function scanDeduplicationGroups(userId: number): Promise<DedupGroup[]> {
  const records = await listDedupComparableRecords(userId);
  return groupDedupComparableRecords(records);
}

async function deleteDedupRecord(userId: number, record: DedupComparableRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  switch (record.module) {
    case "commonplace":
      return deleteCommonplaceEntry(userId, record.id);
    case "lexicon":
      return deleteLexiconEntry(userId, record.id);
    case "book":
      return db.delete(books).where(and(eq(books.userId, userId), eq(books.id, record.id)));
    case "document":
      return deleteDocument(userId, record.id);
    case "idea":
      return deleteIdea(userId, record.id);
    default:
      throw new Error(`Unsupported deduplication module: ${record.module satisfies never}`);
  }
}

async function archiveDedupRecord(userId: number, record: DedupComparableRecord) {
  switch (record.module) {
    case "commonplace":
      return updateCommonplaceEntry(userId, record.id, { isArchived: true });
    case "document":
      return updateDocument(userId, record.id, { status: "archived" });
    case "idea":
      return updateIdea(userId, record.id, { status: "archived" });
    default:
      throw new Error(`Archive is not supported for ${record.module} records`);
  }
}

async function mergeIntoCanonicalRecord(userId: number, canonical: DedupComparableRecord, duplicate: DedupComparableRecord) {
  if (canonical.module !== duplicate.module) {
    throw new Error("Merge is only supported within the same module");
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  switch (canonical.module) {
    case "commonplace": {
      const merged = mergeCommonplaceEntriesForDedup(canonical.raw, duplicate.raw);
      await updateCommonplaceEntry(userId, canonical.id, merged);
      await deleteCommonplaceEntry(userId, duplicate.id);
      return;
    }
    case "lexicon": {
      const merged = mergeLexiconEntries(canonical.raw, duplicate.raw, "merge_fields");
      await updateLexiconEntry(userId, canonical.id, merged.mergedEntry);
      await deleteLexiconEntry(userId, duplicate.id);
      return;
    }
    case "book": {
      const merged = mergeBookEntriesForDedup(canonical.raw, duplicate.raw);
      await db
        .update(books)
        .set({ ...merged, updatedAt: new Date() })
        .where(and(eq(books.userId, userId), eq(books.id, canonical.id)));
      await db.delete(books).where(and(eq(books.userId, userId), eq(books.id, duplicate.id)));
      return;
    }
    case "document": {
      const merged = mergeDocumentEntriesForDedup(canonical.raw, duplicate.raw);
      await updateDocument(userId, canonical.id, merged);
      await deleteDocument(userId, duplicate.id);
      return;
    }
    case "idea": {
      const merged = mergeIdeaEntriesForDedup(canonical.raw, duplicate.raw);
      await updateIdea(userId, canonical.id, merged);
      await deleteIdea(userId, duplicate.id);
      return;
    }
    default:
      throw new Error(`Unsupported merge module: ${canonical.module satisfies never}`);
  }
}

export async function applyDeduplicationAction(userId: number, input: DeduplicationApplyInput) {
  const records = await listDedupComparableRecords(userId);
  const recordMap = new Map(records.map((record) => [record.dedupKey, record]));

  const canonical = recordMap.get(input.canonicalKey);
  if (!canonical) {
    throw new Error("Canonical record not found");
  }

  const targets = input.targetKeys.map((key) => {
    const record = recordMap.get(key);
    if (!record) {
      throw new Error(`Target record not found: ${key}`);
    }
    return record;
  });

  if (targets.length === 0) {
    throw new Error("At least one target record is required");
  }

  const allRecords = [canonical, ...targets];
  const sameModule = new Set(allRecords.map((record) => record.module)).size === 1;

  if (input.action === "merge" && !sameModule) {
    throw new Error("Merge actions are only allowed when all selected records belong to the same module");
  }

  let updatedCount = 0;
  let archivedCount = 0;
  let deletedCount = 0;

  if (input.action === "merge") {
    for (const target of targets) {
      await mergeIntoCanonicalRecord(userId, canonical, target);
      updatedCount += 1;
      deletedCount += 1;
    }
  }

  if (input.action === "archive") {
    for (const target of targets) {
      await archiveDedupRecord(userId, target);
      archivedCount += 1;
    }
  }

  if (input.action === "delete") {
    for (const target of targets) {
      await deleteDedupRecord(userId, target);
      deletedCount += 1;
    }
  }

  return {
    success: true as const,
    action: input.action,
    canonicalKey: input.canonicalKey,
    targetKeys: input.targetKeys,
    sameModule,
    updatedCount,
    archivedCount,
    deletedCount,
  };
}

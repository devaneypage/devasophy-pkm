import { eq, and, like, desc, asc, between, inArray } from "drizzle-orm";
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
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { johnnyDecimalModuleDefaults, johnnyDecimalSeeds } from "../shared/johnnyDecimal";

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

export async function getNotebookEntries(userId: number, filters?: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [eq(notebookEntries.userId, userId)];
  
  if (filters?.categoryId) {
    conditions.push(eq(notebookEntries.categoryId, filters.categoryId));
  }
  
  if (filters?.search) {
    conditions.push(like(notebookEntries.text, `%${filters.search}%`));
  }
  
  const orderBy = filters?.sortBy === "recent" 
    ? desc(notebookEntries.createdAt)
    : asc(notebookEntries.createdAt);
  
  return await db
    .select()
    .from(notebookEntries)
    .where(and(...conditions))
    .orderBy(orderBy);
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

// ============================================================================
// BOOKS MODULE
// ============================================================================
export async function createBook(userId: number, data: {
  title: string;
  author?: string;
  coverColor?: string;
  rating?: string;
  readingProgress?: number;
  status?: "reading" | "completed" | "want_to_read";
  notes?: string;
  tags?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(books).values({ userId, ...data });
  return result;
}

export async function listBooks(userId: number, opts?: { status?: "reading" | "completed" | "want_to_read"; sortBy?: "recent" | "oldest" | "rating" }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(books.userId, userId)];
  if (opts?.status) conditions.push(eq(books.status, opts.status));
  const order = opts?.sortBy === "oldest" ? asc(books.createdAt) : desc(books.createdAt);
  return db.select().from(books).where(and(...conditions)).orderBy(order);
}

export async function getBook(userId: number, id: number) {
  const db = await getDb();
  if (!db) return null;
  const [book] = await db.select().from(books).where(and(eq(books.id, id), eq(books.userId, userId)));
  return book ?? null;
}

export async function updateBook(userId: number, id: number, data: Partial<{ title: string; author: string; coverColor: string; rating: string; readingProgress: number; status: "reading" | "completed" | "want_to_read"; notes: string; tags: string }>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(books).set(data).where(and(eq(books.id, id), eq(books.userId, userId)));
  return getBook(userId, id);
}

export async function deleteBook(userId: number, id: number) {
  const db = await getDb();
  if (!db) return null;
  await db.delete(books).where(and(eq(books.id, id), eq(books.userId, userId)));
  return { success: true };
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


/**
 * Export books as CSV
 */
export async function exportBooksAsCSV(
  userId: number,
  filters?: {
    status?: "reading" | "completed" | "want_to_read";
    sortBy?: "recent" | "oldest" | "rating";
    selectedIds?: number[];
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get books based on filters
  let booksToExport = await listBooks(userId, {
    status: filters?.status,
    sortBy: filters?.sortBy,
  });

  // Filter by selected IDs if provided
  if (filters?.selectedIds && filters.selectedIds.length > 0) {
    booksToExport = booksToExport.filter((b) => filters.selectedIds!.includes(b.id));
  }

  // Generate CSV content
  const headers = ["ID", "Title", "Author", "Status", "Reading Progress", "Rating", "Date Added", "Notes", "Tags"];
  const rows = booksToExport.map((book) => [
    book.id.toString(),
    `"${(book.title || "").replace(/"/g, '""')}"`, // Escape quotes in CSV
    `"${(book.author || "").replace(/"/g, '""')}"`,
    book.status || "",
    book.readingProgress?.toString() || "0",
    book.rating?.toString() || "",
    book.dateAdded ? new Date(book.dateAdded).toISOString().split("T")[0] : "",
    `"${(book.notes || "").replace(/"/g, '""')}"`,
    `"${(book.tags || "").replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return {
    csv,
    filename: `books_export_${new Date().toISOString().split("T")[0]}.csv`,
    count: booksToExport.length,
  };
}

/**
 * Export notebook entries as CSV
 */
export async function exportNotebookEntriesAsCSV(
  userId: number,
  filters?: {
    categoryId?: number;
    selectedIds?: number[];
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get notebook entries
  let entriesToExport = await getNotebookEntries(userId, {
    categoryId: filters?.categoryId,
  });

  // Filter by selected IDs if provided
  if (filters?.selectedIds && filters.selectedIds.length > 0) {
    entriesToExport = entriesToExport.filter((e) => filters.selectedIds!.includes(e.id));
  }

  // Generate CSV content
  const headers = ["ID", "Zettelkasten ID", "Text", "Author", "Work", "Source Type", "Location", "Note", "Tags", "Collections", "Category", "Favorite", "Date Added"];
  const rows = entriesToExport.map((entry) => [
    entry.id.toString(),
    entry.zettelkastenId || "",
    `"${(entry.text || "").replace(/"/g, '""')}"`,
    `"${(entry.author || "").replace(/"/g, '""')}"`,
    `"${(entry.work || "").replace(/"/g, '""')}"`,
    entry.sourceType || "",
    entry.location || "",
    `"${(entry.note || "").replace(/"/g, '""')}"`,
    `"${(entry.tags || "").replace(/"/g, '""')}"`,
    `"${(entry.collections || "").replace(/"/g, '""')}"`,
    entry.categoryId?.toString() || "",
    entry.favorite ? "Yes" : "No",
    entry.createdAt ? new Date(entry.createdAt).toISOString().split("T")[0] : "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return {
    csv,
    filename: `notebook_export_${new Date().toISOString().split("T")[0]}.csv`,
    count: entriesToExport.length,
  };
}

/**
 * Export combined books and notes as CSV
 */
export async function exportCombinedAsCSV(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const booksExport = await exportBooksAsCSV(userId);
  const notesExport = await exportNotebookEntriesAsCSV(userId);

  // Combine exports with section headers
  const combined = [
    "=== BOOKS ===",
    booksExport.csv,
    "",
    "=== NOTEBOOK ENTRIES ===",
    notesExport.csv,
  ].join("\n");

  return {
    csv: combined,
    filename: `devanomy_export_${new Date().toISOString().split("T")[0]}.csv`,
    booksCount: booksExport.count,
    notesCount: notesExport.count,
  };
}

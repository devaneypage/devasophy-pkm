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
  projects,
  tasks,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { johnnyDecimalSeeds } from "../shared/johnnyDecimal";

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

export async function getTaxonomyTree(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await seedJohnnyDecimalTaxonomy(userId);

  const areas = await db
    .select()
    .from(taxonomyAreas)
    .where(eq(taxonomyAreas.userId, userId))
    .orderBy(asc(taxonomyAreas.areaNumber));

  const categories = await db
    .select()
    .from(taxonomyCategories)
    .where(eq(taxonomyCategories.userId, userId))
    .orderBy(asc(taxonomyCategories.categoryNumber));

  return areas.map((area) => ({
    ...area,
    categories: categories.filter((category) => category.areaId === area.id),
  }));
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

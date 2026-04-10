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
} from "../drizzle/schema";
import { ENV } from "./_core/env";

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

export async function getTaxonomyAreas(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(taxonomyAreas)
    .where(eq(taxonomyAreas.userId, userId))
    .orderBy(asc(taxonomyAreas.areaNumber));
}

export async function getTaxonomyCategories(userId: number, areaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
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

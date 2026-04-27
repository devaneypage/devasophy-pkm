import fs from 'node:fs/promises';
import { and, eq, like } from 'drizzle-orm';
import { normalizeLexiconImportPayload, normalizeNotebookImportPayload } from '../shared/pkmFormatting';
import { bulkImportLexiconEntries, bulkImportNotebookEntries, getDb } from '../server/db';
import { lexiconEntries, notebookEntries } from '../drizzle/schema';

async function main() {
  const userId = 1;
  const notebookRaw = JSON.parse(await fs.readFile('/home/ubuntu/upload/Quotes-All_with_notes_with_metadata.json', 'utf8'));
  const lexiconRaw = JSON.parse(await fs.readFile('/home/ubuntu/upload/Clavis_Aurea_Complete.json', 'utf8'));

  const notebookEntriesPrepared = normalizeNotebookImportPayload(notebookRaw).slice(0, 2).map((entry, index) => ({
    ...entry,
    text: `${entry.text} [verification-${Date.now()}-${index}]`,
  }));
  const lexiconEntriesPrepared = normalizeLexiconImportPayload(lexiconRaw).slice(0, 2).map((entry, index) => ({
    ...entry,
    term: `${entry.term}-verification-${Date.now()}-${index}`,
  }));

  const notebookResult = await bulkImportNotebookEntries(userId, notebookEntriesPrepared, { autoCategory: true });
  const lexiconResult = await bulkImportLexiconEntries(userId, lexiconEntriesPrepared, { autoCategory: true });

  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const insertedNotebook = await db
    .select()
    .from(notebookEntries)
    .where(and(eq(notebookEntries.userId, userId), like(notebookEntries.text, '%[verification-%')));

  const insertedLexicon = await db
    .select()
    .from(lexiconEntries)
    .where(and(eq(lexiconEntries.userId, userId), like(lexiconEntries.term, '%-verification-%')));

  console.log(JSON.stringify({
    preparedNotebookCount: notebookEntriesPrepared.length,
    preparedLexiconCount: lexiconEntriesPrepared.length,
    notebookResult,
    lexiconResult,
    insertedNotebookCount: insertedNotebook.length,
    insertedLexiconCount: insertedLexicon.length,
    notebookPreview: notebookEntriesPrepared[0],
    lexiconPreview: lexiconEntriesPrepared[0],
  }, null, 2));

  await db.delete(notebookEntries).where(and(eq(notebookEntries.userId, userId), like(notebookEntries.text, '%[verification-%')));
  await db.delete(lexiconEntries).where(and(eq(lexiconEntries.userId, userId), like(lexiconEntries.term, '%-verification-%')));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { and, eq } from 'drizzle-orm';
import { bulkImportLexiconEntries, bulkImportNotebookEntries, getDb } from '../server/db';
import { lexiconEntries, notebookEntries } from '../drizzle/schema';

async function main() {
  const userId = 1;
  const runId = `verification-${Date.now()}`;
  const notebookText = `Bulk import verification quote ${runId}`;
  const lexiconTerm = `VerificationTerm${Date.now()}`;

  const notebookResult = await bulkImportNotebookEntries(
    userId,
    [
      {
        text: notebookText,
        author: 'Manus Verification',
        work: 'Schema Repair Check',
        sourceType: 'quote',
        note: 'Inserted by live verification script',
        tags: 'verification,bulk-import',
        collections: 'verification',
        favorite: false,
      },
    ],
    { autoCategory: true },
  );

  const lexiconResult = await bulkImportLexiconEntries(
    userId,
    [
      {
        term: lexiconTerm,
        partOfSpeech: 'noun',
        definition: `Definition for ${runId}`,
        etymology: 'Verification etymology',
        origin: 'Test harness',
        sourceType: 'verification',
        notes: 'Inserted by live verification script',
        dikwTier: 'information',
      },
    ],
    { autoCategory: true },
  );

  const db = await getDb();
  if (!db) {
    throw new Error('Database not available after import');
  }

  const insertedNotebook = await db
    .select()
    .from(notebookEntries)
    .where(and(eq(notebookEntries.userId, userId), eq(notebookEntries.text, notebookText)));

  const insertedLexicon = await db
    .select()
    .from(lexiconEntries)
    .where(and(eq(lexiconEntries.userId, userId), eq(lexiconEntries.term, lexiconTerm)));

  console.log(JSON.stringify({
    notebookResult,
    lexiconResult,
    insertedNotebookCount: insertedNotebook.length,
    insertedLexiconCount: insertedLexicon.length,
    insertedNotebookPreview: insertedNotebook[0]
      ? {
          id: insertedNotebook[0].id,
          text: insertedNotebook[0].text,
          zettelkastenId: insertedNotebook[0].zettelkastenId ?? null,
          categoryId: insertedNotebook[0].categoryId ?? null,
        }
      : null,
    insertedLexiconPreview: insertedLexicon[0]
      ? {
          id: insertedLexicon[0].id,
          term: insertedLexicon[0].term,
          dikwTier: insertedLexicon[0].dikwTier ?? null,
          zettelkastenId: insertedLexicon[0].zettelkastenId ?? null,
          categoryId: insertedLexicon[0].categoryId ?? null,
        }
      : null,
  }, null, 2));

  await db.delete(notebookEntries).where(and(eq(notebookEntries.userId, userId), eq(notebookEntries.text, notebookText)));
  await db.delete(lexiconEntries).where(and(eq(lexiconEntries.userId, userId), eq(lexiconEntries.term, lexiconTerm)));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

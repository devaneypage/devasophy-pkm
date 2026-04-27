import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';

const MIGRATION_DIR = path.resolve('drizzle');
const IGNORABLE_MESSAGES = [
  'already exists',
  'duplicate column name',
  'duplicate key name',
  'duplicate entry',
  'multiple primary key defined',
  'duplicate foreign key constraint name',
  'check that column/key exists',
  'unsupported add column if not exists',
];

function isIgnorable(error) {
  const message = String(error?.message || '').toLowerCase();
  return IGNORABLE_MESSAGES.some((token) => message.includes(token));
}

async function getMigrationFiles() {
  const files = await fs.readdir(MIGRATION_DIR);
  return files
    .filter((file) => /^\d{4}_.*\.sql$/.test(file))
    .sort((a, b) => a.localeCompare(b));
}

function splitStatements(sql) {
  return sql
    .split(/-->\s*statement-breakpoint/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is required');
}

const connection = await mysql.createConnection(url);
const files = await getMigrationFiles();

let executed = 0;
let skipped = 0;

try {
  for (const file of files) {
    const fullPath = path.join(MIGRATION_DIR, file);
    const sql = await fs.readFile(fullPath, 'utf8');
    const statements = splitStatements(sql);

    console.log(`\n=== ${file} (${statements.length} statements) ===`);

    for (const statement of statements) {
      const compact = statement.replace(/\s+/g, ' ').slice(0, 140);
      try {
        await connection.query(statement);
        executed += 1;
        console.log(`APPLIED: ${compact}`);
      } catch (error) {
        if (isIgnorable(error)) {
          skipped += 1;
          console.log(`SKIPPED: ${compact}`);
        } else {
          console.error(`FAILED: ${compact}`);
          console.error(error.message);
          throw error;
        }
      }
    }
  }

  console.log(`\nDone. Applied ${executed} statements, skipped ${skipped} already-satisfied statements.`);
} finally {
  await connection.end();
}

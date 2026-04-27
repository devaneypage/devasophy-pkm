import mysql from 'mysql2/promise';

function redact(url) {
  return url.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is missing');
  process.exit(1);
}

const targets = [
  'users',
  'notebook_entries',
  'lexicon_entries',
  'documents',
  'projects',
  'tasks',
  'taxonomy_areas',
  'taxonomy_categories',
  'semantic_links',
  'search_index',
  'tags',
];

const connection = await mysql.createConnection(url);

try {
  const [dbRows] = await connection.query('SELECT DATABASE() AS db');
  const dbName = dbRows[0]?.db;
  console.log(`Connected to ${redact(url)}`);
  console.log(`Database: ${dbName}`);

  for (const table of targets) {
    const [existsRows] = await connection.query(
      `SELECT COUNT(*) AS count
       FROM information_schema.tables
       WHERE table_schema = ? AND table_name = ?`,
      [dbName, table],
    );

    if (!existsRows[0]?.count) {
      console.log(`TABLE ${table}: MISSING`);
      continue;
    }

    const [columnRows] = await connection.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ?
       ORDER BY ordinal_position`,
      [dbName, table],
    );

    const columns = columnRows.map((row) => row.column_name);
    console.log(`TABLE ${table}: ${columns.join(', ')}`);
  }
} finally {
  await connection.end();
}

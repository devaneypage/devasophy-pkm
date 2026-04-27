import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is required');
}

const connection = await mysql.createConnection(url);

const checks = [
  {
    name: 'notebook.list query',
    sql: `select id, userId, categoryId, uuid, zettelkasten_id, text, author, work, sourceType, location, note, tags, collections, favorite, createdAt, updatedAt
          from notebook_entries
          where notebook_entries.userId = ?
          order by notebook_entries.createdAt desc
          limit 3`,
    params: [1],
  },
  {
    name: 'lexicon.list query',
    sql: `select id, userId, categoryId, zettelkasten_id, term, partOfSpeech, definition, etymology, dikw_tier, origin, sourceType, imageNum, notes, dateAdded, createdAt, updatedAt
          from lexicon_entries
          where lexicon_entries.userId = ?
          order by lexicon_entries.term asc
          limit 3`,
    params: [1],
  },
  {
    name: 'projects list query',
    sql: `select id, userId, categoryId, uuid, zettelkasten_id, title, description, status, startDate, endDate, tags, linkedEntries, favorite, createdAt, updatedAt
          from projects
          where projects.userId = ?
          order by projects.updatedAt desc
          limit 3`,
    params: [1],
  },
  {
    name: 'tasks list query',
    sql: `select id, userId, categoryId, projectId, uuid, zettelkasten_id, title, description, status, priority, dueDate, completedDate, tags, linkedEntries, linkedProjectId, favorite, createdAt, updatedAt
          from tasks
          where tasks.userId = ?
          order by tasks.updatedAt desc
          limit 3`,
    params: [1],
  },
];

try {
  for (const check of checks) {
    const [rows] = await connection.query(check.sql, check.params);
    console.log(`${check.name}: OK (${rows.length} rows)`);
  }
} finally {
  await connection.end();
}

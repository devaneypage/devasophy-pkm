import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');

const connection = await mysql.createConnection(url);
try {
  const [notebookRows] = await connection.query(
    `select count(*) as count
     from notebook_entries
     where text like 'Bulk import verification quote verification-%'`
  );

  const [lexiconRows] = await connection.query(
    `select count(*) as count
     from lexicon_entries
     where term like 'VerificationTerm%'`
  );

  console.log(JSON.stringify({
    notebookVerificationRows: notebookRows[0]?.count ?? 0,
    lexiconVerificationRows: lexiconRows[0]?.count ?? 0,
  }, null, 2));
} finally {
  await connection.end();
}

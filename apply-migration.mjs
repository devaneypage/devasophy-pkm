import mysql from 'mysql2/promise';
import fs from 'fs';

const databaseUrl = process.env.DATABASE_URL;
console.log('Applying migration...');

// Parse connection string
const url = new URL(databaseUrl);
const sslParam = url.searchParams.get('ssl');
let ssl = true;
if (sslParam) {
  try {
    ssl = JSON.parse(sslParam);
  } catch (e) {
    ssl = true;
  }
}

const config = {
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.substring(1),
  ssl: ssl,
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0,
};

async function applyMigration() {
  try {
    const connection = await mysql.createConnection(config);
    const sql = fs.readFileSync('./drizzle/0002_sour_bromley.sql', 'utf8');
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 80) + '...');
        await connection.execute(statement);
      }
    }
    
    console.log('Migration applied successfully!');
    await connection.end();
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();

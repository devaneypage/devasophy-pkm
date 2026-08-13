import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
const openId = process.env.OWNER_OPEN_ID;
if (!databaseUrl || !openId) {
  throw new Error("DATABASE_URL and OWNER_OPEN_ID are required to seed the CI owner");
}

const connection = await mysql.createConnection(databaseUrl);
try {
  await connection.execute(
    `INSERT INTO users (openId, name, email, loginMethod, role)
     VALUES (?, ?, ?, 'ci', 'admin')
     ON DUPLICATE KEY UPDATE name = VALUES(name), role = 'admin'`,
    [openId, process.env.OWNER_NAME || "CI Owner", "ci-owner@example.invalid"]
  );
} finally {
  await connection.end();
}
process.exit(0);

import mysql from "mysql2/promise";

const boardIds = process.argv.slice(2).map(Number).filter(Number.isInteger);
if (boardIds.length === 0) process.exit(0);

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [users] = await connection.execute(
    "SELECT id FROM users WHERE openId = ? LIMIT 1",
    [process.env.OWNER_OPEN_ID]
  );
  const userId = users[0]?.id;
  if (!userId) throw new Error("Owner user not found");

  const placeholders = boardIds.map(() => "?").join(", ");
  const parameters = [userId, ...boardIds];
  await connection.beginTransaction();
  await connection.execute(
    `DELETE FROM commonplace_entries WHERE userId = ? AND boardId IN (${placeholders})`,
    parameters
  );
  await connection.execute(
    `DELETE FROM commonplace_columns WHERE userId = ? AND boardId IN (${placeholders})`,
    parameters
  );
  await connection.execute(
    `DELETE FROM commonplace_boards WHERE userId = ? AND id IN (${placeholders})`,
    parameters
  );
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
process.exit(0);

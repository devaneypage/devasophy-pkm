import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
const ownerOpenId = process.env.OWNER_OPEN_ID;
if (!databaseUrl || !ownerOpenId) {
  throw new Error("DATABASE_URL and OWNER_OPEN_ID are required for feature-flag E2E setup");
}

const connection = await mysql.createConnection(databaseUrl);
try {
  const [users] = await connection.execute("SELECT id FROM users WHERE openId = ? LIMIT 1", [ownerOpenId]);
  const user = users[0];
  if (!user) throw new Error("Owner user was not found in the canonical users table");

  const [updateResult] = await connection.execute(
    "UPDATE workspace_feature_flags SET enabled = 0 WHERE userId = ? AND flagKey = ?",
    [user.id, "commonplace_workspace"]
  );

  if (updateResult.affectedRows === 0) {
    await connection.execute(
      "INSERT INTO workspace_feature_flags (userId, flagKey, description, enabled) VALUES (?, ?, ?, 0)",
      [user.id, "commonplace_workspace", "Enables the Kanban-based Commonplace drafting wall, route access, and navigation entry points."]
    );
  }

  console.log("Commonplace feature flag prepared in disabled state for E2E verification.");
} finally {
  await connection.end();
}

process.exit(0);

import { Router } from "express";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "../db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "devanomy-secret-key-change-in-production-2024");

export const authRouter = Router();

// Register
authRouter.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || password.length < 6) {
    res.status(400).json({ error: "Email and password (6+ chars) required" });
    return;
  }
  const db = getDb();
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(users).values({
    unionId: crypto.randomUUID(),
    email,
    name: name || email.split("@")[0],
    role: "user",
    passwordHash,
  });
  const token = await new SignJWT({ userId: user.insertId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
  res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" });
  res.json({ user: { id: user.insertId, email, name: name || email.split("@")[0] } });
});

// Login
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (rows.length === 0) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const user = rows[0];
  const validPassword = user!.passwordHash ? await bcrypt.compare(password, user!.passwordHash) : false;
  if (!validPassword) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = await new SignJWT({ userId: user!.id, email: user!.email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
  res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" });
  res.json({ user: { id: user!.id, email: user!.email, name: user!.name } });
});

// Logout
authRouter.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});

// Me
authRouter.get("/me", async (req, res) => {
  const token = req.cookies?.token;
  if (!token) { res.json({ user: null }); return; }
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    const db = getDb();
    const rows = await db.select().from(users).where(eq(users.id, payload.userId as number)).limit(1);
    if (rows.length === 0) { res.json({ user: null }); return; }
    const u = rows[0];
    res.json({ user: { id: u.id, email: u.email, name: u.name, role: u.role } });
  } catch {
    res.json({ user: null });
  }
});

// Middleware to protect routes
export async function requireAuth(req: any, res: any, next: any) {
  const token = req.cookies?.token;
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    const db = getDb();
    const rows = await db.select().from(users).where(eq(users.id, payload.userId as number)).limit(1);
    if (rows.length === 0) { res.status(401).json({ error: "Unauthorized" }); return; }
    req.user = rows[0];
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

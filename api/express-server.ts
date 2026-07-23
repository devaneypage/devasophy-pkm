import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { authRouter } from "./routes/auth";
import { dashboardRouter } from "./routes/dashboard";
import { notesRouter } from "./routes/notes";
import { quotationsRouter } from "./routes/quotations";
import { vocabularyRouter } from "./routes/vocabulary";
import { booksRouter } from "./routes/books";
import { researchRouter } from "./routes/research";
import { ideasRouter } from "./routes/ideas";
import { plansRouter } from "./routes/plans";
import { themesRouter } from "./routes/themes";
import { searchRouter } from "./routes/search";
import { exportRouter } from "./routes/export";
import { seedRouter } from "./routes/seed";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Static files (served before API routes so index.html doesn't shadow /api/*)
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// API routes
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/notes", notesRouter);
app.use("/api/quotations", quotationsRouter);
app.use("/api/vocabulary", vocabularyRouter);
app.use("/api/books", booksRouter);
app.use("/api/research", researchRouter);
app.use("/api/ideas", ideasRouter);
app.use("/api/plans", plansRouter);
app.use("/api/themes", themesRouter);
app.use("/api/search", searchRouter);
app.use("/api/export", exportRouter);
app.use("/api/seed", seedRouter);

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// SPA catch-all — serve index.html for any non-API route
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

export default app;

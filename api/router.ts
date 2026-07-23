import { Hono } from "hono";
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

const router = new Hono();

router.route("/auth", authRouter);
router.route("/dashboard", dashboardRouter);
router.route("/notes", notesRouter);
router.route("/quotations", quotationsRouter);
router.route("/vocabulary", vocabularyRouter);
router.route("/books", booksRouter);
router.route("/research", researchRouter);
router.route("/ideas", ideasRouter);
router.route("/plans", plansRouter);
router.route("/themes", themesRouter);
router.route("/search", searchRouter);
router.route("/export", exportRouter);
router.route("/seed", seedRouter);

export { router };

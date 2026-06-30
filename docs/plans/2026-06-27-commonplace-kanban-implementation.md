# Commonplace Kanban Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a fresh Commonplace Kanban editor that replaces the legacy Notebook and Library pages with color-coded, content-type-specific cards and persistent board state.

**Architecture:** Introduce new Commonplace and board-column tables at the data layer, expose typed CRUD and board-order procedures through the server router, then replace the current notebook/library UI with a Kanban workspace built around specialized card editors and a shared visual taxonomy. The system starts fresh without migrating legacy data, and board persistence is treated as a working surface with optional saved boards.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Express, tRPC 11, Drizzle ORM, Vitest.

---

### Task 1: Define the new Commonplace data model

**Files:**
- Modify: `/home/ubuntu/devasophy-pkm/drizzle/schema.ts`
- Test: `/home/ubuntu/devasophy-pkm/server/commonplace.test.ts`

**Step 1: Write the failing test**

Add schema-facing and procedure-facing tests that expect support for board columns, commonplace entries, entry types, saved boards, and persisted card order.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm test commonplace`

Expected: FAIL because the schema and procedures do not exist yet.

**Step 3: Write minimal implementation**

Add Drizzle schema entities for:
- `commonplaceBoards`
- `commonplaceColumns`
- `commonplaceEntries`

Ensure the entry type enum includes:
- `research_note`
- `bookmark`
- `idea`
- `quote`
- `book`
- `article`
- `glossary_term`
- `list`

Add enough structure to support:
- user ownership
- title and optional description
- per-column order
- JSON content payloads
- tags
- created/updated timestamps

**Step 4: Run test to verify it passes**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm test commonplace`

Expected: schema-related failures are resolved or reduced to missing DB helpers.

### Task 2: Add database helpers and server procedures

**Files:**
- Modify: `/home/ubuntu/devasophy-pkm/server/db.ts`
- Modify: `/home/ubuntu/devasophy-pkm/server/routers.ts`
- Test: `/home/ubuntu/devasophy-pkm/server/commonplace.test.ts`

**Step 1: Write the failing test**

Add tests for:
- listing default board data
- creating a board
- creating a column
- creating an entry
- updating card content and type metadata
- moving a card between columns
- reordering cards
- deleting a card

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm test commonplace`

Expected: FAIL because db helpers and router procedures are missing.

**Step 3: Write minimal implementation**

Implement helpers in `server/db.ts` and procedures in `server/routers.ts` for:
- board CRUD
- column CRUD and ordering
- entry CRUD
- entry move/reorder
- optional board save snapshot operation

Use `protectedProcedure` and keep procedure inputs narrow and typed.

**Step 4: Run test to verify it passes**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm test commonplace`

Expected: backend tests pass.

### Task 3: Apply schema migration and verify project health

**Files:**
- Modify: `/home/ubuntu/devasophy-pkm/drizzle/schema.ts`
- Create/Modify: generated SQL under `/home/ubuntu/devasophy-pkm/drizzle/`

**Step 1: Generate migration**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm drizzle-kit generate`

**Step 2: Review generated SQL**

Read the generated migration carefully and ensure it creates only the new Commonplace tables and enums needed for the fresh interface.

**Step 3: Apply migration**

Apply the SQL through the database execution workflow.

**Step 4: Verify status**

Run project health verification after schema application.

### Task 4: Build the Kanban workspace shell

**Files:**
- Modify: `/home/ubuntu/devasophy-pkm/client/src/pages/Notebook.tsx`
- Modify: `/home/ubuntu/devasophy-pkm/client/src/pages/Library.tsx`
- Create: `/home/ubuntu/devasophy-pkm/client/src/pages/Commonplace.tsx`
- Create: `/home/ubuntu/devasophy-pkm/client/src/components/commonplace/CommonplaceBoard.tsx`
- Create: `/home/ubuntu/devasophy-pkm/client/src/components/commonplace/CommonplaceColumn.tsx`
- Create: `/home/ubuntu/devasophy-pkm/client/src/components/commonplace/CommonplaceCard.tsx`
- Test: `/home/ubuntu/devasophy-pkm/client/src/pages/Commonplace.test.tsx`

**Step 1: Write the failing test**

Add a page-level test asserting that the Commonplace page renders the board shell, shows type filters, shows at least one column, and supports opening a new-card workflow.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm test Commonplace`

Expected: FAIL because the page and components do not exist.

**Step 3: Write minimal implementation**

Create the board shell and wire it to the new server procedures. Use a horizontal board layout with clear column headers and card counts.

**Step 4: Run test to verify it passes**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm test Commonplace`

Expected: basic page render tests pass.

### Task 5: Add specialized card editing flows

**Files:**
- Create: `/home/ubuntu/devasophy-pkm/client/src/components/commonplace/CardEditorModal.tsx`
- Create: `/home/ubuntu/devasophy-pkm/client/src/components/commonplace/editors/ResearchNoteEditor.tsx`
- Create: `/home/ubuntu/devasophy-pkm/client/src/components/commonplace/editors/BookmarkEditor.tsx`
- Create: `/home/ubuntu/devasophy-pkm/client/src/components/commonplace/editors/IdeaEditor.tsx`
- Create: `/home/ubuntu/devasophy-pkm/client/src/components/commonplace/editors/QuoteEditor.tsx`
- Create: `/home/ubuntu/devasophy-pkm/client/src/components/commonplace/editors/BookEditor.tsx`
- Create: `/home/ubuntu/devasophy-pkm/client/src/components/commonplace/editors/ArticleEditor.tsx`
- Create: `/home/ubuntu/devasophy-pkm/client/src/components/commonplace/editors/GlossaryTermEditor.tsx`
- Create: `/home/ubuntu/devasophy-pkm/client/src/components/commonplace/editors/ListEditor.tsx`
- Test: `/home/ubuntu/devasophy-pkm/client/src/components/commonplace/CardEditorModal.test.tsx`

**Step 1: Write the failing test**

Add tests asserting that selecting different content types shows the correct editor fields and that save actions send typed payloads.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm test CardEditorModal`

Expected: FAIL because editor components do not exist.

**Step 3: Write minimal implementation**

Implement one modal shell with per-type editor panes. Keep the first pass lean: prioritize title, main content, tags, and type-specific metadata fields.

**Step 4: Run test to verify it passes**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm test CardEditorModal`

Expected: editor switching and save tests pass.

### Task 6: Apply the visual taxonomy across the app

**Files:**
- Modify: `/home/ubuntu/devasophy-pkm/client/src/index.css`
- Modify: `/home/ubuntu/devasophy-pkm/client/src/App.tsx`
- Modify relevant navigation and shared UI files under `/home/ubuntu/devasophy-pkm/client/src/components/`
- Test: `/home/ubuntu/devasophy-pkm/client/src/pages/Commonplace.test.tsx`

**Step 1: Write the failing test**

Add tests that expect content-type chips, card accents, and filters to use the shared taxonomy labels.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm test Commonplace`

Expected: FAIL because taxonomy tokens are not yet applied.

**Step 3: Write minimal implementation**

Introduce shared content-type config and design tokens for:
- Research Notes → vermillion
- Bookmarks → grey
- Ideas → bright blue
- Quotes → yellow
- Books → green
- Articles → orange
- Glossary Terms → pink
- Lists → violet

Apply them to sidebar, badges, filters, cards, and empty states.

**Step 4: Run test to verify it passes**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm test Commonplace`

Expected: taxonomy tests pass.

### Task 7: Replace legacy routes and verify stability

**Files:**
- Modify: `/home/ubuntu/devasophy-pkm/client/src/App.tsx`
- Modify any affected navigation components
- Test: `/home/ubuntu/devasophy-pkm/client/src/pages/Commonplace.test.tsx`
- Test: `/home/ubuntu/devasophy-pkm/server/commonplace.test.ts`

**Step 1: Write the failing test**

Add tests asserting that navigation routes now lead to the Commonplace workspace instead of the old notebook/library experience.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm test Commonplace`

Expected: FAIL because route replacement has not happened yet.

**Step 3: Write minimal implementation**

Wire the main navigation and page routes so the new Commonplace workspace becomes the canonical destination. Keep the experience fresh-start only; do not migrate legacy data.

**Step 4: Run all verification**

Run:
- `cd /home/ubuntu/devasophy-pkm && pnpm test commonplace`
- `cd /home/ubuntu/devasophy-pkm && pnpm test Commonplace`
- `cd /home/ubuntu/devasophy-pkm && pnpm test`

Expected: relevant targeted tests pass and the broader suite remains stable.

### Task 8: Final verification and delivery

**Files:**
- Modify: `/home/ubuntu/devasophy-pkm/todo.md`
- Modify: `/home/ubuntu/devasophy-pkm/docs/commonplace_kanban_design.md` if implementation diverges materially

**Step 1: Verify live health**

Run the project health check after implementation.

**Step 2: Update tracker**

Mark completed items in `todo.md`.

**Step 3: Save checkpoint**

Create a checkpoint with a description referencing the Commonplace Kanban editor.

**Step 4: Deliver**

Provide the user a concise summary of what changed, what was tested, and any remaining follow-up opportunities.

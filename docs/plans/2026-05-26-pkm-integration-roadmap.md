# PKM Integration Roadmap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
>
> I'm using the writing-plans skill to create the implementation plan.

**Goal:** Implement the remaining PKM integration roadmap in a controlled sequence that adds durable identifiers, richer semantic links, and the full Action and Synthesis layers without destabilizing the existing Devanomy workspace.

**Architecture:** The roadmap extends the current monolithic tRPC + Drizzle application incrementally. Each phase follows the same pattern: update schema first, generate and apply migration SQL, extend backend helpers and tRPC procedures, wire the client page or detail surface, then lock the behavior down with targeted Vitest coverage before moving on.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS 4, Express 4, tRPC 11, Drizzle ORM, Vitest, jsdom

---

## Sequence and dependency notes

The roadmap should be executed in the exact user-provided order because each phase strengthens the vocabulary used by later phases. Zettelkasten IDs improve cross-module traceability before new link semantics and Action/Synthesis modules start producing more references. Goals should land before Projects and Tasks so the Action Layer has a top-down structure, and Ideas should come after the execution modules so synthesis can link into a stable archive.

| Phase | Priority | Why it comes here | Primary risk |
| --- | --- | --- | --- |
| 1. Zettelkasten ID System | High | Establishes durable cross-module references early | Duplicate ID generation or missing export propagation |
| 2. Enhanced Linking Semantics | Medium | Builds on stable entity IDs and improves relationship meaning | UI confusion if link directions are not rendered consistently |
| 3. Goals Module | Medium | Creates the top Action Layer object for Projects and Tasks | Scope creep in goal-linking UX |
| 4. Projects Module | Medium | Depends on goals for alignment and documents for implementation context | Over-complex hierarchy logic |
| 5. Tasks Module | Lower | Best added after goal/project parent models exist | Dependency visualization can balloon in scope |
| 6. Ideas Module | Lower | Best when archive and execution layers are already linkable | Clustering can become premature complexity |

## Global implementation rules

Each phase should use the same execution discipline.

1. Start with a failing test whenever the phase introduces deterministic logic or a regression-prone UI path.
2. Keep schema changes isolated to `drizzle/schema.ts`, generated SQL under `drizzle/*.sql`, and database application through the SQL execution workflow.
3. Keep data access in `server/db.ts` and request contracts in `server/routers.ts` unless router size forces a later split.
4. For UI pages, prefer existing page patterns under `client/src/pages/` and navigation updates in `client/src/App.tsx` and `client/src/components/DashboardLayout.tsx`.
5. Run targeted tests first, then the full suite, then a live browser verification of the relevant workflow.
6. Create a checkpoint after each completed phase.

---

## Phase 1 — Zettelkasten ID System

### Task 1: Add durable ID fields to the schema

**Files:**
| Type | Path |
| --- | --- |
| Modify | `drizzle/schema.ts` |
| Generate | `drizzle/000X_<generated>.sql` |
| Reference | `shared/pkmFormatting.ts` |

**Step 1: Write the failing test**

Create or extend `server/zettelkasten.test.ts` with assertions that notebook and lexicon entries accept a `zettelkastenId` field and that generated IDs follow `AC.ID-YYYYMMDD-Seq`.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run server/zettelkasten.test.ts`

Expected: FAIL because the schema and creation flow do not yet expose the field consistently.

**Step 3: Write minimal implementation**

Add nullable or required `zettelkastenId` columns to the notebook and lexicon table definitions in `drizzle/schema.ts`. Keep the field name identical across schema, inferred types, and downstream usage.

**Step 4: Generate migration SQL**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm drizzle-kit generate`

Expected: a migration file that only adds the two columns and any required indexes or uniqueness constraints.

**Step 5: Apply migration**

Read the generated SQL, then apply it through the database migration workflow before continuing.

**Step 6: Commit**

```bash
cd /home/ubuntu/devasophy-pkm
git add drizzle/schema.ts drizzle/*.sql server/zettelkasten.test.ts
git commit -m "feat: add zettelkasten id schema fields"
```

### Task 2: Implement ID generation and backend persistence

**Files:**
| Type | Path |
| --- | --- |
| Modify | `server/db.ts` |
| Modify | `server/routers.ts` |
| Test | `server/zettelkasten.test.ts` |
| Optional helper | `shared/pkmFormatting.ts` |

**Step 1: Write the failing test**

Add tests for ID generation ordering, date formatting, uniqueness within a day, and integration into notebook and lexicon creation procedures.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run server/zettelkasten.test.ts -t "generation"`

Expected: FAIL because there is no procedure or helper producing the ID.

**Step 3: Write minimal implementation**

Implement a shared generation helper, then thread it into the create flows in `server/db.ts` and `server/routers.ts`. Expose any dedicated generation procedure only if the UI truly needs to prefetch IDs.

**Step 4: Run test to verify it passes**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run server/zettelkasten.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
cd /home/ubuntu/devasophy-pkm
git add server/db.ts server/routers.ts shared/pkmFormatting.ts server/zettelkasten.test.ts
git commit -m "feat: generate zettelkasten ids for notebook and lexicon entries"
```

### Task 3: Surface IDs in forms, detail views, and exports

**Files:**
| Type | Path |
| --- | --- |
| Modify | `client/src/pages/Notebook.tsx` |
| Modify | `client/src/pages/Lexicon.tsx` |
| Modify | `client/src/pages/Export.tsx` or export helper files |
| Test | `server/followup.ui-imports.test.ts` |
| Test | `shared/pkmFormatting.test.ts` |

**Step 1: Write the failing test**

Add tests for export payloads including `zettelkastenId`. If UI tests already exist for notebook or lexicon detail rendering, extend them to assert the ID label is visible.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run shared/pkmFormatting.test.ts`

Expected: FAIL until export formatting includes the new field.

**Step 3: Write minimal implementation**

Update notebook and lexicon create/edit/detail surfaces to display the generated ID read-only. Update export formatting so Markdown, JSON, and plain-text outputs include the identifier.

**Step 4: Run targeted and full tests**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm test`

Expected: PASS.

**Step 5: Commit**

```bash
cd /home/ubuntu/devasophy-pkm
git add client/src/pages/Notebook.tsx client/src/pages/Lexicon.tsx client/src/pages/Export.tsx shared/pkmFormatting.test.ts server/followup.ui-imports.test.ts
git commit -m "feat: surface zettelkasten ids in ui and exports"
```

---

## Phase 2 — Enhanced Linking Semantics

### Task 4: Add link-direction storage and validation

**Files:**
| Type | Path |
| --- | --- |
| Modify | `drizzle/schema.ts` |
| Generate | `drizzle/000X_<generated>.sql` |
| Modify | `server/db.ts` |
| Modify | `server/routers.ts` |
| Test | `shared/linkSemantics.test.ts` |

**Step 1: Write the failing test**

Extend `shared/linkSemantics.test.ts` to cover stored direction values such as `forward`, `backward`, and `bidirectional`, or the exact enum chosen for the UI contract.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run shared/linkSemantics.test.ts`

Expected: FAIL because the schema and routers do not yet accept direction.

**Step 3: Write minimal implementation**

Add `linkDirection` to the links schema, generate and apply the migration, then accept and persist the field in the link create/update backend flow.

**Step 4: Run test to verify it passes**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run shared/linkSemantics.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
cd /home/ubuntu/devasophy-pkm
git add drizzle/schema.ts drizzle/*.sql server/db.ts server/routers.ts shared/linkSemantics.test.ts
git commit -m "feat: add link direction semantics"
```

### Task 5: Update linking UI and detail displays

**Files:**
| Type | Path |
| --- | --- |
| Modify | `client/src/pages/Notebook.tsx` |
| Modify | `client/src/pages/Lexicon.tsx` |
| Modify | `client/src/pages/Documents.tsx` |
| Test | `client/src/pages/Documents.test.tsx` |
| Test | Any detail-view client tests under `client/src/**/*.test.tsx` |

**Step 1: Write the failing test**

Add or extend a client test to assert that users can choose a direction when creating a link and that rendered linked references show the correct directional symbol.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run client/src/pages/Documents.test.tsx`

Expected: FAIL because direction controls and output are not rendered yet.

**Step 3: Write minimal implementation**

Add a direction selector to the relevant link-creation UI, render directional symbols consistently in detail/reference panels, and add a simple filter by link type if the UI already supports filtering patterns.

**Step 4: Run targeted and full tests**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm test`

Expected: PASS.

**Step 5: Commit**

```bash
cd /home/ubuntu/devasophy-pkm
git add client/src/pages/Notebook.tsx client/src/pages/Lexicon.tsx client/src/pages/Documents.tsx client/src/pages/Documents.test.tsx
git commit -m "feat: expose directional link semantics in ui"
```

---

## Phase 3 — Action Layer: Goals Module

### Task 6: Create Goals schema and backend CRUD

**Files:**
| Type | Path |
| --- | --- |
| Modify | `drizzle/schema.ts` |
| Generate | `drizzle/000X_<generated>.sql` |
| Modify | `server/db.ts` |
| Modify | `server/routers.ts` |
| Test | `client/src/pages/Goals.test.tsx` |

**Step 1: Write the failing test**

Add tests that cover goal creation, listing, updating, deleting, and basic progress fields.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run client/src/pages/Goals.test.tsx`

Expected: FAIL because the module does not exist yet.

**Step 3: Write minimal implementation**

Create `goals` and `goalLinks` tables, generate and apply the migration, then implement CRUD helpers and protected procedures.

**Step 4: Run targeted tests**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run client/src/pages/Goals.test.tsx`

Expected: PASS once the backend contract is in place.

**Step 5: Commit**

```bash
cd /home/ubuntu/devasophy-pkm
git add drizzle/schema.ts drizzle/*.sql server/db.ts server/routers.ts client/src/pages/Goals.test.tsx
git commit -m "feat: add goals schema and backend"
```

### Task 7: Build Goals UI, linking, and progress tracking

**Files:**
| Type | Path |
| --- | --- |
| Create | `client/src/pages/Goals.tsx` |
| Modify | `client/src/App.tsx` |
| Modify | `client/src/components/DashboardLayout.tsx` |
| Modify | `client/src/pages/Home.tsx` |
| Test | `client/src/pages/Goals.test.tsx` |

**Step 1: Write the failing test**

Extend the Goals page test to cover list rendering, create/edit flows, linked-entry selection, and visible progress state.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run client/src/pages/Goals.test.tsx`

Expected: FAIL because the page and route do not exist.

**Step 3: Write minimal implementation**

Build the Goals page, wire the route and sidebar entry, surface goal-to-entry linking, and show progress tracking with the simplest clear UI that matches the current dashboard idiom.

**Step 4: Run targeted and full tests**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm test`

Expected: PASS.

**Step 5: Commit**

```bash
cd /home/ubuntu/devasophy-pkm
git add client/src/pages/Goals.tsx client/src/App.tsx client/src/components/DashboardLayout.tsx client/src/pages/Home.tsx client/src/pages/Goals.test.tsx
git commit -m "feat: add goals action layer ui"
```

---

## Phase 4 — Action Layer: Projects Module

### Task 8: Create Projects schema and backend CRUD

**Files:**
| Type | Path |
| --- | --- |
| Modify | `drizzle/schema.ts` |
| Generate | `drizzle/000X_<generated>.sql` |
| Modify | `server/db.ts` |
| Modify | `server/routers.ts` |
| Test | `server/integration.test.ts` |

**Step 1: Write the failing test**

Add tests for project creation, listing, document association, and hierarchy-safe parent assignment.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run server/integration.test.ts -t "project"`

Expected: FAIL because the projects module is absent.

**Step 3: Write minimal implementation**

Create `projects` and `projectDocuments` tables, generate and apply the migration, then implement CRUD helpers and protected procedures. Keep hierarchy support intentionally shallow at first: parent project reference plus validation against self-parenting.

**Step 4: Run targeted tests**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run server/integration.test.ts -t "project"`

Expected: PASS.

**Step 5: Commit**

```bash
cd /home/ubuntu/devasophy-pkm
git add drizzle/schema.ts drizzle/*.sql server/db.ts server/routers.ts server/integration.test.ts
git commit -m "feat: add projects schema and backend"
```

### Task 9: Build Projects UI and document-linking workflow

**Files:**
| Type | Path |
| --- | --- |
| Create | `client/src/pages/Projects.tsx` |
| Modify | `client/src/pages/Documents.tsx` |
| Modify | `client/src/App.tsx` |
| Modify | `client/src/components/DashboardLayout.tsx` |
| Modify | `client/src/pages/Home.tsx` |
| Test | `client/src/pages/Documents.test.tsx` |

**Step 1: Write the failing test**

Add UI coverage for linking a project to a document and verifying project list/detail rendering.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run client/src/pages/Documents.test.tsx`

Expected: FAIL until document/project association is wired.

**Step 3: Write minimal implementation**

Create a Projects page with list and detail views, add project-to-document linking, and surface projects in the dashboard/navigation. Defer deep hierarchy visualization beyond parent selection and summary display.

**Step 4: Run targeted and full tests**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm test`

Expected: PASS.

**Step 5: Commit**

```bash
cd /home/ubuntu/devasophy-pkm
git add client/src/pages/Projects.tsx client/src/pages/Documents.tsx client/src/App.tsx client/src/components/DashboardLayout.tsx client/src/pages/Home.tsx client/src/pages/Documents.test.tsx
git commit -m "feat: add projects ui and document linking"
```

---

## Phase 5 — Action Layer: Tasks Module

### Task 10: Create Tasks schema and backend CRUD

**Files:**
| Type | Path |
| --- | --- |
| Modify | `drizzle/schema.ts` |
| Generate | `drizzle/000X_<generated>.sql` |
| Modify | `server/db.ts` |
| Modify | `server/routers.ts` |
| Test | `server/integration.test.ts` |

**Step 1: Write the failing test**

Add tests for task creation, parent/child relationships, project linkage, goal linkage, and validation against circular parent assignment.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run server/integration.test.ts -t "task"`

Expected: FAIL because the tasks module is absent.

**Step 3: Write minimal implementation**

Create the tasks table with nullable parent, project, and goal references. Generate and apply the migration, then add CRUD helpers and protected procedures.

**Step 4: Run targeted tests**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run server/integration.test.ts -t "task"`

Expected: PASS.

**Step 5: Commit**

```bash
cd /home/ubuntu/devasophy-pkm
git add drizzle/schema.ts drizzle/*.sql server/db.ts server/routers.ts server/integration.test.ts
git commit -m "feat: add tasks schema and backend"
```

### Task 11: Build Tasks UI and dependency visualization

**Files:**
| Type | Path |
| --- | --- |
| Create | `client/src/pages/Tasks.tsx` |
| Modify | `client/src/pages/Projects.tsx` |
| Modify | `client/src/pages/Goals.tsx` |
| Modify | `client/src/App.tsx` |
| Modify | `client/src/components/DashboardLayout.tsx` |
| Test | `client/src/pages/Goals.test.tsx` |

**Step 1: Write the failing test**

Add a client test for creating tasks from a goal or project context and displaying dependency summaries.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run client/src/pages/Goals.test.tsx`

Expected: FAIL because the task UI flow is missing.

**Step 3: Write minimal implementation**

Build a Tasks page with list/detail handling, project and goal linking, and a plain dependency visualization that starts as a structured tree or badges rather than a heavy graph.

**Step 4: Run targeted and full tests**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm test`

Expected: PASS.

**Step 5: Commit**

```bash
cd /home/ubuntu/devasophy-pkm
git add client/src/pages/Tasks.tsx client/src/pages/Projects.tsx client/src/pages/Goals.tsx client/src/App.tsx client/src/components/DashboardLayout.tsx client/src/pages/Goals.test.tsx
git commit -m "feat: add tasks ui and dependency summaries"
```

---

## Phase 6 — Synthesis Layer: Ideas Module

### Task 12: Create Ideas schema and backend CRUD

**Files:**
| Type | Path |
| --- | --- |
| Modify | `drizzle/schema.ts` |
| Generate | `drizzle/000X_<generated>.sql` |
| Modify | `server/db.ts` |
| Modify | `server/routers.ts` |
| Test | `server/integration.test.ts` |

**Step 1: Write the failing test**

Add tests for idea creation, linking, update, deletion, and grouping metadata.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run server/integration.test.ts -t "idea"`

Expected: FAIL because the ideas module does not exist yet.

**Step 3: Write minimal implementation**

Create the ideas table, keep clustering/grouping as lightweight metadata initially, generate and apply the migration, then implement CRUD helpers and protected procedures.

**Step 4: Run targeted tests**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run server/integration.test.ts -t "idea"`

Expected: PASS.

**Step 5: Commit**

```bash
cd /home/ubuntu/devasophy-pkm
git add drizzle/schema.ts drizzle/*.sql server/db.ts server/routers.ts server/integration.test.ts
git commit -m "feat: add ideas schema and backend"
```

### Task 13: Build Ideas UI, linking, and grouping behavior

**Files:**
| Type | Path |
| --- | --- |
| Create | `client/src/pages/Ideas.tsx` |
| Modify | `client/src/App.tsx` |
| Modify | `client/src/components/DashboardLayout.tsx` |
| Modify | `client/src/pages/Home.tsx` |
| Test | `client/src/pages/Ideas.test.tsx` |

**Step 1: Write the failing test**

Add coverage for listing ideas, linking them to entries, editing idea metadata, and displaying grouping or clustering cues.

**Step 2: Run test to verify it fails**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm vitest run client/src/pages/Ideas.test.tsx`

Expected: FAIL because the page and linking UI do not exist.

**Step 3: Write minimal implementation**

Create the Ideas page with list/detail handling, idea-to-entry linking, and simple clustering through tags, stage, or group labels. Only add richer clustering once there is real data pressure for it.

**Step 4: Run targeted and full tests**

Run: `cd /home/ubuntu/devasophy-pkm && pnpm test`

Expected: PASS.

**Step 5: Commit**

```bash
cd /home/ubuntu/devasophy-pkm
git add client/src/pages/Ideas.tsx client/src/App.tsx client/src/components/DashboardLayout.tsx client/src/pages/Home.tsx client/src/pages/Ideas.test.tsx
git commit -m "feat: add ideas synthesis layer ui"
```

---

## Final verification checklist

After each phase, run the smallest relevant test first, then the full suite, then the live app flow. Do not batch multiple unverified phases into one checkpoint.

| Verification layer | Command or action | Expected outcome |
| --- | --- | --- |
| Targeted unit/integration test | `pnpm vitest run <specific-file>` | New behavior passes in isolation |
| Full regression suite | `cd /home/ubuntu/devasophy-pkm && pnpm test` | No regressions across the app |
| Type and runtime health | Project health check | No TypeScript or lsp errors |
| Browser validation | Open the relevant route and exercise the new flow | UI is usable and data persists |
| Checkpoint | Save checkpoint | Stable rollback point exists |

## Suggested commit boundaries

Use one commit per task, not one commit per phase. That keeps rollback precise and reviewable.

| Commit theme | Example message |
| --- | --- |
| Schema only | `feat: add zettelkasten id schema fields` |
| Backend contract | `feat: add goals schema and backend` |
| UI surface | `feat: add goals action layer ui` |
| Semantic links | `feat: expose directional link semantics in ui` |
| Synthesis UI | `feat: add ideas synthesis layer ui` |

## Out-of-scope guardrails

Do not add advanced graph visualizations, AI clustering, or nested hierarchy builders in the first pass of these phases unless a failing test or explicit user request justifies them. Keep each phase shippable, comprehensible, and reversible.

## Execution handoff

Plan complete and saved to `docs/plans/2026-05-26-pkm-integration-roadmap.md`.

Two execution options:

**1. Subagent-Driven (this session)** — I stay in this session, execute task-by-task, and review between tasks.

**2. Parallel Session (separate)** — Open a new session and implement from this plan using the executing-plans workflow.

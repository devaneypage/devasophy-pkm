# Performance and Release Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Notebook reads bounded, split page bundles by route, and establish an automated pre-release quality gate.

**Architecture:** `notebook.list` becomes a paginated contract with a separate deferred full-export procedure. React pages become dynamic route entries verified from Vite's manifest. GitHub Actions runs the complete deterministic suite against disposable services on pull requests, manual dispatch, and a weekly schedule.

**Tech Stack:** React 19, Wouter, tRPC 11, Drizzle/MySQL, Vite 7, Vitest, Playwright, GitHub Actions.

---

### Task 1: Paginated Notebook contract

**Files:**
- Modify: `server/db.ts`
- Modify: `server/routers.ts`
- Create: `shared/pagination.ts`
- Create: `shared/pagination.test.ts`
- Modify: `scripts/verify-all-endpoints.py`

**Steps:**
1. Add pure page-info construction with boundary tests.
2. Change the database helper to count, limit, and offset filtered results.
3. Bound router inputs to page 1+ and page size 1–100.
4. Add `notebook.exportAll` for explicit full-archive retrieval.
5. Update endpoint checks to assert page metadata and cover export.
6. Run pagination tests and TypeScript validation.

### Task 2: Migrate Notebook consumers

**Files:**
- Modify: `client/src/pages/Home.tsx`
- Modify: `client/src/pages/Ideas.tsx`
- Modify: `client/src/pages/Documents.tsx`
- Modify: `client/src/pages/Export.tsx`
- Modify: `client/src/pages/ProjectDetail.tsx`
- Modify: `client/src/pages/Synthesis.tsx`
- Modify: `client/src/pages/ThemeExplorer.tsx`
- Modify relevant component tests.

**Steps:**
1. Use `pageInfo.total` for dashboard metrics.
2. Request small first pages for selection controls.
3. Preserve dormant analysis pages with bounded 100-item reads.
4. Defer full export until the export action is invoked.
5. Run affected component tests.

### Task 3: Route-level code splitting

**Files:**
- Modify: `client/src/App.tsx`
- Create: `client/src/components/RouteLoading.tsx`
- Modify: `vite.config.ts`
- Create: `scripts/verify-route-chunks.mjs`
- Modify: `package.json`

**Steps:**
1. Replace eager page imports with `React.lazy` imports.
2. Add route-local accessible `Suspense` fallbacks.
3. Emit Vite's manifest and verify all registered pages are dynamic chunks.
4. Enforce an initial-entry size ceiling to prevent silent rebundling.
5. Build and compare initial bundle size with the prior 2,037,171-byte baseline.

### Task 4: Pre-release quality gate

**Files:**
- Replace: `.github/workflows/webpack.yml` with `.github/workflows/pre-release-quality-gate.yml`
- Modify: `drizzle.config.ts`
- Create: `scripts/mock-forge-server.mjs`
- Modify: `scripts/run-webapp-test-suite.sh`

**Steps:**
1. Correct Drizzle configuration to the canonical schema/migration directory.
2. Add an optional local Forge-compatible mock for deterministic CI.
3. Configure Node 22, pnpm, Python Playwright, disposable MySQL, migrations, and the full suite.
4. Trigger on pull requests, manual dispatch, and Sundays at 06:00 UTC.
5. Upload endpoint results and browser evidence on every run.

### Task 5: Verification and delivery

**Files:**
- Update: `docs/verification/`
- Update: `todo-go87jnry.md`

**Steps:**
1. Run `pnpm check`, targeted tests, and full `pnpm test:webapp`.
2. Verify all HTTP procedures and browser routes.
3. Verify the GitHub workflow run after checkpoint synchronization.
4. Confirm zero temporary test-data residue.
5. Save a WebDev checkpoint and report the measured performance and bundle deltas.

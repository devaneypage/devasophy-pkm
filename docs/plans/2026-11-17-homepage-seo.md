# Homepage SEO Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix homepage title, description, keywords, and descriptive H2 while preserving authenticated and signed-out UI.

**Architecture:** Provide static metadata in `client/index.html` and apply the homepage title with `document.title` from an effect in the dashboard shell before its authentication gate. Use shared copy for the public and authenticated descriptive H2. Restore prior metadata on route exit. Do not expose private dashboard data or add SSR as part of this fix.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library.

## Approved limits and copy

- Title (30–60): `Devasophy PKM | Personal Knowledge & Research Workspace` (55 characters).
- Description (50–160): `Organize notes, quotations, ideas, and research in Devasophy PKM. Connect knowledge with a personal lexicon, project tools, and AI-powered synthesis.` (149 characters).
- Keywords (3–8): personal knowledge management; research workspace; commonplace notebook; personal lexicon; AI synthesis (5).
- H2 (maximum 80): `Your personal knowledge and research workspace` (46 characters).

## Task 1 — Regression tests

Create `client/src/components/DashboardLayout.seo.test.tsx`: render the signed-out home shell; check the exact title/description/keywords/H2 and all strict limits. Check repeated renders do not create duplicate tags. Check route exit restores prior metadata and non-home routes do not apply home metadata. Add the descriptive authenticated H2 assertion in `client/src/pages/Home.test.tsx`.

Run `pnpm exec vitest run client/src/components/DashboardLayout.seo.test.tsx client/src/pages/Home.test.tsx`; expect new tests to fail before implementation.

## Task 2 — Minimal implementation

Create `client/src/hooks/useHomepageSeo.ts` with metadata constants, deduplicating meta-tag handling, title assignment, and effect cleanup. Call it in `DashboardLayout.tsx` before authentication early returns. Add a visible descriptive H2 to its signed-out home view. Reuse the heading in the default Home arrangement header. Update `client/index.html` with escaped static title, description, and keywords.

## Task 3 — Verification and checkpoint

Run focused tests, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`, `pnpm check:bundle`, and `git diff --check`. Verify live rendered home metadata/title/H2 without authentication, inspect desktop/mobile layouts, and save a checkpoint. Do not publish separately or implement the paused six-area roadmap in this SEO fix.

## Execution results

Completed 2026-11-17. Static HTML and runtime `document.title` both use the 55-character title. The description has 149 characters; the keywords tag contains exactly five focused terms; the descriptive H2 has 46 characters. Metadata runs before the authentication gate and restores previous values on route exit.

Validation: 13 focused tests passed, all 331 tests passed across 37 files, TypeScript passed, production build passed, route-bundle guard passed, and `git diff --check` passed. The existing large-chunk build advisory remains non-fatal. A fresh signed-out Chromium context verified exact runtime values, one description tag, one keywords tag, the visible H2, and zero page errors. Desktop/mobile authenticated screenshots and a signed-out mobile screenshot were inspected.

The six-area roadmap remains paused; this checkpoint contains only the scoped SEO fix and its tests/documentation.

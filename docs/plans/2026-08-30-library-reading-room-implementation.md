# Library Reading Room Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the `/library` alias with a dedicated, responsive Artifact Index that supports calm retrieval and preserves Commonplace as the drafting workspace.

**Architecture:** The Library consumes the existing authenticated `commonplace.bootstrap` snapshot; it introduces no new schema or API surface. Client-side query state combines a text query, content-type selection, and session-only starred records. The page derives readable source, region, preview, and count metadata from the existing flexible Commonplace entry content. Commonplace remains independently reachable at `/commonplace`.

**Tech Stack:** React 19, TypeScript, Wouter, tRPC React Query, Tailwind 4, Lucide React, Vitest, Testing Library.

---

### Task 1: Establish an explicit Library information architecture

**Files:**
- Create: `client/src/pages/Library.tsx`
- Create: `client/src/pages/Library.test.tsx`
- Modify: `client/src/App.tsx`
- Modify: `client/src/components/DashboardLayout.tsx`

**Steps:**
1. Treat the Library as a retrieval surface and Commonplace as a drafting surface; do not reuse the editable board UI at `/library`.
2. Build an editorial header, artifact count, query field, active-filter summary, type filters, and a `New artifact` escape route to Commonplace.
3. Render a desktop comparison table alongside a focused reader-margin panel; present equivalent catalogue cards at narrow widths.
4. Add keyboard-visible controls and use `aria-pressed` for the query facets and star actions.
5. Register a lazy `Library` route with the existing dashboard shell and a distinct `library` current-module state.
6. Add the Library navigation entry without changing existing Commonplace access gating.

**Verification:** Add component tests covering initial hierarchy, free-text filtering, taxonomy filtering, starring, selection, empty state, and the drafting escape route.

### Task 2: Apply the Devanomy reading-room visual language

**Files:**
- Modify: `client/src/index.css`

**Steps:**
1. Reuse the existing paper, ink, Playfair, grid, and taxonomy token system; do not introduce an unrelated application theme.
2. Add a shallow editorial hero field, a controlled query surface, metadata rules, slim colored index bars, reader-margin panel, and compact mobile catalogue treatments.
3. Keep all enrichment decorative rather than structural, maintain focus indications, and turn off nonessential transforms under reduced motion.

**Verification:** Inspect at desktop and mobile widths; confirm title, count, controls, records, and reader panel preserve a readable hierarchy.

### Task 3: Preserve route-splitting enforcement and regression coverage

**Files:**
- Modify: `scripts/verify-route-chunks.mjs`

**Steps:**
1. Raise the explicit route-import expectation from 15 to 16 after adding the Library page.
2. Build and run the route-chunk guard; confirm the Library module remains a dynamic route import.

**Verification:** Run `pnpm check`, the focused Library Vitest test, `pnpm build`, and `pnpm check:bundle`.

### Task 4: Browser verification and checkpoint

**Files:**
- Create: `scripts/verify-library-reading-room.py`
- Modify: `todo-go87jnry.md`

**Steps:**
1. Run the existing authenticated endpoint fixture process or use the active preview session to inspect `/library`.
2. Verify query, type selection, starring, selection, empty state, and navigation to the drafting workspace in Chromium while recording console and page errors.
3. Capture an implementation report and save a WebDev checkpoint after successful validation.

**Rollback:** The Library route is additive. Restore the previous alias by reverting the `Library` lazy import and returning `/library` to `Commonplace` in `client/src/App.tsx`.

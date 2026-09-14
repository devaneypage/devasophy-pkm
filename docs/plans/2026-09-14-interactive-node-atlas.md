# Interactive Node Atlas Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the dashboard’s static Node Atlas preview into an accessible, client-side exploratory map that reveals relationship details and routes users to the relevant collection.

**Architecture:** Extend the existing `NodeAtlas` component in `client/src/pages/Home.tsx` with local selection state. Nodes remain the existing three aggregate collections (Notes, Terms, Drafts); edges remain the server-provided aggregate relationship counts. Selecting a node highlights its incident edges and exposes a compact detail panel with a collection shortcut. Selecting an edge exposes its pair and count. No schema, endpoint, or persistence changes are needed.

**Tech Stack:** React 19, TypeScript, Tailwind 4, Lucide icons, Vitest + Testing Library.

---

### Task 1: Add focused interaction tests

**Files:**
- Modify: `client/src/pages/Home.test.tsx`

**Step 1:** Add tests that render the dashboard with the existing relationship fixture, select the Notes node, verify its detail state and collection shortcut, then select the Notes–Drafts edge and verify its relationship count.

**Step 2:** Run the focused test and confirm the new assertions fail before implementation.

### Task 2: Implement the interactive Atlas

**Files:**
- Modify: `client/src/pages/Home.tsx`

**Step 1:** Add stable node metadata including route destinations and accessible labels.

**Step 2:** Add local selection state for one node or one edge, with a clear-selection action.

**Step 3:** Make SVG nodes keyboard-focusable buttons via `<g role="button">` semantics, add `tabIndex`, Enter/Space handlers, and visible selected/focus styling.

**Step 4:** Make relationship lines selectable with transparent hit areas, accessible labels, and highlight behavior based on the selected node or edge.

**Step 5:** Add a detail panel below the SVG that explains the selected node/edge, displays the count, and provides a route shortcut. Preserve a neutral initial state and an empty state when no relationships exist.

**Step 6:** Keep the existing dashboard “Explore relations” action intact and avoid changing the server response contract.

### Task 3: Verify and document

**Files:**
- Modify: `docs/plans/2026-09-14-interactive-node-atlas.md`

**Step 1:** Run focused tests, the full Vitest suite, TypeScript validation, and production build.

**Step 2:** Capture desktop and mobile dashboard screenshots and inspect for clipping, focus affordances, and Atelier visual consistency.

**Step 3:** Save a WebDev checkpoint describing the completed Atlas interaction and verification results.

**Expected validation:** Existing tests remain green; the new tests cover node selection, edge selection, navigation shortcut, and no-relationship fallback. No database migration is generated.

# Deduplication Tool Implementation Plan

**Goal:** Add a standalone Devanomy deduplication workspace that scans eligible records across modules, groups likely duplicates, and supports immediate actions with same-module merge plus cross-module canonical keep and archive or delete review.

**Architecture:** The feature will reuse and generalize the existing duplicate-detection utilities into a unified backend service that normalizes records from Commonplace, Lexicon, Books, Notes, and Ideas into a comparable shape. The backend will expose scan and apply procedures through a dedicated router, while the frontend will add a new dashboard page for reviewing duplicate groups, selecting a canonical record, and applying allowed actions safely.

**Tech Stack:** React 19, Tailwind 4, Express 4, tRPC 11, Drizzle ORM, Vitest.

---

## Finalized Scope

| Module | Duplicate rule | Included in first version |
|---|---|---|
| Commonplace | `title + content` and/or `zettelkastenId` if available | Yes |
| Lexicon | `term + definition` | Yes |
| Books | `title + author` | Yes |
| Notes / Documents | `title + content` or `uuid` | Yes |
| Ideas | `title + summary` or `uuid` | Yes |
| Goals | None | No |
| Projects | None | No |
| Tasks | None | No |

| Match type | Allowed actions |
|---|---|
| Same-module duplicate | Keep canonical, merge, archive, delete |
| Cross-module duplicate | Keep canonical, archive other, delete other |

## Task 1: Backend duplicate model and scan helpers

**Files:**
- Modify: `server/duplicateDetection.ts`
- Modify: `server/db.ts`
- Test: `server/duplicateDetection.test.ts`

Implement a unified duplicate record type that can represent Commonplace, Lexicon, Books, Documents, and Ideas. Add normalization helpers for string comparison, content extraction for Commonplace JSON content, and comparison helpers for the approved rules. Add scan helpers that return duplicate groups with confidence score, match basis, and whether the group is same-module or cross-module.

## Task 2: Backend actions and safeguards

**Files:**
- Modify: `server/db.ts`
- Modify: `server/routers.ts`
- Create or modify: `server/deduplication.test.ts`

Add a dedicated `deduplication` router with procedures to scan duplicates and apply actions. The apply endpoint should validate that merge is only used when every selected item belongs to the same module. Cross-module actions should require a canonical record plus archive or delete operations for the remaining items. Reuse existing update and delete helpers where possible and add archive behavior for modules that already support archival flags or status-based archival.

## Task 3: Frontend workspace and navigation

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/components/DashboardLayout.tsx`
- Create: `client/src/pages/Deduplication.tsx`
- Create or modify: `client/src/components/DeduplicationReviewTable.tsx`

Add a new sidebar entry and route for the deduplication workspace. Build a page that can launch a scan, show grouped duplicate candidates, label same-module versus cross-module matches, let the user select a canonical item, and expose only valid actions for the selected group. Reuse existing visual language from Import and Export rather than the import-specific duplicate resolver component.

## Task 4: Testing and verification

**Files:**
- Modify: `server/duplicateDetection.test.ts`
- Create or modify: `server/deduplication.test.ts`
- Create or modify: `server/inline-editing.ui.test.tsx` or other frontend test file if needed

Cover normalization, group detection, same-module merge restrictions, cross-module action restrictions, and canonical selection. Run targeted Vitest coverage first, then the relevant broader suite. After automated tests pass, refresh project health and manually verify the new workspace in the running app.

## Task 5: Tracking and checkpoint

**Files:**
- Modify: `todo.md`

Mark completed deduplication tasks as done immediately after each milestone. Before saving a checkpoint, verify that the new route, backend actions, and tests are all complete and reflected in `todo.md`.

## Success Criteria

The finished feature should allow a signed-in user to open a dedicated deduplication page, scan the included modules, review duplicate groups, merge only within the same module, and archive or delete non-canonical records for cross-module matches. The backend should reject invalid action combinations, and Vitest coverage should verify both detection and action rules.

## Rollback Plan

If the new router or UI destabilizes the workspace, revert to the last stable checkpoint before the deduplication feature and reintroduce the feature behind a dedicated workspace flag.

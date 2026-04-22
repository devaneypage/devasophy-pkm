# Johnny Decimal Seeding and Inline Editing Implementation Plan

**Date:** 2026-04-22  
**Project:** Devasophy PKM  
**Estimated Time:** 3.5 hours

---

## Overview

This plan adds two coordinated capabilities to the Devasophy PKM application. First, it seeds the Johnny Decimal taxonomy categories needed for the current knowledge architecture and exposes them cleanly to the application so forms and navigation can rely on stable category data. Second, it completes inline editing support for quotations, vocabulary, and general notes inside the current Devanomy light-scheme UI. The work is sequenced to stabilize the taxonomy layer first, then complete backend update/delete support, then finish the editing interfaces, and finally verify everything with automated tests and application checks.

---

## Task Breakdown

### Task 1: Seed Johnny Decimal taxonomy and expose selectors

**Estimated Time:** 75 minutes

**Objective:** Create or normalize persistent taxonomy data so notebook, lexicon, and document workflows can use seeded Johnny Decimal areas and categories.

**Steps:**

1. **Review and normalize taxonomy model usage**
   - Action: Confirm how `taxonomyAreas`, `taxonomyCategories`, `notebookEntries.categoryId`, `lexiconEntries.categoryId`, and `documents.categoryId` are currently used.
   - Files: `drizzle/schema.ts`, `server/db.ts`, `server/routers.ts`
   - Expected Output: Clear implementation shape for category seeding and category retrieval.

2. **Implement seeding helpers and backend access**
   - Action: Add reusable seed data and helper functions to insert or upsert Johnny Decimal areas/categories for the active user, then expose them through protected procedures.
   - Files: `server/db.ts`, `server/routers.ts`, optional shared helper file if needed
   - Expected Output: Taxonomy data can be created and fetched from the app without manual SQL.

3. **Add category selectors to relevant forms**
   - Action: Connect form UIs to taxonomy queries and add category dropdowns for notebook, lexicon, and document authoring/editing where appropriate.
   - Files: `client/src/pages/Notebook.tsx`, `client/src/pages/Lexicon.tsx`, `client/src/pages/Documents.tsx`
   - Expected Output: Users can assign seeded Johnny Decimal categories during create/edit workflows.

**Testing:**
- [ ] Taxonomy seeding creates the expected area/category structure without duplicates.
- [ ] Category queries return seeded results for the authenticated user.

**Success Criteria:**
- The database contains seeded Johnny Decimal taxonomy data usable by the current PKM modules.
- Create and edit forms can select a category and persist it successfully.

---

### Task 2: Complete backend update/delete support for editable repositories

**Estimated Time:** 45 minutes

**Objective:** Ensure quotations, vocabulary, and general notes all have stable update/delete procedures and query helpers that support inline editing.

**Steps:**

1. **Verify and extend backend procedures**
   - Action: Confirm notebook and lexicon update/delete support, and adjust inputs to include category updates where needed.
   - Files: `server/routers.ts`, `server/db.ts`
   - Expected Output: All targeted repositories support create, update, delete, and category reassignment.

2. **Harden shared mutation behavior**
   - Action: Make sure update paths safely handle optional fields and preserve current data integrity.
   - Files: `server/db.ts`
   - Expected Output: Inline edits can update only changed fields without corrupting records.

**Testing:**
- [ ] Notebook update/delete flows work for quotations and general notes.
- [ ] Lexicon update/delete flows work for vocabulary entries.

**Success Criteria:**
- Backend procedures support all user-selected inline editing scenarios.
- Category changes can be submitted during entry edits.

---

### Task 3: Build inline editing UI for quotations, vocabulary, and general notes

**Estimated Time:** 75 minutes

**Objective:** Add edit-in-place workflows that match the current Devanomy UI language.

**Steps:**

1. **Add notebook inline editing workflow**
   - Action: Introduce edit state or dialog support to the notebook list so quotes and general notes can be updated without leaving the page.
   - Files: `client/src/pages/Notebook.tsx`
   - Expected Output: Notebook cards support edit, save, cancel, and delete actions.

2. **Add lexicon inline editing workflow**
   - Action: Add edit affordances to vocabulary cards or detail expansion views while preserving the current glossary browsing experience.
   - Files: `client/src/pages/Lexicon.tsx`
   - Expected Output: Vocabulary entries can be edited inline and saved with mutation feedback.

3. **Refine UX states**
   - Action: Add loading, pending, and error states for edit/delete actions in both repositories.
   - Files: `client/src/pages/Notebook.tsx`, `client/src/pages/Lexicon.tsx`
   - Expected Output: Editing feels consistent with the rest of the app and is visually clear.

**Testing:**
- [ ] Notebook inline edit updates visible content after save.
- [ ] Lexicon inline edit updates visible content after save.
- [ ] Delete actions still work after adding edit UI.

**Success Criteria:**
- Users can edit quotations, vocabulary entries, and general notes directly from their repository views.
- The Devanomy layout remains visually consistent after adding editing controls.

---

### Task 4: Verify, document, and checkpoint

**Estimated Time:** 35 minutes

**Objective:** Validate the new feature set and prepare a recoverable project state.

**Steps:**

1. **Add and run automated tests**
   - Action: Add Vitest coverage for taxonomy seeding and inline editing support, then run the full test suite.
   - Files: `server/*.test.ts`, optional shared tests
   - Expected Output: Regression-safe automated coverage for the new feature set.

2. **Run application verification**
   - Action: Check application health and confirm there are no TypeScript or build issues.
   - Files: project-wide
   - Expected Output: Clean development status and working UI.

3. **Update tracker and save checkpoint**
   - Action: Mark completed roadmap items in `todo.md` and save a checkpoint with a detailed summary.
   - Files: `todo.md`
   - Expected Output: Project tracker and checkpoint both reflect the implemented changes.

**Testing:**
- [ ] Full test suite passes.
- [ ] Dev status shows no TypeScript errors.

**Success Criteria:**
- The selected roadmap items are complete, tested, and checkpointed.
- The project can be reviewed or rolled back cleanly.

---

## Dependencies

| Dependency | Description |
|---|---|
| Task 2 depends on Task 1 | Editing flows should use the final seeded category shape so edit/create forms stay consistent. |
| Task 3 depends on Task 2 | UI editing should target stable backend procedures before component changes are finalized. |
| Task 4 depends on Tasks 1–3 | Tests and checkpointing should only happen after feature work is complete. |

---

## Testing Strategy

**Unit Tests:**

| Area | Location | Focus |
|---|---|---|
| Taxonomy seeding | `server/*taxonomy*.test.ts` or existing PKM tests | Seed creation, duplicate safety, retrieval |
| Notebook editing | `server/pkm.test.ts` or follow-up test file | Update/delete behavior, category persistence |
| Lexicon editing | `server/pkm.test.ts` or follow-up test file | Update/delete behavior, field updates |

**Integration Tests:**

| Scenario | Expected Result |
|---|---|
| Seed taxonomy then load forms | Category selectors display seeded options |
| Edit notebook entry | Updated content appears in repository view |
| Edit lexicon entry | Updated term metadata appears in glossary view |

**Manual Verification:**

| Check | Expected Result |
|---|---|
| Notebook create/edit form | Category selector works and saves successfully |
| Lexicon create/edit form | Category selector works and saves successfully |
| UI consistency | Edit controls match the Devanomy design system |
| Error handling | Pending and failure states remain understandable |

---

## Rollback Plan

If issues arise:
1. Revert to the latest stable checkpoint from the management history.
2. Remove partial UI hooks for category selectors or inline editing if backend alignment fails.
3. Re-run tests and health checks before creating a replacement checkpoint.

---

## Post-Implementation

- [ ] Update documentation if category workflows become user-facing enough to warrant README changes
- [ ] Create checkpoint with detailed description
- [ ] Update `todo.md` to mark selected tasks complete
- [ ] Report the completed roadmap items back to the user

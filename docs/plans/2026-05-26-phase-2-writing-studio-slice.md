# Phase 2 — Writing Studio Slice Design

## Objective

The first Phase 2 implementation slice will focus on the **Research & Writing Studio**, because the current `Documents.tsx` page already owns document selection, markdown editing, inline reference insertion, and semantic link creation. This makes it the most efficient place to deliver visible Phase 2 value without first performing disruptive schema migrations.

## Recommended slice

The recommended first slice combines two tightly related upgrades.

| Priority | Feature | Why it should come first | Expected files |
| --- | --- | --- | --- |
| 1 | Rich linked references panel | The existing panel currently shows only relationship labels and numeric target IDs. Enriching it with titles, previews, and navigation will make document-linked knowledge actually usable while writing. | `server/db.ts`, `server/routers.ts`, `client/src/pages/Documents.tsx` |
| 2 | Research Assistant in Writing Studio | The app already has a reusable `AIChatBox` and an established server-side LLM integration pattern. Embedding the assistant into the document workspace creates immediate workflow value and can reuse the linked-reference context. | `client/src/components/AIChatBox.tsx`, `client/src/pages/Documents.tsx`, `server/routers.ts` |
| 3 | Collections migration plan | This affects notebook and likely other entry surfaces more broadly, so it should be designed after the Writing Studio slice is stabilized. | `drizzle/schema.ts`, affected CRUD pages |
| 4 | DIKW expansion plan | This is important, but it is a model-wide change and should follow once the document workflow improvements are checkpointed. | `drizzle/schema.ts`, module forms, synthesis surfaces |

## Current baseline

The current Writing Studio already supports document CRUD, markdown editing, reference search across notebook and lexicon entries, and semantic link creation when a reference is inserted. The current weak points are that linked references are not enriched, the writing workspace has no assistant panel, and document procedures do not provide assembled research context.

## Proposed implementation approach

The first build should add a new backend workflow that resolves semantic links into enriched reference cards containing target metadata, excerpts, and direct destination URLs. In parallel, the documents router should gain a research-assistant mutation that accepts the current document, the user prompt, and selected contextual references. The frontend should then evolve the right rail into two coordinated surfaces: an enriched linked references panel and an embedded AI assistant panel that can answer questions about the current draft and nearby linked material.

## Testing target

This slice should finish with backend tests for the new enriched reference and research-assistant procedures, plus client-side regression coverage for the updated Writing Studio interaction where feasible within the existing Vitest setup.

## Relational collections migration path

The notebook module still relies on a legacy string `collections` field. The safer migration path is to introduce a normalized pair of tables such as `collections` and `entry_collections`, backfill existing notebook collection labels into canonical collection records per user, and then update notebook CRUD to read and write through the relational join instead of the legacy string column. Once notebook is stable, the same join model can be extended to documents, projects, and tasks if the product direction still favors cross-module collections rather than module-specific grouping.

## DIKW expansion path

DIKW is currently persisted only on lexicon entries. A staged expansion should add a shared `dikwTier` enum-compatible field to `notebook_entries`, `documents`, `projects`, and `tasks`, update their create and edit forms to expose the field consistently, and then revise synthesis and filtering surfaces to use the richer cross-module signal. Because projects and tasks already function as an action layer, their defaults should likely lean toward `knowledge` or `wisdom` in the UI while still allowing all four tiers.

## Suggested next implementation order

| Order | Slice | Reason |
| --- | --- | --- |
| 1 | Writing Studio linked references + assistant | Highest visible leverage with minimal schema disruption |
| 2 | Add DIKW fields to notebook and documents | Strengthens research and synthesis first |
| 3 | Add DIKW fields to projects and tasks | Extends the action layer after document workflows settle |
| 4 | Normalize collections into relational tables | Broadest migration impact, best done after UI surfaces stabilize |

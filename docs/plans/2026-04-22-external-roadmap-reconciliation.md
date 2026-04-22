# External Roadmap Reconciliation — Devasophy PKM

## Overview

This note records the reconciliation between the external `devasophy_PKLwebsite-todo.md` roadmap and the currently implemented Devasophy PKM application. It also captures the next prioritized feature set so subsequent sessions can continue from a documented baseline rather than relying on chat history alone.

## Reconciliation Summary

The current application already covers the core three-module architecture, Devanomy light-scheme redesign, Johnny Decimal sidebar taxonomy, bulk import and autofill workflows, automatic quote categorization, unified search, export options, and the latest inline editing work for notebook and lexicon records.

The external roadmap still identifies several follow-up opportunities that are only partially addressed in the current build. The most relevant unfinished items at this stage are centered on deeper cross-note linking workflows and clearer support for general notes as a distinct note pattern inside the notebook ecosystem.

## Current Status Table

| Roadmap area | Current status | Notes |
| --- | --- | --- |
| Three primary PKM modules | Implemented | Commonplace Notebook, Clavis Aurea, and Research & Writing Studio are active in the app. |
| Devanomy light visual identity | Implemented | Light palette, typography, wordmark, and custom iconography are already integrated. |
| Johnny Decimal taxonomy | Implemented | Seeded categories, sidebar hierarchy, and form selection are now in place. |
| Bulk import and autofill | Implemented | Quotes and Clavis Aurea JSON flows are supported. |
| Automatic quote categorization | Implemented | Import helpers enrich tags and collections automatically. |
| Inline editing for notebook and lexicon | Implemented | Quotations, notes, and vocabulary entries can now be edited inline. |
| Bidirectional note-linking workflows | Partial | Backend link infrastructure exists, but UI workflows need refinement and more direct affordances. |
| General notes as a more explicit note type | Partial | Notebook supports notes, but the external roadmap suggests clearer note-specific CRUD and presentation flows. |

## Selected Next Highest-Priority Feature Set

The next highest-priority unfinished feature set is **bidirectional note-linking workflow refinement with note-oriented CRUD enhancements**.

This priority was selected because the data layer for semantic links already exists, which lowers implementation risk, and because improved linking directly increases the value of the PKM as an interconnected scholarly system. It also aligns with the external roadmap items that remain most structurally significant after taxonomy seeding and inline editing were completed.

## Implementation Plan

### Objective

Improve how users create, inspect, and navigate note-to-note and cross-module links, while also clarifying the treatment of general notes inside the notebook workflow.

### Planned Tasks

| Task | Description | Key files likely involved | Verification |
| --- | --- | --- | --- |
| Task 1 | Audit current semantic link UI surfaces and define the missing interaction states for create, view, and navigate workflows. | `client/src/pages/Notebook.tsx`, `client/src/pages/Lexicon.tsx`, `client/src/pages/Documents.tsx`, `client/src/pages/*Detail*.tsx` | Manual UI verification plus notes in this plan file |
| Task 2 | Add a clearer link-management panel or inline section for notebook and lexicon records. | `client/src/pages/Notebook.tsx`, `client/src/pages/Lexicon.tsx`, possible new component under `client/src/components/` | Component behavior tests and interaction verification |
| Task 3 | Improve backlink display so users can see incoming and outgoing relationships more explicitly. | `server/routers.ts`, `server/db.ts`, linked reference UI files | Integration tests for link retrieval and display logic |
| Task 4 | Distinguish general notes more clearly within notebook CRUD, either through UI labeling, filtering, or a note-specific creation preset. | `client/src/pages/Notebook.tsx`, shared formatting or filtering helpers if needed | UI tests for note creation and editing paths |
| Task 5 | Add or extend Vitest coverage for linking workflows and note-specific interactions. | `server/*.test.ts`, `shared/*.test.ts`, and jsdom UI tests as appropriate | Full test suite pass |

## Success Criteria

The next feature set should be considered complete when users can create and inspect semantic links with less ambiguity, navigate linked records more directly, and work with general notes in a way that is visually and behaviorally distinct enough to satisfy the external roadmap’s intent.

## Rollback Note

If the next feature set introduces UI complexity or confusing link behavior, the safe rollback point is checkpoint `19f76dbb`, which captures the completed Johnny Decimal seeding and inline editing work with passing tests.

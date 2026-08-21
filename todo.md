# Devasophy PKM — Project TODO

## Phase 1: Architecture & Design
- [x] Database schema design (users, entries, lexicon, documents, links, tags, taxonomy)
- [x] Data model planning for cross-module linking
- [x] Johnny Decimal taxonomy structure definition

## Phase 2: Database & Core Models
- [x] Create database schema in drizzle/schema.ts
- [x] Generate and apply migrations
- [x] Create database helper functions in server/db.ts

## Phase 3: Design System & Layout
- [x] Implement dark scholarly color palette (navy, charcoal, gold, parchment)
- [x] Set up Playfair Display and sans-serif typography
- [x] Create DashboardLayout with persistent sidebar
- [x] Build global navigation and breadcrumb system
- [x] Create quick-capture widget component

## Phase 4: Module 1 — Commonplace Notebook
- [x] Create database table for notebook entries
- [x] Build CRUD procedures (create, read, update, delete)
- [x] Create entry form with rich-text editor
- [x] Build entry list view with filtering and sorting
- [x] Implement source metadata fields (author, work, date, tags)
- [x] Create entry detail view

## Phase 5: Module 2 — Clavis Aurea Personal Lexicon
- [x] Create database table for lexicon entries
- [x] Build CRUD procedures for lexicon
- [x] Create alphabetical index browser
- [x] Build search and filter UI (by term, POS, source type, date)
- [x] Create entry detail view with definition, etymology, origin, notes
- [x] Implement bulk import from Clavis_Aurea_Complete.json

## Phase 6: Module 3 — Research & Writing Studio
- [x] Create database table for documents
- [x] Build Markdown editor component
- [x] Create document CRUD procedures
- [x] Build linked references panel
- [x] Implement inline reference pulling (lexicon terms, notebook entries)
- [x] Create document organization by project and folder

## Phase 7: Cross-Module Semantic Linking
- [x] Create database table for bi-directional links
- [x] Implement link creation procedures
- [x] Build reference panel UI for viewing linked entries
- [x] Create backlink display in entry detail views

## Phase 8: Bulk Import & Export
- [x] Build bulk import tool UI
- [x] Implement CSV import for notebook entries (JSON fallback available)
- [x] Implement JSON import for Clavis Aurea (Clavis_Aurea_Complete.json)
- [x] Implement JSON import for notebook entries (Quotes JSON)
- [x] Build export functionality (Markdown, JSON, plain text)
- [x] Create export download interface

## Phase 9: Unified Search & Johnny Decimal Taxonomy
- [x] Implement unified search across all modules
- [x] Build search results view with module filtering
- [x] Create Johnny Decimal taxonomy sidebar navigation
- [x] Display area, category, and ID hierarchy
- [x] Add entry count badges per module/category

## Phase 10: Polish & Finalization
- [x] Write vitest tests for core procedures (19 tests passing)
- [x] Test cross-module linking workflows (23 integration tests passing)
- [x] Verify import/export functionality (42 total tests passing)
- [x] Performance optimization and UI refinement (core features optimized)
- [x] Accessibility review (dark mode, contrast, keyboard navigation verified)
- [x] Final design polish (scholarly aesthetic complete)

## Phase 11: Delivery
- [x] Create final checkpoint
- [x] Deliver website to user

## UI Refresh — Devanomy Light-Scheme Redesign
- [x] Convert the global theme from dark scholarly styling to a light Devanomy-inspired palette
- [x] Update typography, logo treatment, and brand tokens to match the uploaded Devanomy identity
- [x] Restyle the persistent sidebar with Devanomy layout proportions, accents, and pattern language
- [x] Redesign the dashboard home screen using the uploaded Devanomy card composition and search/header treatment
- [x] Apply Devanomy-inspired iconography and status shapes across navigation and module cards
- [x] Rework notebook, Clavis Aurea, research studio, search, import, and export pages into the new light visual system
- [x] Add reusable decorative pattern utilities inspired by the uploaded Devanomy assets
- [x] Verify contrast, responsiveness, and visual consistency after the redesign
- [x] Run tests and save a new checkpoint for the UI refresh

## Follow-up Enhancements — Devanomy Icons and File Drop Import
- [x] Add custom SVG Devanomy icons for every module tile and related navigation surfaces
- [x] Add drag-and-drop import for the Clavis Aurea JSON workflow
- [x] Add drag-and-drop import for the Quotes JSON workflow
- [x] Test the new icon system and drag-and-drop import behavior
- [x] Save a checkpoint for the follow-up enhancements

## Follow-up Enhancements — One-Click Import Autofill
- [x] Add one-click autofill for the previously uploaded Quotes file in Bulk Import
- [x] Add one-click autofill for the previously uploaded Clavis Aurea file in Bulk Import
- [x] Test the autofill import workflow
- [x] Save a checkpoint for the autofill enhancement

## Follow-up Enhancements — Automatic Quote Categorization
- [x] Add content-based automatic categorization for imported quotes
- [x] Apply inferred categories during quote JSON import and one-click autofill import flows
- [x] Add tests for quote categorization rules and import behavior
- [x] Save a checkpoint for the quote categorization enhancement

## External TODO Reconciliation — Attached PKM Roadmap
- [x] Compare the attached Devanomy/Devasophy TODO against the current implemented site and identify unfinished or divergent items
- [x] Select the next highest-priority unfinished feature set from the attached roadmap for implementation
- [x] Create a detailed implementation plan for the selected roadmap items

## Selected Roadmap Implementation — Johnny Decimal and Inline Editing
- [x] Seed all Johnny Decimal categories required for the current PKM taxonomy into the database
- [x] Expose seeded Johnny Decimal categories through backend procedures for form and navigation use
- [x] Add category selector support to relevant note creation and editing forms
- [x] Add update and delete procedures for quotations
- [x] Add update and delete procedures for vocabulary entries
- [x] Add update and delete procedures for general notes
- [x] Add inline edit dialog to the vocabulary interface
- [x] Add inline edit dialog to the general notes interface
- [x] Verify quotation editing workflows in the current quote browser UI
- [x] Add tests for category seeding, category selection, and inline editing flows
- [x] Save a checkpoint for the Johnny Decimal and inline editing feature set

## Follow-up Enhancement — Clearer General Note Creation Mode
- [x] Add a clearer general-note creation mode in the notebook
- [x] Update notebook UI copy and form behavior to distinguish general notes from quotations
- [x] Add tests covering the general-note creation workflow
- [x] Save a checkpoint for the general-note creation enhancement

## Follow-up Feedback — Attached Priority UI/UX Changes
- [x] Review attached branding and homepage UI feedback
- [x] Decide whether to prioritize naming consistency, logo treatment, background warmth, ambient background texture, or OAuth button loading state next (naming consistency completed first)

## Naming Consistency — Standardize to Devanomy
- [x] Update browser tab title to "Devanomy" in index.html
- [x] Update workspace heading from "DEVASOPHY WORKSPACE" to "DEVANOMY WORKSPACE" (already present in Home.tsx)
- [x] Update all button labels and visible branding text to use Devanomy (verified in Home.tsx and Search.tsx)
- [x] Verify naming consistency across all pages and components
- [x] Save a checkpoint for the naming-consistency update

## Logo & Card Warmth — Visual Branding Enhancement
- [x] Upload the primary Devanomy logo (primary-logo-full.png) to S3
- [x] Add the logo to the home card above the greeting
- [x] Update the card background color to an off-white (#F5F3F0 or similar warm tone)
- [x] Verify the logo displays correctly and the card warmth complements the dark sidebar
- [x] Save a checkpoint for the logo and card-warmth enhancement


## Integration Analysis — Devanomy PKM Reference Site
- [x] Analyze the other Devanomy PKM website (https://devanomy.manus.space)
- [x] Document the Four-Layer PKM Framework
- [x] Document the Zettelkasten ID system specification
- [x] Document enhanced linking semantics with directional symbols
- [x] Create comprehensive integration roadmap with prioritized features
- [x] Save analysis to docs/analysis/devanomy-pkm-integration-analysis.md

## Recommended Features for Future Implementation
- [x] Phase 1: Implement Zettelkasten ID system (AC.ID-YYYYMMDD-Seq format)
- [x] Phase 2: Enhance linking semantics with directional symbols (→, ←, ↔)
- [x] Phase 3: Implement Goals module (Action Layer)
- [x] Phase 4: Implement Projects module (Action Layer)
- [x] Phase 5: Implement Tasks module (Action Layer)
- [x] Phase 6: Implement Ideas module (Synthesis Layer)


## Phase 1: Zettelkasten ID System Implementation
- [x] Add zettelkastenId field to notebookEntries table schema
- [x] Add zettelkastenId field to lexiconEntries table schema
- [x] Generate and apply database migration SQL
- [x] Implement ID generation procedure (AC.ID-YYYYMMDD-Seq format)
- [x] Create tRPC procedure to generate Zettelkasten ID for new entries
- [x] Update notebook create form to display generated ID
- [x] Update lexicon create form to display generated ID
- [x] Update notebook detail view to show Zettelkasten ID
- [x] Update lexicon detail view to show Zettelkasten ID
- [x] Add copy-to-clipboard functionality for IDs (ZettelkastenIdDisplay component)
- [x] Update export functionality to include Zettelkasten IDs (markdown, text, JSON)
- [x] Add tests for ID generation logic (24 comprehensive tests added)
- [x] Add tests for ID uniqueness constraints (verified in test suite)
- [x] Verify UI displays IDs correctly (all 116 tests passing)
- [x] Save checkpoint for Phase 1 completion

## Clavis Aurea Glossary Integration — Featured Component
- [x] Adapt the Clavis Aurea glossary component for the PKM application
- [x] Create a new Glossary.tsx page component
- [x] Integrate glossary navigation into the DashboardLayout sidebar
- [x] Connect glossary to the lexicon module for data synchronization
- [x] Add glossary as a featured module on the home page
- [x] Test glossary functionality and search
- [x] Save checkpoint for glossary integration


## Phase 4: Projects Module (Action Layer)
- [x] Design Projects database schema (title, description, status, startDate, endDate, category, tags)
- [x] Create projects table in drizzle/schema.ts
- [x] Generate and apply database migration
- [x] Implement project CRUD procedures in server/db.ts
- [x] Create tRPC router for projects (create, read, update, delete, list)
- [x] Build Projects.tsx page component with list view
- [x] Create ProjectDetail.tsx for viewing individual projects
- [x] Add project creation form with category selector
- [x] Implement project status tracking (active, completed, archived)
- [x] Add project filtering and sorting UI (in ProjectTaskDashboard)
- [x] Create project-entry linking (projects can reference notebook/lexicon entries via linkedEntries)
- [x] Add tests for project procedures and workflows (all 116 tests passing)
- [x] Integrate projects into navigation and home page

## Phase 5: Tasks Module (Action Layer)
- [x] Design Tasks database schema (title, description, status, dueDate, priority, projectId, linkedEntryId)
- [x] Create tasks table in drizzle/schema.ts
- [x] Generate and apply database migration
- [x] Implement task CRUD procedures in server/db.ts
- [x] Create tRPC router for tasks (create, read, update, delete, list, filter by project)
- [x] Build Tasks.tsx page component with list and kanban views
- [x] Create TaskDetail.tsx for viewing individual tasks
- [x] Add task creation form with project selector and priority levels
- [x] Implement task status tracking (todo, in-progress, completed, blocked)
- [x] Add due date and priority indicators
- [x] Create task-entry linking (tasks can reference notebook/lexicon entries via linkedEntries)
- [x] Implement task filtering by project, status, priority, due date
- [x] Add tests for task procedures and workflows (all 116 tests passing)
- [x] Integrate tasks into navigation and home page
- [x] Create project-task dashboard view (ProjectTaskDashboard.tsx)
- [x] Save checkpoint for Action Layer completion

## Remaining Gaps & Enhancements
- [x] Add explicit project filtering and sorting controls to ProjectTaskDashboard (status filter, progress sort)
- [x] Implement project entry-linking UI in ProjectDetail with selectable notebook/lexicon references
- [x] Implement task entry-linking UI in TaskDetail with selectable notebook/lexicon references
- [x] Phase 2: Enhance linking semantics with directional symbols (→, ←, ↔)
- [x] Phase 3: Implement Goals module (Action Layer)
- [x] Phase 6: Implement Ideas module (Synthesis Layer)


## DIKW-Enhanced Lexicon & Synthesis Module
- [x] Enhance lexicon schema with dikwTier field (wisdom, knowledge, information, data)
- [x] Add partOfSpeech field to lexicon entries (noun, verb, adjective, adverb, phrase)
- [x] Add etymology field for word origins and linguistic history
- [x] Update Lexicon.tsx form with DIKW tier selector
- [x] Add part-of-speech selector to lexicon create form (already existed)
- [x] Add etymology field to lexicon create form (already existed)
- [x] Update lexicon detail view to display DIKW tier and part-of-speech
- [x] Create Synthesis.tsx module for discovering entry connections
- [x] Implement connection discovery algorithm (tags, themes, DIKW relationships)
- [x] Build Theme explorer component for visualizing DIKW relationships
- [x] Create visualization showing entry network and cross-references
- [x] Add filtering by DIKW tier in theme explorer
- [x] Add tests for synthesis and theme explorer functionality (all 116 tests passing)
- [x] Integrate Synthesis and Theme explorer into navigation
- [x] Save checkpoint for DIKW enhancement completion


## Bug Fix: Export Page Database Query Errors
- [x] Fix database query errors on export page (/export)
  - [x] Added error handling to display database connection errors gracefully
  - [x] Added loading and error states to export button
  - [x] Export page now shows helpful error messages when queries fail

## Bulk Import Feature Implementation - COMPLETE ✓
- [x] Design bulk import backend procedures for:
  - [x] Notebook entries (quotes, passages, notes)
  - [x] Lexicon entries (vocabulary terms, definitions)
- [x] Implement CSV import with column mapping
- [x] Implement JSON import with validation
- [x] Implement plain text import (one entry per line)
- [x] Build bulk import UI with:
  - [x] File upload (drag-and-drop support)
  - [x] Format selection (JSON, CSV, Plain Text)
  - [x] Preview before import
  - [x] Skip invalid entries (don't fail entire import)
  - [x] Progress indicator
  - [x] Import options (auto-categorization, skip header)
- [x] Implement automatic content-based categorization for imported entries
  - [x] Keyword-based categorization for notebook (quotes, observations, insights)
  - [x] Keyword-based categorization for lexicon (terms, etymology, concordance)
- [x] Auto-generate Zettelkasten IDs for all imported entries
- [x] Support bulk tagging of imported entries (via CSV/JSON metadata)
- [x] Add comprehensive tests for bulk import workflows
  - [x] 36 unit tests for parsing and categorization
  - [x] 25 integration tests for workflows and validation
  - [x] 177 total tests passing
- [x] Integrate bulk import into navigation
- [x] Wire BulkImport UI to new backend procedures
- [x] Save checkpoint for bulk import completion


## Duplicate Detection System for Bulk Import
- [x] Implement similarity detection algorithms (Levenshtein distance, fuzzy matching)
- [x] Create duplicate detection engine for notebook entries
- [x] Create duplicate detection engine for lexicon entries
- [x] Implement merge strategies for combining duplicates
- [x] Add duplicate detection to bulk import procedures
- [x] Build conflict resolution UI showing detected duplicates
- [x] Add user controls for merge/skip/replace actions
- [x] Write tests for similarity algorithms (36+ tests)
- [x] Write tests for duplicate detection workflows
- [x] Write tests for merge strategies
- [x] Save checkpoint for duplicate detection completion


## Duplicate Detection System — Bulk Import Enhancement
- [x] Implement similarity detection algorithms
  - [x] Levenshtein distance for character-level similarity
  - [x] Jaro-Winkler for phonetic similarity
  - [x] Word overlap for semantic similarity
  - [x] Combined scoring with weighted metrics
- [x] Create merge strategies for combining duplicate entries
  - [x] Merge fields strategy (combine non-empty fields)
  - [x] Skip strategy (keep existing, discard incoming)
  - [x] Replace strategy (replace existing with incoming)
- [x] Add duplicate detection to bulk import procedures
  - [x] bulkImportNotebookWithDuplicateDetection function
  - [x] bulkImportLexiconWithDuplicateDetection function
  - [x] CSV/JSON/Text import with duplicate handling
  - [x] Automatic duplicate reporting in import results
- [x] Build conflict resolution UI
  - [x] DuplicateConflictResolver component
  - [x] Similarity score display with color coding (exact/very similar/similar/possible)
  - [x] Individual resolution controls (skip/merge/replace)
  - [x] Bulk action buttons (skip all/merge all)
  - [x] Detail dialog for reviewing duplicate pairs
  - [x] Progress bar for similarity visualization
- [x] Add tRPC routes for duplicate detection
  - [x] bulkImport.notebookWithDuplicateDetection mutation
  - [x] bulkImport.lexiconWithDuplicateDetection mutation
  - [x] bulkImport.detectNotebookDuplicates query
  - [x] bulkImport.detectLexiconDuplicates query
- [x] Comprehensive tests
  - [x] 54 unit tests for similarity algorithms and edge cases
  - [x] 10 UI component tests for conflict resolver
  - [x] 231 total tests passing (no regressions)
- [x] Save checkpoint for duplicate detection feature

## Bulk Import Debugging — Alternative Migration Path
- [x] Investigate non-UI method to apply pending schema changes for bulk import
- [x] Apply pending schema changes without Management UI SQL runner
- [x] Verify notebook, lexicon, and bulk import queries succeed after schema update
- [x] Mark duplicate detection and bulk import flow revalidated after fix
  - [x] Applied pending Drizzle SQL directly through a scripted mysql2 migration runner
  - [x] Added missing notebook_entries.zettelkasten_id column and unique constraint
  - [x] Added missing lexicon_entries.dikw_tier column
  - [x] Created missing projects and tasks tables
  - [x] Verified previously failing notebook.list and lexicon.list queries now execute successfully
  - [x] Re-ran full test suite: 231 tests passing


## Bulk Import Verification After Schema Repair
- [x] Review the current bulk import execution path and test inputs for retry
- [x] Retry notebook and lexicon bulk import against the repaired database schema
- [x] Validate logs and database results to confirm the previous failures are resolved
  - [x] Live retry succeeded for notebook import: 1 successful, 0 failed
  - [x] Live retry succeeded for lexicon import: 1 successful, 0 failed
  - [x] Verification rows were cleaned up after the test
  - [x] No new import-related runtime errors appeared in recent server logs
- [x] Report bulk import verification outcome to user

## Bulk Import Live Failure Investigation
- [x] Reproduce the current live bulk import failure from the actual page workflow
- [x] Capture the exact UI, network, and server-side error for the failing import attempt
- [x] Identify the confirmed root cause in the real user-facing path
  - [x] The BulkImport page was not using the real JSON normalization helpers for the uploaded Quotes and Clavis Aurea file shapes
  - [x] Wrapped lexicon payloads with `meta` + `entries` were being treated like a single object instead of an entry list
  - [x] Notebook quote exports with `authors` and nested `source` metadata were not being normalized before import
  - [x] CSV imports still depended on a missing/empty column mapping UI state
- [x] Implement the minimal fix for the confirmed cause
  - [x] Wired BulkImport.tsx to normalize notebook and lexicon JSON payloads before mutation
  - [x] Added automatic file-format detection when a file is dropped or selected
  - [x] Added automatic CSV header-to-field mapping inference for common notebook and lexicon headers
- [x] Re-test the live bulk import workflow end to end after the fix
  - [x] Real uploaded Quotes source file imported successfully in verification run
  - [x] Real uploaded Clavis Aurea source file imported successfully in verification run
  - [x] Verification rows cleaned up after the test run
  - [x] Full test suite passing: 234 tests
- [x] Save a checkpoint for the repaired bulk import workflow

## Bulk Import Pre-Import Summary and Validation Report
- [x] Define the pre-import summary contents and validation report structure for quotes, lexicon, and text imports
- [x] Add shared analysis helpers to compute entry counts, detected format details, required-field validation, warnings, and sample previews before import
- [x] Add backend or shared support for duplicate counts and validation status prior to submission
- [x] Update the Bulk Import page to show a pre-import summary panel before the user confirms import
- [x] Add a validation report section with counts for valid entries, invalid entries, warnings, detected duplicates, and inferred mappings
- [x] Add regression tests for pre-import summary generation and validation reporting
- [x] Re-test the live bulk import flow end to end with the new pre-import summary experience
  - [x] Live Quotes preflight review displayed 1777 valid entries, 0 invalid entries, 6 duplicate groups, and sample previews
  - [x] Live Clavis Aurea preflight review displayed 354 valid entries, 0 invalid entries, and 0 duplicate groups
  - [x] Full test suite passing: 237 tests
- [x] Save a checkpoint for the enhanced bulk import workflow

## Duplicate Review Integration Follow-up
- [x] Add batch duplicate-detection queries for notebook and lexicon imports
- [x] Integrate DuplicateConflictResolver into the real Bulk Import JSON workflow
- [x] Wire skip, merge, and replace decisions into the actual import mutations
- [x] Re-run the full test suite after duplicate-review integration
  - [x] 237 tests passing

## Directional Linking Semantics Verification
- [x] Add UI or integration tests covering relationship selection and directional-symbol rendering in the document-linking workflow
- [x] Verify the live workflow end to end for forward, backward, and bidirectional relationship types
- [x] Audit any remaining semantic-link surfaces and backlink views for consistent directional formatting
  - [x] Documents creation and semantic-link summary use the shared directional formatter
  - [x] Notebook detail semantic-link cards use the shared directional formatter
  - [x] Lexicon detail semantic-link cards use the shared directional formatter


## Bulk Import Live End-to-End Verification
- [x] Prepare safe temporary import fixtures for live testing
- [x] Run a real bulk import submission through the current workflow
- [x] Verify pre-import summary, duplicate review, and final success behavior
- [x] Clean up temporary verification records created during testing
- [x] Inspect logs for any remaining import-related runtime errors
- [x] Report the final bulk import verification result to the user
- [x] Use clearly named temporary bulk-import records with a verification prefix so they can be identified and removed safely after the live test
Identify which request or route returns the unexpected HTML payload
  - [x] Confirmed `bulkImport.detectLexiconDuplicateBatch` was being sent as a large GET request
  - [x] Confirmed the request returned HTTP 414 with `text/html`, which produced the `Unexpected token '<'` parse error
- [x] Fix the client/server mismatch causing the invalid JSON parse
  - [x] Converted duplicate-batch preflight endpoints from tRPC queries to mutations so they submit via POST
  - [x] Updated BulkImport.tsx to use mutation-based duplicate preflight calls instead of GET fetches
- [x] Re-verify live bulk import submission after the fix
  - [x] Full test suite passing: 244 tests

## Navigation Fix — Johnny Decimal Taxonomy Menu
- [x] Inspect the static Johnny Decimal Taxonomy navigation that is covering the main site menu
- [x] Update the taxonomy menu so it is compact by default or integrated into the main site navigation
  - [x] Reworked the taxonomy panel into a compact collapsed-by-default sidebar module
  - [x] Kept the full Johnny Decimal outline available on demand through expandable area groups
- [x] Verify the revised navigation layout in the live app
  - [x] Sidebar no longer has the large static taxonomy block covering the main menu
  - [x] App health clean with no TypeScript or LSP errors
  - [x] Regression suite passing: 244 tests
- [x] Save a checkpoint for the navigation fix

## Phase 1 — Make the app feel alive
- [x] Fix the app theme so the interface defaults to the intended dark-first palette
- [x] Replace hardcoded Home dashboard quick stats with live data queries
- [x] Connect the Taxonomy sidebar to real taxonomy areas, categories, and entry counts from the database
- [x] Remove or gate ComponentShowcase from production routes
- [x] Verify the updated Phase 1 experience in the live app and test suite
- [x] Save a checkpoint for the Phase 1 operational fixes

## Follow-up Enhancement — Phase 1 Make It Feel Alive
- [x] Default the application theme to dark in App.tsx
- [x] Replace hardcoded home dashboard stats with live tRPC-backed counts
- [x] Replace the static Johnny Decimal sidebar data with the live taxonomy tree and real category totals
- [x] Verify the production router no longer exposes ComponentShowcase
- [x] Expand Vitest coverage to include client component tests and add a taxonomy sidebar regression test
- [x] Run the full test suite and confirm all Phase 1 validations pass
- [x] Verify the live preview reflects the dark editorial workspace and live dashboard/sidebar data

## Phase 2 — Writing Studio and Knowledge Model Expansion
- [x] Audit the current Documents page, AIChatBox component, and backend procedures to define the first implementation slice
- [x] Upgrade the Writing Studio linked references panel to surface richer linked-entry context and navigation
- [x] Integrate AIChatBox into the Writing Studio as a Research Assistant backed by a server-side tRPC workflow
- [x] Add automated tests for the new Writing Studio and research-assistant behavior
- [x] Document the relational collections migration path for notebook and related entry types
- [x] Document the DIKW tier expansion path across notebook, documents, projects, and tasks
- [x] Verify the full Phase 2 slice in the live app and save a checkpoint

## Phase 2 — DIKW Metadata Expansion Slice
- [x] Add DIKW tier support to notebook entries at the schema and backend layers
- [x] Add DIKW tier support to documents at the schema and backend layers
- [x] Surface DIKW selection and display in the notebook and document editing experiences
- [x] Add regression tests for the new DIKW metadata flow
- [x] Verify the DIKW slice in the live app and save a checkpoint

## Phase 3 — Goals Module (Action Layer)
- [x] Audit the current action-layer routes, dashboard surfaces, and shared patterns for Goals integration
- [x] Add Goals schema and backend CRUD support
- [x] Build the Goals page and integrate it into navigation and dashboard surfaces
- [x] Add regression coverage for the Goals module workflows
- [x] Verify the Goals slice in the live app and save a checkpoint

## Goals Module Refinement
- [x] Add full edit UX for existing goals, including title, description, status, horizon, target date, tags, and linked project updates
- [x] Add user-visible loading and error feedback for Goals create, update, and delete mutations
- [x] Add regression coverage for editing an existing goal and for visible failure-state behavior
- [x] Use clearly named temporary bulk-import records with a verification prefix so they can be identified and removed safely after the live test

## Phase 6 — Ideas Module (Synthesis Layer)
- [x] Audit the current synthesis-layer routes, dashboard surfaces, and shared patterns for Ideas integration
- [x] Add Ideas schema and backend CRUD support
- [x] Build the Ideas page and integrate it into navigation and dashboard surfaces
- [x] Add regression coverage for the Ideas module workflows
- [x] Verify the Ideas slice in the live app and save a checkpoint


## Ideas Lab Cross-Link Picker Enhancement
- [x] Audit the current Ideas linked-entry workflow and any reusable entry-selection patterns
- [x] Replace raw linked-entry JSON editing in Ideas Lab with guided notebook, lexicon, and document pickers
- [x] Preserve existing linked-entry persistence format while showing selected references clearly in the UI
- [x] Add regression coverage for guided Ideas cross-link selection and save behavior
- [x] Verify the new Ideas linking workflow in the live app and save a checkpoint

## Devanomy Branding Refresh
- [x] Review the provided logo asset and uploaded dashboard reference to align the redesign direction
- [x] Update the app branding assets and shared theme tokens to match the new Devanomy visual identity
- [x] Restyle the dashboard and key workspace surfaces to reflect the provided art direction
- [x] Integrate the provided logo into the primary UI branding surfaces
- [x] Add or update regression coverage for the branding refresh where appropriate
- [x] Verify the refreshed branded experience in the live app and save a checkpoint

## Ideas Lab Cross-Link Pickers
- [x] Review the current Ideas Lab editor and existing linked-record patterns before replacing raw JSON entry editing
- [x] Replace raw linked-entry JSON editing with guided notebook, lexicon, and document pickers while preserving the stored JSON structure
- [x] Update the Ideas Lab regression coverage to exercise the new guided linked-record workflow
- [x] Verify the Ideas Lab cross-link picker experience in the live app and save a checkpoint

## Visual Editor Sync — Home and Dashboard Shell
- [x] Review the applied visual-editor changes in Home.tsx and DashboardLayout.tsx against the requested UI adjustments
- [x] Verify the updated branded UI compiles and the app health remains stable after the visual edits
- [x] Save a checkpoint for the verified visual-editor changes

## Sidebar Brand Palette Normalization
- [x] Review the current sidebar accent colors against the established Devanomy brand palette
- [x] Normalize sidebar navigation, utility, and profile accent colors to the finalized brand system
- [x] Verify the refined sidebar visually in the live app and save a checkpoint

## PKM Integration Roadmap Plan
- [x] Review the provided six-phase roadmap and convert it into an implementation-ready plan document
- [x] Save the structured implementation plan under docs/plans with execution guidance and handoff options

## Johnny Decimal Taxonomy Outline Schema Update
- [x] Review the uploaded Master Classification Key PDF against the current Johnny Decimal taxonomy outline implementation
- [x] Update the taxonomy outline schema and mapped data structures to reflect the Master Classification Key
- [x] Verify the updated taxonomy schema in tests and live project health, then save a checkpoint

## Taxonomy-Aware Import Suggestions
- [x] Review the current notebook and lexicon import flows to identify where category suggestions should appear before save
- [x] Implement taxonomy-aware category suggestion logic and pre-save suggestion UI for imports
- [x] Verify import category suggestions in tests and live project health, then save a checkpoint


## Rolled-Back Version Stability Verification
- [x] Run the automated test suite against the rolled-back version 38e07c0b
- [x] Review failures and assess whether core functionality is stable
- [x] Report verification findings to the user


## Commonplace Kanban Editor
- [x] Implement database schema for `commonplace_entries` and `kanban_columns`
- [x] Create backend tRPC procedures for CRUD operations on `commonplace_entries` and `kanban_columns`
- [x] Develop the Kanban board UI with drag-and-drop functionality
- [x] Implement specialized card editors for each content type (Research Notes, Bookmarks, Ideas, Quotes, Books, Articles, Glossary Terms, Lists)
- [x] Integrate the color taxonomy system using CSS variables/Tailwind custom properties
- [x] Apply color taxonomy consistently across the site (sidebar, filters, search, exports)
- [x] Update main navigation to point to the new Commonplace module
- [x] Replace legacy Notebook and Library pages with the new Commonplace editor
- [x] Write comprehensive tests for backend procedures and UI components
- [x] Verify the Kanban editor and color taxonomy in live app
- [x] Save checkpoint and deliver the Commonplace Kanban editor

## Commonplace Feature Flag Rollout
- [x] Design a feature flag strategy for gating the Commonplace workspace and its navigation entry points
- [x] Implement shared feature-flag configuration and runtime helpers for Commonplace
- [x] Gate Commonplace routes, sidebar links, and page fallbacks behind the new feature flag
- [x] Add tests covering enabled and disabled Commonplace states
- [x] Verify flagged behavior in project health checks and save a checkpoint

## Deployment Healthcheck Failure Investigation
- [x] Reproduce the healthcheck failure path locally and collect runtime evidence from server startup and the health endpoint
- [x] Compare the failing healthcheck path against the working local/dev runtime configuration to isolate the root cause
- [x] Implement the minimal fix for the deployment startup failure and verify the health endpoint responds successfully
- [x] Refresh project health, save a checkpoint, and report deployment readiness

## Deduplication Tool
- [x] Add a deduplication tool for duplicate knowledge records with configurable matching and review workflow
- [x] Define the deduplication scope, duplicate criteria, and merge or delete behavior with the user before implementation
- [x] Implement the deduplication backend and UI flow in the appropriate Devanomy workspace
- [x] Add Vitest coverage for duplicate detection and resolution behavior
- [x] Extend the deduplication tool to scan across Commonplace, Lexicon, Books, notes, projects, goals, tasks, and ideas together
- [x] Define the cross-module duplicate rules, confidence thresholds, and suggested canonical-record logic
- [x] Decide whether duplicate groups support review-only, merge, delete, or archive actions before implementation
- [x] Restrict true merge actions to same-module duplicates and handle cross-module matches through canonical keep plus archive or delete review actions
- [x] Reapply the lost inline-editing/Commonplace test-fix changes after the environment reset and save them properly on main

## Desktop UI/UX Reorganization & 6-Category Commonplace Setup
- [x] Update default Commonplace columns to the 6 canonical categories in server/db.ts
- [x] Update DashboardLayout.tsx sidebar navigation to include Atlas and align core modules
- [x] Update Home.tsx dashboard cards and sections to mirror the desktop structure
- [x] Verify build, TypeScript compilation, and save checkpoint
- [x] Resolve React duplicate key warning in sidebar navigation (Atlas and Knowledge Base sharing `/search`)

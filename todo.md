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
- [ ] Phase 2: Enhance linking semantics with directional symbols (→, ←, ↔)
- [ ] Phase 3: Implement Goals module (Action Layer)
- [ ] Phase 4: Implement Projects module (Action Layer)
- [ ] Phase 5: Implement Tasks module (Action Layer)
- [ ] Phase 6: Implement Ideas module (Synthesis Layer)


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
- [ ] Add explicit project filtering and sorting controls to ProjectTaskDashboard (status filter, progress sort)
- [ ] Implement project entry-linking UI in ProjectDetail with selectable notebook/lexicon references
- [ ] Implement task entry-linking UI in TaskDetail with selectable notebook/lexicon references
- [ ] Phase 2: Enhance linking semantics with directional symbols (→, ←, ↔)
- [ ] Phase 3: Implement Goals module (Action Layer)
- [ ] Phase 6: Implement Ideas module (Synthesis Layer)


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

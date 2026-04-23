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
- [ ] Phase 1: Implement Zettelkasten ID system (AC.ID-YYYYMMDD-Seq format)
- [ ] Phase 2: Enhance linking semantics with directional symbols (→, ←, ↔)
- [ ] Phase 3: Implement Goals module (Action Layer)
- [ ] Phase 4: Implement Projects module (Action Layer)
- [ ] Phase 5: Implement Tasks module (Action Layer)
- [ ] Phase 6: Implement Ideas module (Synthesis Layer)


## Phase 1: Zettelkasten ID System Implementation
- [ ] Add zettelkastenId field to notebookEntries table schema
- [ ] Add zettelkastenId field to lexiconEntries table schema
- [ ] Generate and apply database migration SQL
- [ ] Implement ID generation procedure (AC.ID-YYYYMMDD-Seq format)
- [ ] Create tRPC procedure to generate Zettelkasten ID for new entries
- [ ] Update notebook create form to display generated ID
- [ ] Update lexicon create form to display generated ID
- [ ] Update notebook detail view to show Zettelkasten ID
- [ ] Update lexicon detail view to show Zettelkasten ID
- [ ] Add copy-to-clipboard functionality for IDs
- [ ] Update export functionality to include Zettelkasten IDs
- [ ] Add tests for ID generation logic
- [ ] Add tests for ID uniqueness constraints
- [ ] Verify UI displays IDs correctly
- [ ] Save checkpoint for Phase 1 completion

## Clavis Aurea Glossary Integration — Featured Component
- [x] Adapt the Clavis Aurea glossary component for the PKM application
- [x] Create a new Glossary.tsx page component
- [x] Integrate glossary navigation into the DashboardLayout sidebar
- [x] Connect glossary to the lexicon module for data synchronization
- [x] Add glossary as a featured module on the home page
- [x] Test glossary functionality and search
- [x] Save checkpoint for glossary integration

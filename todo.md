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
- [ ] Save a checkpoint for the quote categorization enhancement

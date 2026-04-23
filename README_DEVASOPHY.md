# Devanomy PKM — Scholarly Personal Knowledge Management System

A sophisticated, dark-themed personal knowledge management application designed for capturing, organizing, and connecting intellectual work across three integrated modules.

## Overview

Devanomy is a comprehensive knowledge management system built for scholars, researchers, and intellectuals who need to organize quotes, vocabulary, and writing in a unified, interconnected workspace. The application features a dark scholarly aesthetic inspired by antiquarian design, with deep navy and charcoal backgrounds, warm gold accents, and serif typography.

## Core Modules

### 1. Commonplace Notebook
Capture and organize quotes, passages, and observations with full source metadata.

**Features:**
- Create entries with rich text support
- Track source metadata: author, work, source type, location, date
- Tag entries for organization and discovery
- Add personal notes and annotations
- Full CRUD operations
- Detail view with linked references
- Bulk import from JSON (Quotes format)

**Database Schema:**
- `notebookEntries` table with user isolation
- Indexed search on text, author, work, tags
- Timestamp tracking for creation and updates

### 2. Clavis Aurea (Personal Lexicon & Concordance)
Build a comprehensive personal dictionary with etymological and linguistic information.

**Features:**
- Alphabetical term browsing and indexing
- Search by term, part of speech, source type, or date added
- Full entry details: definition, etymology, origin, notes
- Create, edit, and delete terms
- Detail view with linked references
- Bulk import from JSON (Clavis Aurea format with 354+ entries)
- Sortable term list

**Database Schema:**
- `lexiconTerms` table with comprehensive linguistic fields
- Indexed search on term, part of speech, etymology
- User-scoped data with timestamp tracking

### 3. Research & Writing Studio
Markdown-based document editor with project organization and linked references.

**Features:**
- Create and organize documents by project and folder
- Markdown editor with live preview capability
- Document status tracking (draft, in_progress, completed, archived)
- Linked references panel for pulling notebook entries and lexicon terms
- Full CRUD operations
- Document organization hierarchy

**Database Schema:**
- `documents` table with project/folder organization
- Status enum for workflow tracking
- Markdown content storage with metadata

## Cross-Module Features

### Semantic Linking
Create bi-directional connections between entries across all three modules.

**Capabilities:**
- Link notebook entries to lexicon terms
- Link documents to both notebooks and lexicon
- Multiple link types: references, related, inspired_by, defines
- Automatic reverse-link tracking
- Linked references panel in all detail views

**Database Schema:**
- `semanticLinks` table with source/target type and ID
- Link type classification
- User isolation for privacy

### Unified Search
Search across all three modules simultaneously with filtering options.

**Features:**
- Full-text search across all modules
- Filter by module type (notebook, lexicon, documents)
- Filter by tags and date range
- Combined results view with module indicators
- Relevance-based result ordering

### Johnny Decimal Taxonomy Sidebar
Navigate your knowledge base using a hierarchical classification system.

**Structure:**
- **10-19: Knowledge Capture** (Quotes, Observations, Insights)
- **20-29: Vocabulary & Language** (Terms, Etymology, Concordance)
- **30-39: Writing & Research** (Projects, Drafts, Published)
- **40-49: Cross-Module Linking** (References, Connections, Backlinks)

**Features:**
- Collapsible area navigation
- Category browsing within each area
- Entry count badges per category
- Direct navigation to filtered module views

## Import & Export

### Bulk Import
Import large datasets to quickly populate your knowledge base.

**Supported Formats:**
- **Quotes JSON**: Import notebook entries from external quote collections
- **Clavis Aurea JSON**: Import vocabulary terms with full etymological data
- Field mapping and validation
- Duplicate detection and handling
- Batch error reporting

### Export
Export your knowledge base in multiple formats for sharing, backup, or external processing.

**Export Formats:**
- **JSON**: Structured data with all metadata (ideal for re-import or processing)
- **Markdown**: Human-readable formatted text with metadata
- **Plain Text**: Simple text format for universal compatibility

**Export Options:**
- Export entire module collections
- Timestamped filenames for organization
- Preserves all metadata and relationships

## Design System

### Color Palette
- **Background**: Deep navy (#0a0e27) and charcoal (#1a1f3a)
- **Accent**: Warm gold (#d97706) and parchment (#f5e6d3)
- **Text**: Light cream (#f3f4f6) on dark backgrounds
- **Borders**: Subtle gray (#374151) for definition

### Typography
- **Headings**: Playfair Display (serif) for scholarly elegance
- **Body**: Inter (sans-serif) for readability
- **Monospace**: Monaco for code and technical content

### Components
- Consistent card-based layouts with subtle borders
- Smooth transitions and hover states
- Responsive design for desktop and tablet
- Dark mode optimized for extended reading

## Technical Architecture

### Frontend
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 with custom theme
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query with tRPC integration
- **UI Components**: shadcn/ui for consistent design system

### Backend
- **Runtime**: Node.js with Express 4
- **API**: tRPC 11 for end-to-end type safety
- **Database**: MySQL with Drizzle ORM
- **Authentication**: Manus OAuth integration
- **File Storage**: S3 for media and exports

### Database Schema
- `users`: User accounts and authentication
- `notebookEntries`: Quotes and observations
- `lexiconTerms`: Vocabulary and definitions
- `documents`: Writing and research documents
- `semanticLinks`: Cross-module relationships
- `tags`: Categorization system
- `taxonomy`: Johnny Decimal classification

## Testing

### Test Coverage
- **42 passing tests** across all modules
- **Unit tests**: Core data validation and transformation
- **Integration tests**: Cross-module workflows and data consistency
- **Workflow tests**: Import/export and linking operations

### Test Files
- `server/pkm.test.ts`: Core PKM functionality (18 tests)
- `server/integration.test.ts`: Cross-module workflows (23 tests)
- `server/auth.logout.test.ts`: Authentication (1 test)

## Getting Started

### Installation
```bash
cd /home/ubuntu/devasophy-pkm
pnpm install
```

### Development
```bash
pnpm dev
# Server runs on http://localhost:3000
```

### Testing
```bash
pnpm test
```

### Building
```bash
pnpm build
pnpm start
```

## Usage Workflows

### Creating a Notebook Entry
1. Navigate to Commonplace Notebook
2. Click "New Entry"
3. Enter quote/passage text
4. Add source metadata (author, work, location)
5. Tag for organization
6. Save entry
7. View linked references in detail view

### Building Your Lexicon
1. Navigate to Clavis Aurea
2. Click "New Term"
3. Enter term and part of speech
4. Add definition, etymology, and origin
5. Include notes for context
6. Save term
7. Browse alphabetically or search

### Writing with References
1. Navigate to Research Studio
2. Create new document with project/folder
3. Write in Markdown
4. Use linked references panel to pull notebook entries and lexicon terms
5. Track document status
6. Save and organize

### Creating Cross-Module Links
1. Open any entry detail view
2. In linked references section, click "Add Link"
3. Select target module and entry
4. Choose link type (references, related, inspired_by, defines)
5. Save link
6. Link appears in both entry detail views

### Bulk Importing Data
1. Navigate to Bulk Import
2. Select import type (Quotes or Clavis Aurea)
3. Upload JSON file
4. Review validation results
5. Confirm import
6. Entries appear in respective modules

### Exporting Your Knowledge
1. Navigate to Export
2. Select module to export
3. Choose format (JSON, Markdown, or Text)
4. Click "Export Now"
5. File downloads with timestamp

## Performance Considerations

- Lazy-loaded module views for faster initial load
- Indexed database queries for search performance
- Memoized React components to prevent unnecessary re-renders
- Efficient pagination for large datasets
- Optimized CSS with Tailwind's JIT compiler

## Accessibility

- Dark mode optimized for reduced eye strain
- High contrast text for readability
- Keyboard navigation throughout
- Semantic HTML structure
- Focus indicators for keyboard users
- ARIA labels where appropriate

## Security

- User authentication via Manus OAuth
- User-scoped data isolation
- SQL injection prevention via Drizzle ORM
- CSRF protection via secure session cookies
- No sensitive data in client-side code

## Future Enhancements

- AI-powered semantic linking suggestions
- Advanced analytics and knowledge graph visualization
- Collaborative features for team knowledge management
- Mobile app for on-the-go entry capture
- Integration with external research tools
- Custom taxonomy templates
- Advanced filtering and saved searches
- Entry versioning and history
- Markdown preview in editor
- Rich text editor alternative to Markdown

## Support & Documentation

For issues, questions, or feature requests, refer to the inline code documentation and test files for implementation details.

## License

This application is proprietary software created for personal knowledge management.

---

**Version**: 2.0  
**Last Updated**: April 10, 2026  
**Status**: Production Ready

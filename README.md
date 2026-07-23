# Devasophy PKM

A philosopher's atelier ecosystem for personal knowledge management.

## Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + Drizzle ORM + MySQL
- **Auth**: JWT with bcrypt password hashing (jose library)
- **API Style**: REST (JSON over HTTP)

## Modules

1. **Commonplace Library** — Notes, quotes, bookmarks, ideas, book references
2. **Research & Essay** — Long-form documents with status tracking
3. **Ideas Lab** — Standalone idea capture cards
4. **Planning Workspace** — Planned documents with checkboxes
5. **Knowledge Repository** — Lexicon/glossary with spaced repetition
6. **Synthesis Engine** — Cross-module pattern clustering

## Pages

- Dashboard — Live stats, DIKW distribution, recent work
- Library — Artifact index table with type filters
- Commonplace — Split-screen notebook editor with full CRUD
- Quotations — Citation cards with large serif display
- Vocabulary — Alpha index + dictionary detail view
- Books — Library card grid
- Research — Document list with status tracking
- Ideas — Idea capture cards
- Plans — Todo-style plans with checkboxes
- Synthesis — Cross-module pattern clustering by tags
- Atlas — Force-directed canvas graph
- Exports — Markdown and JSON download
- Settings — Account, data, appearance, about

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run check` | Type-check all TypeScript |
| `npm run db:push` | Sync schema to database |

## Database Schema

12 content tables: users, jd_areas, jd_categories, commonplace_entries, quotations, lexicon_entries, sr_cards, research_documents, entry_links, activity_log.

---

*Devasophy — evolved from Devanomy*

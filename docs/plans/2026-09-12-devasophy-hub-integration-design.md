# Devasophy PKM Hub Integration Design

## Objective

Integrate the strongest visual and system concepts from the Devasophy PKM Hub reference into the existing Devanomy application as one coordinated release. The integration must preserve Devanomy’s mature data model, authenticated workflows, routes, feature flags, AI insight tools, multi-record synthesis, Johnny Decimal taxonomy, and content-type color semantics.

## Information Architecture

The authenticated shell remains the application frame. Navigation is reorganized into three readable groups: **Atelier** for Dashboard, Atlas, Writing Studio, and Ideas; **Collections** for Library, Commonplace, Clavis Aurea, and Lexicon; and **Operations** for Goals, Import, Export, and Deduplication. The live Johnny Decimal outline remains available as the underlying formal taxonomy.

The dashboard becomes a three-zone atelier command center:

1. **Territory and status:** live collection totals, operational status, search, and recent activity.
2. **Atelier:** editorial welcome, daily intention, primary capture/search actions, and an abstract Devasophy geometric composition.
3. **Operational intelligence:** recent work, relational atlas preview, and export/share shortcuts.

## Six Knowledge Regions

The six regions are a conceptual overlay, not a replacement taxonomy. Each card links to existing routes and displays live activity derived from mapped modules.

| Region | Role | Existing Devanomy surfaces |
|---|---|---|
| Foundations | Principles, definitions, and conceptual roots | Clavis Aurea, Lexicon, Glossary |
| Practice | Active composition and deliberate work | Writing Studio, Goals |
| Memory | Durable processed knowledge | Library, Commonplace |
| Relations | Connections, taxonomy, and synthesis | Atlas, unified search, synthesis tools |
| Flux | Captures, drafts, and developing ideas | Ideas, Commonplace notes |
| Sources | External references and reading anchors | Books, articles, bookmarks, quotations |

## Live Dashboard Surfaces

**Classification Key** uses the established global content-type tokens and displays all eight content types. **Accumulation Atlas** derives a seven-month series from existing `createdAt` timestamps across eligible collections; it must show an explanatory empty state if no dated records are available. **Recent Work** merges recent records across modules and links to the corresponding workspace. **Node Atlas** offers a compact visual preview of cross-module relationships and links into Atlas/Search. **Quick Synthesis** routes to capture, refine, map, review, search, archive, export, and sharing workflows without duplicating underlying logic. **Export & Share** summarizes the existing JSON, Markdown, plain-text, and relational pathways and routes into the current export experience.

## Visual System

The existing cream grid-paper background, navy frame, editorial serif typography, content taxonomy, and patterned geometric vocabulary remain. The integration introduces a stricter atelier grid, compact black-ink borders, numbered region labels, small uppercase captions, geometric relationship diagrams, and restrained primary accents. The existing Devanomy logo remains the identity anchor; the Devasophy reference informs composition and information hierarchy rather than replacing the brand.

## Responsive and Accessibility Behavior

Desktop uses the full three-zone composition. Tablet collapses operational intelligence below the Atelier. Mobile presents live metrics, Atelier, regions, recent work, atlas, and export actions in that order. All buttons remain keyboard reachable, focus-visible, and labeled. Motion is limited to short hover elevation and staged reveal effects, with complete `prefers-reduced-motion` overrides. Loading, error, and empty states remain visible and actionable.

## Validation

The release requires focused unit and page regression tests, the complete Vitest suite, TypeScript validation, production build and route-bundle guard, desktop and mobile screenshots, accessibility-focused interaction review, runtime-log inspection, and a clean project-health check before checkpointing.

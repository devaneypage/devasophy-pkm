# Library UX Audit — 2026-08-30

**Scope:** Devasophy Library at `https://devasophy-pkm.manus.space/library`

## Observed Experience

The deployed Library presents the **Artifact Index** as a compact, editorial table within Devasophy’s philosopher’s-atelier identity. It exposes a global sidebar, command-search affordance, an explicit `New Artifact` action, a local search field, a starred filter, content-type chips, type counts, and six table columns: artifact, type, region, source, and updated date. The current visual language combines paper-like backgrounds, a gridded field, serif display typography, strong ink borders, and color-coded taxonomy marks.

## Strengths to Preserve

The route already communicates its purpose through a memorable **Artifact Index** framing rather than a generic file manager. The Master Classification Key is reflected in the type filters and color coding. The sidebar maintains a usable mental model of the broader knowledge workspace, while title, type, region, source, and recency form an appropriate minimal metadata set for library scanning.

## Frictions and Design Opportunities

The primary controls form a visually dense top strip that competes with the page heading. The type counts are informative but not clearly actionable, and the table is optimised for a large landscape viewport rather than progressive disclosure or narrow screens. The loading state leaves a substantial blank field without preserving an information scent or clear table structure. Search, type, starred, and region-oriented retrieval are not presented as a coherent query model. The adjacent Library and Commonplace concepts are also ambiguous in the current project routing, where `/library` maps to the Commonplace page.

## Recommended Direction: The Reading Room Index

Rebuild `/library` as a dedicated **Reading Room Index**: an editorial research desk with a quiet metadata rail, a generous search field, a clear active-query summary, accessible tabs for curated views, taxonomy chips that also behave as filters, and a responsive card/table hybrid. On wide layouts, the dense tabular view supports comparative scanning; at compact widths, each artifact becomes a self-contained catalogue card. The visual system should reuse the paper, ink, serif, colored-taxonomy, and subtle-grid vocabulary already established in Devanomy, while making hierarchy calmer, filtering more legible, and every primary control discoverable.

## Source Note

The deployed Devasophy page uses an Artifact Index implementation not present in the current attached WebDev source at the time of audit. The attached project currently routes `/library` to `Commonplace`; this overhaul will establish a dedicated Library route in the canonical project while preserving Commonplace at `/commonplace`.

## Final Visual Validation

Authenticated Chromium validation confirmed the dedicated route preserves the intended **Reading Room Index** hierarchy at desktop width: the editorial hero leads with purpose; the query field and type facets are grouped as one retrieval system; the catalogue supports comparative scanning; and the ink-blue reader margin now maintains high-contrast title, summary, metadata, and action text. The Library route is visibly distinguished from the Commonplace drafting workspace in both page language and navigation.

The focused browser check also verified the compact catalogue card treatment at a 390-pixel mobile viewport. Search-empty state, clear-search recovery, taxonomy selection, starred state, and navigation to `/commonplace` completed with no page errors, console errors, or HTTP failures. Screenshot evidence is stored at `docs/verification/library-reading-room-2026-08-30.png`.

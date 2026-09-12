# Library Search and Filter Enhancement Plan

## Purpose

The Library already provides a reading-room catalogue with free-text search, type facets, and session-only stars. This enhancement makes retrieval more explicit and scalable by adding structured filtering for **artifact type**, **working region**, **source**, **date range**, and **starred state**, along with a deterministic sort control and a visible active-filter summary. The work remains client-side because the Library receives its current artefact snapshot from the existing `commonplace.bootstrap` query; no data-model or endpoint change is required.

## Design Decision

Three approaches were considered. A server-side searchable endpoint would be best for very large archives, but would introduce schema and API work not justified by the current snapshot-driven Library. A single opaque search field would be minimal, but would leave categorical retrieval undiscoverable. The selected approach uses composable client-side controls over the already loaded catalogue: it is immediate, reversible, works offline after the query resolves, and preserves the Reading Room’s calm editorial hierarchy.

## Implementation

The retrieval surface will retain the primary search field and type pills. It will add a compact **Refine catalogue** disclosure with region, source, date-range, and sort controls. The selected source and region options derive from the current entries rather than a fixed vocabulary. A source query remains supported through the normal full-text search. Controls reset pagination-independent local state and clear the selected entry when it is excluded. The result summary will identify the applied constraints, expose individual removable filter chips, and offer one reset action.

## Verification

Unit tests will cover combined search and structured filters, sort order, active-filter removal, date windows, and recovery to the unfiltered catalogue. The final checks will run focused and complete Vitest suites, TypeScript validation, production build, route-chunk enforcement, and an authenticated Chromium workflow that exercises filters and confirms no console, page, or HTTP errors.

## Rollback

The change is contained to the Library component, its test suite, visual rules, browser verifier, and session checklist. Reverting those files restores the original search-and-facet interaction without database or API rollback.

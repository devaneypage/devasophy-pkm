# Customizable Dashboard Panel Ordering

## Objective

Enable each authenticated Devanomy user to arrange the command-center panels around their own workflow. The order must follow the user across browsers and devices, remain understandable on mobile and to assistive technology, survive future dashboard additions, and always provide a safe return to the canonical atelier composition.

## Stable panel registry

The dashboard uses nine durable identifiers that are independent of visible copy: `territory_metrics`, `atelier`, `recent_work`, `node_atlas`, `knowledge_regions`, `accumulation_atlas`, `classification_key`, `quick_synthesis`, and `export_hub`. A shared registry defines the canonical order, title, description, and layout span for every panel. Saved layouts are normalized against this registry: duplicates and unknown identifiers are removed, missing identifiers are appended in canonical order, and wholly invalid data falls back to the default.

## Account-level persistence

A user-owned `dashboard_layout_preferences` table stores one record per user with the ordered JSON array, a layout version, and timestamps. Protected tRPC procedures expose read, update, and reset operations. Updates accept only two to nine unique registered identifiers; the server resolves the complete safe order before persistence. Ownership is derived exclusively from the authenticated context.

## Arrange Dashboard mode

An **Arrange dashboard** action enters a focused edit mode. Every panel receives an order number, drag handle, and explicit **Move up** and **Move down** buttons. Pointer dragging and keyboard controls update the same local order model. Reordering saves automatically with an optimistic update, visible Saving/Saved/Error status, and rollback on failure. A polite live region announces movements. **Done** exits edit mode, while **Reset default** requires confirmation and restores the canonical order.

Panels cannot be hidden in this release. This keeps every command-center capability available and avoids an additional visibility-preference model.

## Responsive and accessibility behavior

Saved panel order is the DOM order at every breakpoint. Broad analytical panels retain full-width layouts; compact panels use their existing responsive widths where space permits. Mobile therefore presents the exact saved sequence as a single readable stack. All pointer functionality has an equivalent button control, focus remains visible, announcements identify the moved panel and new position, and reduced-motion preferences suppress reorder animation and hover lift.

## Verification

Automated coverage will verify default normalization, invalid saved layouts, future-panel migration, protected access, user isolation, update/reset persistence, optimistic rollback, pointer and keyboard reordering, accessible announcements, and mobile DOM order. Final checks include the complete Vitest suite, TypeScript, production build, route-bundle guard, desktop/mobile screenshots, and runtime-log inspection.

## Visual verification findings

The default-mode desktop render places the arrangement controls in a compact command-center header above the live metric strip without weakening the established atelier hierarchy. The control reads as a workspace preference rather than a primary content action, and the remainder of the dashboard retains its existing card proportions, classification signals, live charts, and route affordances.

At mobile width, the arrangement header stacks before the content sequence, the action remains reachable without horizontal overflow, and all nine panels retain a coherent single-column reading order. The visual review confirmed that the configurable wrapper does not introduce spacing gaps or clipped content at either breakpoint. Edit-mode behavior is covered separately through focused component interaction tests because the preview-capture surface opens the page in its default state.

# Multi-Record Synthesis Tray Design

## Purpose

Devanomy will support an **on-demand synthesis tray** that lets a user collect two to eight eligible knowledge records while moving among the Writing Studio, Commonplace workspace, and Ideas Lab. The user can then ask the AI to analyze the set as one bounded corpus. The feature is intentionally non-persistent in its first release: selected references and generated results remain in client state for the current session only.

## Interaction Model

Each eligible record exposes an **Add to synthesis** action. The global tray retains selections across route changes and shows each source’s title, module, and remove action. It provides an accessible live count and prevents duplicate additions. The action to generate a synthesis is unavailable until at least two sources are selected and the tray rejects selections above eight sources. A change to the selected source set clears an existing result, keeping provenance accurate.

The expanded tray contains a review surface with explicit empty, under-minimum, ready, loading, error, retry, refresh, and completed states. Motion remains restrained and respects the existing reduced-motion rules. Keyboard users can operate all selection and removal controls, and the interface does not rely on hover alone.

## Protected Server Flow

The client submits only a list of `{ module, recordId }` references. A protected server procedure validates that the list contains two to eight distinct records, loads every record for the authenticated owner, normalizes each module’s readable content, bounds aggregate text, and labels every source with a stable marker such as `S1`, `S2`, and `S3`.

The structured model output includes a synthesis thesis, shared themes, tensions or contradictions, emergent connections, open questions, and next synthesis moves. Every finding carries one or more source markers. The server validates the response, verifies marker references, and returns source metadata for display. Source material is treated as quoted data, never as executable instructions.

## Testing and Safeguards

Coverage will include authentication, cross-user source isolation, duplicate-selection prevention, the two-to-eight limit, module-aware context assembly, malformed model output, provenance marker validation, selection reset behavior, and visible loading or failure states. The completed change will be verified with the full Vitest suite, TypeScript checks, production build, route-bundle guard, and preview health checks.

# Directional Link Live Verification Notes

## Confirmed live UI findings

The Research Studio page at `/documents` now exposes a visible **Relationship meaning** selector in the reference lane.

The live selector currently shows the following relationship options with directional symbols:

- Supports →
- Questions →
- Develops →
- Contradicts ↔
- Defines ←
- Extends →
- Related ↔

The active document view also shows notebook reference search and insertion controls, which means the directional semantics are now wired into the actual document-linking workflow rather than only a static helper.

At the time of observation, the selected document was `Syllogue`, and it showed `0 links` before running any live creation test.

## Live mutation result

A live semantic link was successfully created from the `Syllogue` document using the **Defines ←** relationship. After insertion, the document’s link count increased from `0 links` to `1 links`, and the linked-record panel rendered the saved relationship as **`notebook ← Defines`**, confirming that backward-direction formatting is working in the active app workflow.

A second live semantic link was then created using the **Related ↔** relationship. After that insertion, the document’s link count increased from `1 links` to `2 links`, and the linked-record list rendered **`Related ↔ notebook`**, confirming that bidirectional relationship formatting is also persisting correctly in the live workflow.

For the forward-direction check, the live relationship picker was switched to **Supports →**, and the reference lane updated its action labels from the previous relationship to **`Insert as Supports →`** on the notebook reference cards. This confirmed that the active insertion affordance correctly tracks the selected forward-arrow relationship before the final insertion step.

A third live semantic link was created using the **Supports →** relationship. After insertion, the document’s link count increased from `2 links` to `3 links`, and the linked-record list rendered **`Supports → notebook`**, confirming that forward-direction formatting is also persisting correctly.

Taken together, the live document workflow has now been verified for all three directional styles that matter to the new semantics layer: backward (**Defines ←**), bidirectional (**Related ↔**), and forward (**Supports →**).

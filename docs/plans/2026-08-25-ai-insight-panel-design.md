# AI Insight Panel Design

## Objective

Add an on-demand, non-persistent AI analysis experience for selected **Research documents**, **Commonplace cards**, **quotations**, and **Ideas**. The feature must preserve each module's semantics, keep model access server-side, avoid automatic bulk generation, and present results through a reusable, accessible interface.

## Architecture

The server will expose one protected `insights.extract` mutation. Its input contains only a supported module discriminator and record ID. The server verifies ownership by loading the record through the module's existing data-access helper, rejects missing or content-empty records, builds a bounded module-aware context packet, and calls the existing built-in LLM integration with a strict JSON schema.

The response contract contains a concise thesis, three to six key insights, themes, open questions, suggested connections, a DIKW assessment, and a confidence note. Research analysis includes linked-reference context. Commonplace analysis incorporates the card type and structured content. Quotation analysis emphasizes the claim, source, interpretation, and potential application. Idea analysis emphasizes novelty, implications, tensions, and development paths.

Results remain client-side only. Selecting another record clears the current result, and refreshing deliberately replaces the active analysis. This release introduces no database migration, background job, or automatic generation.

## Interface

A reusable `InsightPanel` component will provide explicit initial, loading, success, error, and refresh states. The panel will be embedded beside the selected record in the Research Studio, Commonplace editor, and Ideas workspace. Quotation-type Commonplace cards use the same panel with quotation-aware server prompting.

The visual treatment will extend the established Devanomy system through restrained motion: approximately 180–220 ms easing for color, border, shadow, and transform changes; slight hover elevation on actionable cards; and a subtle opacity/translate entrance for newly generated results. Visible keyboard focus will be retained, status messaging will use appropriate ARIA semantics, and `prefers-reduced-motion` will disable nonessential transitions and transforms.

## Safeguards

The browser never sends arbitrary source text to the model endpoint. The server loads the authenticated record, normalizes the source, limits context length, and validates structured output before returning it. Empty records receive a clear actionable error. LLM failures are presented without destroying the selected record or current editor state.

## Verification

Vitest coverage will verify protected access, record lookup, empty-content rejection, module-aware context assembly, structured response parsing, and UI behavior for initial, loading, success, refresh, error, and selection-change states. Existing feature suites and project health checks must pass before checkpointing.

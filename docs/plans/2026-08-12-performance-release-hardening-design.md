# Performance and Release-Hardening Design

## Scope

This change addresses three verified operational needs: replace the unbounded Notebook list response with server-side pagination, defer page code until its route is requested, and replace the obsolete failing GitHub workflow with a repeatable pre-release quality gate.

## Architecture Decisions

### Notebook pagination

`notebook.list` will return a stable envelope containing `items` and `pageInfo`. Inputs will accept one-indexed `page` and a bounded `pageSize` of 1–100 while preserving category, search, and sort filters. The database helper will run a filtered count query plus a `LIMIT`/`OFFSET` data query. Dashboard metrics will use the returned total while reference pickers request only their first 25 results. Full Notebook export will move to a deliberately named `notebook.exportAll` query and will be fetched only when the user initiates an export, so normal route loads never transfer the complete archive.

### Route-level code splitting

Every registered page module will be loaded through `React.lazy`. The persistent dashboard shell remains eager so navigation structure appears consistently, while each page is wrapped in a local `Suspense` boundary with an accessible loading state. Vite will emit a build manifest, and a build verifier will fail if the expected route modules are not dynamic entries or if the initial entry bundle regresses above the chosen size threshold.

### Pre-release quality gate

| Approach | Tradeoffs | Cost | Setup complexity |
|---|---|---:|---:|
| GitHub-hosted pull-request, manual, and weekly workflow | Runs from the canonical repository; blocks regressions before merge; requires a disposable CI database and deterministic external-service mocks | Included GitHub-hosted runner allowance | Medium |
| Recurring Manus task | Easy to schedule but spins up an AI session for deterministic tests and consumes credits each run | Credits per run | Low |
| Production-site scheduled callback | Durable and inexpensive, but the production Node container is not a source checkout and should not run build, browser, and migration tooling | Low runtime cost | High and architecturally unsuitable |

The GitHub workflow is selected because this is deterministic repository validation. It will run on pull requests to `main`, manual dispatch, and a weekly UTC schedule. A disposable MySQL service and local Forge-compatible mock make the complete suite self-contained; no production credentials or user data are used.

## Error Handling and Safety

Pagination rejects invalid page sizes at the router boundary. Empty pages retain correct total and navigation metadata. Lazy-route failures remain inside the existing application error boundary. CI uses unique temporary records and existing cleanup logic, and the disposable database is destroyed with the runner. External owner notification remains a validation-only probe.

## Verification

Success requires pagination unit and HTTP-contract tests, all existing Vitest tests, TypeScript validation, production build, route-chunk manifest validation, all tRPC endpoint checks, every browser route, zero browser diagnostics, and a successful GitHub Actions quality-gate run after checkpoint synchronization.

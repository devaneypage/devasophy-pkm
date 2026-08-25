# Canonical Runtime Recovery and Commonplace Feature-Flag Verification

- [x] Reproduce and isolate the pnpm build-script policy failure
- [x] Identify incompatible duplicate-stack runtime configuration introduced after the last known-good tRPC checkpoint
- [x] Restore the canonical `client/` + tRPC package, TypeScript, and Vite configuration
- [x] Translate pnpm 10 patch and override settings into pnpm 11 workspace configuration
- [x] Remove obsolete Tailwind 3 configuration files conflicting with the Tailwind 4 Vite pipeline
- [x] Make autofill source paths configurable and replace external-file-dependent tests with temporary fixtures
- [x] Run TypeScript validation, all 288 Vitest tests, and the production build successfully
- [x] Verify Commonplace flag disabled and enabled states with authenticated Playwright testing
- [x] Confirm disabled navigation hiding, one-click activation, restored route access, and zero browser errors
- [x] Save a checkpoint for the verified runtime recovery

## Full Web-App Endpoint Verification — 2026-08-12

- [x] Run TypeScript validation, the complete Vitest suite, and production build
- [x] Inventory all tRPC procedures and classify safe smoke-test coverage
- [x] Exercise public and authenticated API endpoints over HTTP
- [x] Run authenticated Playwright smoke tests across application routes
- [x] Review browser console, page errors, failed requests, and server logs
- [x] Correct confirmed defects and rerun affected checks
- [x] Write the durable verification report
- [x] Save the verified endpoint-test state as a WebDev checkpoint

## Performance and Pre-release Hardening — 2026-08-12

- [x] Document architecture alternatives and the selected implementation
- [x] Add a bounded Notebook pagination contract and explicit deferred full export
- [x] Migrate Notebook consumers to page envelopes or full export as appropriate
- [x] Convert registered pages to verified route-level dynamic chunks
- [x] Replace the obsolete Webpack workflow with the complete scheduled pre-release gate
- [x] Run the complete unit, build, endpoint, browser, and bundle verification suite
- [x] Verify the canonical GitHub Actions quality-gate run
- [x] Save the verified WebDev checkpoint

## Scheduled Quality Gate Remediation — 2026-08-25

- [x] Diagnose the first weekly scheduled-run failure
- [x] Replace the stale persistent-data assertion with deterministic canonical seed coverage
- [x] Run the targeted regression, TypeScript validation, and all 295 Vitest tests
- [ ] Run the repaired canonical GitHub Actions quality gate successfully
- [ ] Save the final verified WebDev checkpoint

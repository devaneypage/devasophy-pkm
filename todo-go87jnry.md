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

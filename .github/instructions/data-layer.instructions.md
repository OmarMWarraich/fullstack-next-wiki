---
description: "Use when editing Drizzle queries in src/lib/data or write mutations in src/app/actions. Enforces typed select shapes, safer mutations, authz checks, and cache invalidation rules."
name: "Data Layer and Mutation Safety"
applyTo: "src/lib/data/**/*.ts", "src/app/actions/**/*.ts"
---
# Data Layer and Mutation Safety

## Query Conventions (src/lib/data/**)
- Keep read operations in `src/lib/data/**`; do not perform writes here.
- Use explicit select objects; do not rely on whole-row returns when only a subset is needed.
- Export explicit return types for query functions.
- Model nullable join fields in types (`string | null`) when using `leftJoin`.
- Avoid `as unknown as` casts unless unavoidable; if used, keep the cast local and explain why.

## Mutation Conventions (src/app/actions/**)
- Keep `"use server"` at module top for server action files.
- Keep authorization checks close to writes.
- For article ownership writes, preserve `authorizeUserToEditArticle` checks.
- Preserve graceful AI summarization fallback behavior (try/catch and continue without summary).
- Invalidate list cache after article writes using `articles:all`.

## Safety Checks Before Write
- Verify actor identity (`stackServerApp.getUser`) before mutate operations.
- Validate and normalize IDs before DB use (numeric IDs should parse safely).
- Keep write payloads minimal and explicit; avoid pass-through request objects.
- Return stable action result shapes to callers.

## Validation Commands
- Data/query or action changes: `npm run typecheck && npm run test`
- Auth/routing side effects from mutation changes: `npm run test:e2e`

## References
- Project-wide defaults: `/.github/copilot-instructions.md`
- Query patterns: `/src/lib/data/articles.ts`
- Action patterns: `/src/app/actions/articles.ts`

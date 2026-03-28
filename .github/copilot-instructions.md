# Project Guidelines

## Code Style
- Use TypeScript with strict types and small, explicit return types for data functions.
- Use the `@/` import alias for source files (configured in `tsconfig.json`).
- Keep server-only code in server contexts and preserve existing `server-only` guards where present.
- Follow Biome formatting and linting:
  - `npm run lint`
  - `npm run format`

## Architecture
- App routes live in `src/app/**` (Next.js App Router).
- Server mutations live in `src/app/actions/**` and should keep authorization checks close to writes.
- Data reads live in `src/lib/data/**`; prefer typed select shapes over returning entire table rows.
- Database schema is in `src/db/schema.ts`; migrations are generated into `drizzle/**`.
- Auth is Stack-based via `src/stack/server.tsx` and `src/stack/client.tsx`.
- Caching is Upstash Redis-based; article list cache key is `articles:all` in `src/cache/index.ts`.

## Build and Test
- Install: `npm install`
- Dev server: `npm run dev`
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Unit tests: `npm run test`
- E2E tests: `npm run test:e2e`
- Full CI-style checks: `npm run test:ci`

When changing code, run the smallest relevant validation first:
- UI or app logic: `npm run typecheck && npm run test`
- DB schema/migrations: `npm run db:generate && npm run db:migrate`
- E2E flows/auth/routing: `npm run test:e2e`

## Conventions
- Keep `"use server"` in server action modules.
- For article writes, preserve authz checks (`authorizeUserToEditArticle`) and cache invalidation (`articles:all`).
- Preserve graceful fallback behavior around AI summarization failures in actions.
- Prefer existing query/action patterns used in:
  - `src/lib/data/articles.ts`
  - `src/app/actions/articles.ts`

## Environment and Pitfalls
- Build and image config require `BLOB_BASE_URL` (`next.config.ts` asserts this).
- Drizzle commands require `DATABASE_URL` (`drizzle.config.ts` asserts this).
- Playwright uses `.env.test` and `.env.test.local`; global setup/teardown manages test DB branch lifecycle.

## Reference Docs
- E2E setup and troubleshooting: `test/e2e/README.md`
- Base project README: `README.md`

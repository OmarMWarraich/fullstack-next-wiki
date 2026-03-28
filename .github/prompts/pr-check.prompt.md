---
description: "Run a PR-style checklist review for authz, cache invalidation, environment asserts, and test coverage mapping."
name: "PR Checklist Review"
argument-hint: "Describe the PR scope, files changed, or paste a diff summary"
agent: "agent"
---
Run a focused PR-style review using this checklist:

## Scope Input
Use the user-provided scope first. If scope is missing, infer likely touched areas from available context.

## Checklist
1. Authorization safety
- Confirm write paths keep auth checks close to DB writes.
- For article ownership writes, verify `authorizeUserToEditArticle` is still enforced.

2. Cache correctness
- Confirm writes that affect article lists invalidate `articles:all`.
- Flag stale-data risks when list/detail read paths changed without cache strategy updates.

3. Environment asserts and config safety
- Verify required runtime assertions remain intact:
  - `BLOB_BASE_URL` in `next.config.ts`
  - `DATABASE_URL` in `drizzle.config.ts`
- Flag new env dependencies that are not documented or guarded.

4. Test mapping and adequacy
- Map each changed behavior to expected tests (unit and/or E2E).
- Check command coverage against project matrix:
  - logic/UI/actions: `npm run typecheck && npm run test`
  - auth/routing/e2e behavior: `npm run test:e2e`
  - broad confidence: `npm run test:ci`

## Output Format
Return only these sections:

### Findings (highest severity first)
- Severity: Critical | High | Medium | Low
- File
- Issue
- Why it matters
- Suggested fix

### Missing or Weak Tests
- Behavior not covered
- Recommended test type (unit or E2E)
- Suggested test location

### Validation Commands to Run
- Exact commands to execute for this PR scope

If no issues are found, explicitly say "No blocking findings" and include residual risk notes.

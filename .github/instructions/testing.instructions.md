---
description: "Use when modifying app routes, server actions, components, or tests. Enforces explicit test policy, required command matrix by change type, and minimum regression coverage."
name: "Testing Policy"
applyTo: "src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}", "test/**/*.{ts,tsx}"
---
# Testing Policy

## Required Command Matrix
Match your change type to the minimum command set:

| Change type | Required commands |
|---|---|
| UI/page/component behavior changes | `npm run typecheck && npm run test` |
| Server actions, data flow, authz, or cache behavior changes | `npm run typecheck && npm run test` |
| Route/auth flow changes | `npm run test:e2e` |
| E2E test/config changes | `npm run test:e2e` |
| Cross-cutting or pre-merge confidence check | `npm run test:ci` |
| Test-only unit updates | `npm run test` |

## Test Expectations
- Behavior changes must include test updates in the same PR.
- Bug fixes must add or update at least one regression test that fails before and passes after.
- Do not remove or weaken existing assertions unless behavior intentionally changed and documented.
- Avoid broad snapshot-only verification for business logic; prefer explicit assertions.
- Keep unit tests deterministic and isolated from network and external services.

## Selection Guidance
- Prefer unit tests for pure logic and server action branching.
- Use E2E tests for auth, routing, and multi-step user flows.
- If a change touches both logic and flow, add both unit and E2E coverage.

## Fast-Fail Review Checks
- Was every changed behavior mapped to at least one test?
- Are newly introduced edge cases covered?
- Were the correct commands from the matrix run for this change type?

## References
- Project-wide defaults: `/.github/copilot-instructions.md`
- E2E setup and troubleshooting: `/test/e2e/README.md`

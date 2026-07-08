# Testing

100% test coverage is the goal. Tests are what let you move fast and trust your
instincts while changing the code — without them, every change is a gamble.

## Framework

- **[Vitest](https://vitest.dev)** — test runner (Vite-native, fast, TS-first).
- **[@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/)** — component tests that assert on what the user sees.
- **[happy-dom](https://github.com/capricorn86/happy-dom)** — lightweight DOM for component tests.

Config lives in `vitest.config.ts`; global setup (jest-dom matchers + auto-cleanup)
in `vitest.setup.ts`. The `@/*` import alias mirrors `tsconfig.json`.

## Running

```bash
npm run test         # run the whole suite once (used in CI)
npm run test:watch   # re-run on file change during development
npx vitest run lib/utils.test.ts   # a single file
```

## Where tests live

Co-located with the code they cover, as `*.test.ts` / `*.test.tsx`:

- `lib/utils.test.ts` — pure formatting/name helpers
- `lib/tree/lineage.test.ts` — family-tree lineage computation

## Conventions

- Import test functions explicitly: `import { describe, it, expect, vi } from "vitest"`.
- Test **behavior**, not implementation. Never `expect(x).toBeDefined()` as the only
  assertion — assert what the code actually produces.
- Cover both branches of every conditional, plus null / empty / boundary inputs.
- Use `vi.useFakeTimers()` for anything time-based (debounce, timeouts) and restore
  real timers in `afterEach`.
- Never import secrets or real credentials into a test. Mock external services
  (Supabase, Anthropic) at the module boundary.

## What to test next

Highest-risk paths, tracked in `TODOS.md` under the test-framework item:

- The middleware auth guard (`middleware.ts`) — timeout + unauthenticated fallback.
- `canEdit` gating in `app/memory/[id]/MemoryDetailClient.tsx`.
- `requireFamilyMember` / `requireFamilyAdmin` in `lib/supabase/authz.ts`.

These land as their source branches (PRs #11, #12) merge to main.

## CI

`.github/workflows/test.yml` runs `tsc --noEmit` and `npm run test` on every push
to `main` and every pull request.

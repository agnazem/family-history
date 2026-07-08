
## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore

## Testing

Test runner: **Vitest** + **@testing-library/react** (happy-dom). See `TESTING.md` for full conventions.

- Run tests: `npm run test` (watch: `npm run test:watch`).
- Tests are co-located as `*.test.ts` / `*.test.tsx`.
- 100% coverage is the goal. When writing a new function, write a test. When fixing a bug, write a regression test. When adding a conditional, test both branches.
- Never commit code that makes existing tests fail. Mock Supabase/Anthropic at the module boundary; never import real credentials into a test.

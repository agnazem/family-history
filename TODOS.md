# TODOS

## P0

### Supabase outage resilience — stop the free-tier pause from recurring
**What:** On 2026-07-08 the whole app returned 504 (`MIDDLEWARE_INVOCATION_TIMEOUT`): the Supabase project's hostname stopped resolving (NXDOMAIN) because the free-tier project auto-paused after ~2 months idle and its DNS was removed. Project has since been restored. To stop this recurring, either (a) upgrade to a paid Supabase tier so it never auto-pauses, and/or (b) add a lightweight health check / status indicator so the next backend outage surfaces as a clear message instead of a cryptic gateway timeout.
**Why:** Free-tier pausing is an architectural failure mode, not a one-off — it recurs on any quiet stretch, and the symptom (site-wide 504) is opaque. PR #11 added a 3s middleware guard so an outage now degrades to redirects instead of hanging, but that treats the symptom; the backend still has to stay up.
**Effort:** S (paid tier: minutes + ~$25/mo) or M (status/health page: human ~half day / CC ~20 min)
**Status:** Supabase restored 2026-07-08; migrations 017–020 applied and RLS verified enforcing on all six tables. Only the resilience decision (paid tier vs. status/health page) remains open.

## P2

### API route authz — LOW defense-in-depth follow-ups
**What:** Follow-ups from the API-route authz audit (branch `security/rls-and-client-guards`). None are exploitable today — RLS is the backstop and no service-role route is missing a manual check — but these routes delegate authz entirely to RLS or rate-limit nothing, so they're worth tightening:
- `app/api/ai/summarize/route.ts` — writes `people.ai_summary` with no in-code authz (RLS-only). Add `requireFamilyMember` on the person's `family_id`.
- `app/api/ai/extract-entities/route.ts`, `app/api/ai/next-prompts/route.ts` — authenticate but do no family check and touch no DB. Only risk is Anthropic API-cost abuse by any authenticated user. Consider a family-scope check and/or rate limiting.
- `app/api/ai/parse-recording/route.ts` — family check only fires when the client sends `familyId` (L21); make it required or rate-limit.
- `app/api/recordings/start/route.ts` — RLS-only INSERT gate; correct today, add explicit `requireFamilyMember` for consistency.
**Why:** Defense-in-depth + LLM-cost protection. Deferred from the P1 pass, which fixed the MEDIUM finding (chunk/finalize) and shipped the shared `requireFamilyMember`/`requireFamilyAdmin` helpers.
**Effort:** S (human: ~1h / CC: ~10 min)
**Depends on:** `lib/supabase/authz.ts` helpers (shipped)

### Soft-delete / trash for people
**What:** Extend the soft-delete pattern (already built for memories) to people. Add `deleted_at` to `people`, filter them out of the tree/search/person page, preserve relationships and memory tags on soft-delete (restore them on un-delete), and add a "Deleted People" section to `/settings/trash`.
**Why:** Admins need a safety net when a person is accidentally removed from the tree, just as they have for memories.
**Effort:** M (human: ~half day / CC: ~20 min)
**Depends on:** Trash/recovery store for memories (shipped)

### Toolbar navigation refactor
**What:** The tree toolbar has 8+ buttons after Activity Feed is added. Group into a dropdown, sidebar, or icon-only with tooltips.
**Why:** Cognitive overload for first-time family members. Invite-to-confusion is too fast.
**Effort:** M (human: ~half day / CC: ~20 min)
**Depends on:** Activity Feed ships first (so the full button count is known)

### Export to PDF / printable family book
**What:** Generate a PDF of the family history — person profiles + memories listed under each person, with photos.
**Why:** Transforms the app from a tool you use into an artifact you own. Lowers trust barrier for families hesitant to digitize. A printed book is a real heirloom.
**Effort:** L (human: ~3 days / CC: ~45 min). Use `react-pdf` or Puppeteer.
**Depends on:** Core collaborative features stable (memories, comments, edit/delete)

## P3

### Sunday prompt
**What:** A weekly question surfaced on home that drives recording between holidays. Every Sunday a new prompt becomes active; users can record a memory answering it. Prompt detail page shows all family answers. Archive at `/prompts`. Weekly email opt-in (8am local time). ~52 prompts seeded at launch.
**Why:** Core retention feature — gives families a reason to open the app outside of big events.
**Effort:** L (human: ~3–4 days / CC: ~45 min)
**Spec:** `handoff/CLAUDE.md` §3, `handoff/prompts-seed.md`
**Depends on:** Phase 2 memory detail (shipped), transactional email setup


### Memory detail — Threads (topic tags)
**What:** Topic/theme tag chips on the memory detail right rail (e.g. "Family · Russo line", "Childhood", "Brooklyn"). Needs a `memory_tags` table and tag assignment UI.
**Why:** The v2 design mock shows these as a way to browse memories by theme across the archive.
**Effort:** M (human: ~1 day / CC: ~20 min)
**Depends on:** Memory detail v2 style pass (ships without this)

### Mobile bottom nav bar
**What:** A 5-item bottom navigation bar (Home / Tree / mic-FAB / People / Saved) to replace the current single sticky record button on mobile. FAB floats 18px above the bar.
**Why:** The v2 design mock specifies this as the mobile chrome. The current sticky record button is functional but doesn't match the intended mobile navigation pattern.
**Effort:** M (human: ~half day / CC: ~15 min)
**Depends on:** Routes for "People" and "Saved" need to exist (stubs acceptable at first)

### Mobile Home — responsive polish
**What:** Responsive variant of Home: greeting shrinks to 36–44px, action row becomes 2×2 grid, story rows drop waveform, prompt card becomes full-width CTA.
**Why:** The v2 design mock (screens/mobile.jsx) specifies these breakpoint changes.
**Effort:** S (human: ~2h / CC: ~10 min)
**Depends on:** Mobile bottom nav bar

### Mobile Record — responsive polish
**What:** Compact recording layout on mobile — transcript scrollable above fold, waveform + pause/stop controls pinned to bottom.
**Why:** The v2 design mock specifies this layout for the recording flow.
**Effort:** S (human: ~2h / CC: ~10 min)
**Depends on:** Record right-rail (desktop, shipped first)

### Mention auto-detection in transcripts
**What:** Typing `@` in a transcript opens a person picker; inserts as `@[Name](person:id)` markdown link that the renderer understands as a tagged person.
**Why:** Currently tagging people in transcripts is entirely manual via the tag editor — auto-detection while typing would be faster.
**Effort:** M (human: ~1 day / CC: ~20 min)
**Depends on:** Memory detail route (shipped)

### Onboarding redesign
**What:** Instrument the existing sign-up and first-session flow, then redesign based on where people drop off.
**Why:** Current onboarding is functional but unpolished; data first before redesigning.
**Effort:** M — instrument first, then redesign (human: ~2 days / CC: ~30 min)
**Depends on:** Analytics/instrumentation in place

### Dark mode
**What:** A Vellum or Dusk color direction for the design system. One direction, executed well.
**Why:** User comfort for evening use; also a natural fit for the warm amber palette.
**Effort:** M (human: ~1 day / CC: ~20 min)
**Depends on:** Design token system stable (shipped)

### Photos tab on person page may be redundant
**What:** The Photos tab on a person's page surfaces photos tagged with that person. However, photos are already browsable on the Memories tab. Consider removing the Photos tab to reduce nav clutter and consolidate photo browsing under Memories.
**Why:** Simpler navigation; photos are memories, so they belong on the Memories tab.
**Effort:** XS (human: ~30 min / CC: ~5 min)
**Depends on:** Confirm no user research showing Photos tab has distinct value

### Redundant action buttons on record / present page
**What:** The record flow and present (memory detail?) page have duplicate or redundant edit, delete, and record buttons that create visual clutter and confuse affordances.
**Why:** Each action should appear once, in the most logical place.
**Effort:** S (human: ~1h / CC: ~10 min)
**Depends on:** Design audit of which buttons are truly needed per page state

## Done

### Site-wide 504 fix + security/test PRs landed and deployed
**What:** Shipped and merged the three PRs that came out of the 504 investigation, in order #11 → #13 → #12, then deployed and verified in production.
- #11 (`v0.3.0.1`) — 3s timeout guard around `supabase.auth.getUser()` in middleware so an unreachable Supabase degrades to redirects instead of `MIDDLEWARE_INVOCATION_TIMEOUT`.
- #13 — Vitest + React Testing Library framework, CI workflow, 21 passing tests (lineage + utils).
- #12 — security audit (RLS migrations, storage policy cleanup, client `canEdit` guards, API-route authz helpers).
- Migrations 017–020 applied to the restored Supabase; RLS confirmed enforcing (anon reads return empty). Production healthy at `family-history-five.vercel.app`; logged-in read/write happy path verified.
**Completed:** 2026-07-08

### Test framework + coverage on auth/permission paths
**What:** Stood up the project's first automated test framework — Vitest + @testing-library/react (happy-dom), `@/*` alias, CI (`tsc --noEmit` + `npm run test` on push/PR), `TESTING.md` + `CLAUDE.md` conventions. Converted the hand-rolled `lineage.test.ts` to real specs and added `lib/utils.test.ts`. 21 tests passing. Shipped in PR #13.
**Note:** Dedicated auth-path tests (middleware guard, `canEdit`, `requireFamilyMember`/`requireFamilyAdmin`) are the natural next coverage target now that those files are on `main`.
**Completed:** 2026-07-08

### Security audit — storage buckets and access control
**What:** v0.2.0.0 adversarial-review follow-up, shipped across two commits on `security/rls-and-client-guards`.
- Storage buckets: dropped legacy over-permissive read policies, tightened profile-photo writes to require family membership, and added owner/admin DELETE policies (migrations 017, 020). RLS enabled on all tables (018).
- Added in-function `canEdit` guards to the `MemoryDetailClient` save functions (commit 25b312a).
- Audited all 15 API routes for consistent authz. Result: no service-role route missing a manual check. Fixed the one MEDIUM finding — `recordings/[id]/chunk` and `finalize` had no in-code authz — by adding explicit `requireFamilyMember` checks. Introduced shared `lib/supabase/authz.ts` (`requireFamilyMember`/`requireFamilyAdmin`) and refactored `api/members` to use it. Remaining LOW/LLM-cost items tracked as a P2 follow-up.
**Completed:** 2026-07-08

### Tree visualization upgrade
**What:** Updated `@xyflow/react` tree nodes to the Folio hairline aesthetic — cream surface, hairline border, name in Fraunces, dates in DM Mono. Connection lines: `stroke="#E0D2BB"`, `strokeWidth={1}`.
**Completed:** v0.2.0.0 (2026-05-04)

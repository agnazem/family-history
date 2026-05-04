# Folio — Claude Code Build Prompt

Paste the contents of this file as your opening message in a Claude Code session, with the repo open. Adjust paths if `handoff/` is somewhere other than the repo root.

---

I have a working family-history app called **Folio** (Next.js 15 + React 19 + Tailwind + Supabase). Phases 1, 2, and 2.5 are already shipped (visual system, memory detail, home page); Phase 3 (Sunday prompt) is **partially** shipped — the card slot is on home but the archive/email/seed work is outstanding. I've now produced a **new round of design work** that layers on top of the shipped app, and I need you to implement it.

The new design work lives in `handoff/`. **Start by reading these in order:**

1. `handoff/DESIGN_BRIEF.md` — the *why*. What Folio is, who it's for, what it should feel like, and explicit non-goals.
2. `handoff/CLAUDE.md` — the engineering spec. The Status block at the top is current; the **Phase 4** section is what this build is about.
3. `handoff/reference/Family History - Folio.html` — the visual reference. Open it in a browser if you can, or read the JSX directly. Every new surface is on this canvas.
4. `handoff/reference/screens/*.jsx` — per-screen design source. Treat as design spec, not code to port. Re-implement against our existing components and Tailwind classes.

## Repo orientation (audited at handoff time)

So you don't have to rediscover this:

- **Stack:** Next.js 15 (App Router) + React 19 + Tailwind 3 + Supabase. No test framework wired up. `npm run lint` and `tsc` (via `next build`) are the verification surfaces.
- **Two home-ish pages — don't confuse them:**
  - `app/page.tsx` — landing/auth page (signed-out)
  - `app/home/page.tsx` — signed-in home (this is the "Home" surface in the mocks)
- **Home components already exist** in `components/home/{GreetingHero, StoryRow, ContributorsCard, ArchiveStatsCard, UpcomingCard, SundayPromptCard}.tsx`. The mock work on Home is almost certainly polish on top of these, not net-new components.
- **Folio components live under `components/folio/`** — `MemoryCard`, `AudioPlayer`, `AudioRecorder`, `TellMeModal`, `PersonSummary`, etc. New shared components belong here unless they're tree-specific (use `components/tree/`) or home-specific (use `components/home/`).
- **Tree files:** `app/tree/page.tsx` is the route; `components/tree/{TreeCanvas, PersonNode, GenerationHeaderNode, AddPersonPanel, AddRelationshipPanel, PersonSidePanel, RelationshipModal}.tsx` are the parts. **There is no v2 lineage logic anywhere** — Tree v2 is genuinely new work.
- **There is an `app/mockup/page.tsx` (~30KB)** in the repo. Likely Phase 1 mockup leftovers. Flag it if you find it's dead code; don't delete it without asking.
- **`TODOS.md` already lists "Tree visualization upgrade"** as a P3 item — the v2 design pass overlaps and likely closes that TODO. Mention it in your PR description.

## Step 1 — Diff the mocks against what's shipped

Survey the repo against the mocks. The reference canvas contains these artboards:

- **Design system** (`screens/design-system.jsx`) — token + component reference. CHANGELOG v0.1.1.0 lists the shipped tokens; verify against `app/globals.css` and `tailwind.config.ts`.
- **Home** (`screens/home.jsx`) — compare against `app/home/page.tsx` + `components/home/*.tsx`.
- **Person profile** (`screens/person.jsx`) — `app/person/[id]/page.tsx` (18KB; will need careful diffing).
- **Tree v1** (`screens/tree.jsx`) — `app/tree/page.tsx` + `components/tree/PersonNode.tsx` etc. Likely already matches; verify.
- **Tree v2** (`screens/tree-v2.jsx`) — **NEW.** Adds *direct lineage emphasis* and *click-to-reroot* — clicking any node makes them the lineage subject and recomputes which lines/cards are direct vs. collateral. Has a "Highlight line" toggle to switch between "show everything" and "fade collateral kin." Read the JSX comment block at the top — it defines exactly what counts as direct lineage (ancestors, descendants, siblings, spouse, and spouses of any direct ancestor or descendant; aunts/uncles/cousins remain collateral). **Decision needed:** does this replace tree v1, live as a toggle on the same page, or get its own route? Ask me.
- **Memory detail** (`screens/memory.jsx`) — `app/memory/[id]/page.tsx` + `MemoryDetailClient.tsx` (50KB — large file; diff carefully).
- **Record flow** (`screens/record.jsx`) — `app/record/page.tsx` + `components/folio/{AudioRecorder, TellMeModal}.tsx`.
- **Mobile · Home and Mobile · Record** (`screens/mobile.jsx`) — responsive variants. Verify the existing pages match at small breakpoints; no separate routes.

**Output of this step:** a written diff. For each surface, one of:
- `unchanged` — the mock matches what's shipped, no work needed.
- `style-only` — markup is the same, only classes/tokens/typography changed.
- `additive` — new sections, new components, new state. List them.
- `restructured` — the page is meaningfully different. Describe the change.

**Show me this diff and wait for me to confirm the scope before writing any code.** I may want to drop some items, prioritize others, or split into multiple PRs.

## Step 2 — Plan the implementation

For each item I greenlight, propose:

- The files you'll add or edit.
- Any new components needed (and where they live in `components/`).
- Any new data needs (Supabase queries, schema migrations under `supabase/`, new API routes under `app/api/`). For Tree v2 specifically: the lineage computation is pure client-side given the tree data we already fetch; don't add server work for it.
- A test plan: what you'll typecheck/lint, whether existing tests cover the change, and whether new tests are needed for non-trivial logic (the lineage computation is the obvious candidate).

**Show me the plan and wait for approval** before implementing.

## Step 3 — Implement

Once the plan is approved:

- Work surface-by-surface, smallest first. Tree v2 is probably the largest new piece; do it last.
- Do **not** port the JSX in `handoff/reference/` verbatim. That code uses inline-style React for design fidelity. Re-implement against our existing component library, Tailwind classes, and tokens (already in `tokens.css` from Phase 1).
- Match the visual target pixel-for-pixel where possible. Tokens, typography, hairlines, italic flourishes — read the brief if you're unsure why a detail matters.
- Stay inside the design language. No emoji, no shadows where the mock uses hairlines, no gradient backgrounds, no AI-slop iconography. If you're tempted to add a stat tile or a sparkle icon, the answer is no.

## Step 4 — Verify and ship

Before declaring done:

- Run `npm run lint` and `npx next build` (which runs typecheck). Fix anything you broke.
- The repo has no test framework wired up. For Tree v2's lineage computation specifically: extract it as a pure function (e.g. `lib/tree/lineage.ts`), with hand-written assertions in a sibling file or a quick `tsx` script you can run once to verify. If you'd rather wire up Vitest (lightweight, plays well with Next 15), ask first.
- Take screenshots of each new/changed surface and save them to `screenshots/` so I can review without running the dev server.
- Push to a feature branch named `folio/v2-design-pass`. Open a PR with a description that mirrors the diff from Step 1, so I can see at a glance what changed and why. Mention that this likely closes the "Tree visualization upgrade" TODO from `TODOS.md`.

## Ground rules

- **Ask before any non-trivial decision.** Architectural choices, schema changes, new dependencies, anything that changes a public route or API — stop and ask. Style-only edits inside an existing component, no need to ask.
- **If a mock and the spec disagree:** the spec wins where it has an opinion; the mock wins where the spec is silent. The brief explains the aesthetic — use it as the tiebreaker for taste calls.
- **If something feels off-brand while you're building, flag it before shipping.** Easier to course-correct in review than to walk back a pattern.
- **Don't expand scope.** If you notice unrelated improvements you'd like to make ("while I'm in here, I could refactor X"), put them in a `FOLLOWUPS.md` instead of doing them. Folio is a calm app; the codebase changes that ship it should be too.

Start with Step 1.

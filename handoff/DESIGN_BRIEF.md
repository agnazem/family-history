# Folio — Design Brief

A short brief for whoever is implementing the next phase. For the full per-file spec, see `CLAUDE.md`. For the visual target, open `reference/Family History — Folio.html` and pan the canvas.

---

## What we're making

**Folio** is a family-history app for collecting, preserving, and sharing the stories of your family across generations. The core unit is the **memory** — an audio recording, a photo, a document, or a written note, attached to one or more people in the family tree. The app's job is to make capturing a memory effortless, make finding old ones rewarding, and make the whole archive feel worth coming back to on a Sunday.

The audience skews older than typical SaaS — parents and grandparents are first-class users, not just subjects. Reading comfort, generous touch targets, and a calm interface matter more than density or cleverness.

## What it should feel like

Think **library, not feed.** Think **a well-kept journal, not a dashboard.** The app is a quiet place. It rewards lingering. Nothing pulses, nothing nudges, nothing demands attention. The warm cream paper, the serif display type, and the hairline rules are doing deliberate work: they signal that what's inside is worth keeping.

Concretely, the design language is:

- **Warm amber on cream.** The canvas is `#F7F1E6`, surfaces are `#FFFEFB`, text is a soft near-black `#1F1A14`. Hairlines are `#E0D2BB`. The brand accent is a muted brown `#8B5E3C`; a gold `#C2874F` is used sparingly for years, eras, and hover states. No pure white, no pure black, no cool grays.
- **Fraunces for display, DM Sans for body, DM Mono for labels.** Headlines are Fraunces 400 (not 300) — weight gives it confidence. Sizes run **bigger than typical** — H1 56px, hero 72px — because older eyes read better and confident type feels considered, not loud. Body type is 17px, not 16, for the same reason.
- **Italic flourishes on names, dates, and relationship words.** "Her *grandmother* Concetta", "the *summer* of 1962". One per heading, max. Used like an editor's hand — not decoration.
- **Hairline borders, not shadows.** Cards have a 1px `#E0D2BB` border. On hover, the border shifts to gold. Nothing lifts, nothing translates. The aesthetic is library-quiet.
- **No emoji, no AI-slop iconography, no gradient backgrounds, no rounded-corner-with-left-border alert boxes.** If you're reaching for a stat tile or a sparkle icon, stop.

## What's done and what's next

**Shipped:**
- The visual system (tokens, type, the restyled tree, person page, memory cards)
- The memory detail surface (`/memory/[id]`) with the audio player, live transcription, editable transcripts, person tagging, comments, timeline view, "Tell me about" recording flow

**Next — what this brief is asking you to build:**
1. **The v2 design pass** — a polish round across home, person, memory, record, and mobile, plus the big new feature: **Tree v2** with click-to-reroot and direct-lineage emphasis. Clicking any person makes them the lineage subject; the tree recomputes which lines and cards count as direct vs. collateral kin. See `BUILD_PROMPT.md` for the implementation gates.
2. **Finish the Sunday prompt** (Phase 3 completion, after the v2 pass). The card slot already exists on home. Outstanding: `/prompts` archive, prompts table seeded from `prompts-seed.md`, weekly email cron, prompt-detail pages.

## Non-goals

- **Not a social network.** No likes, no follower counts, no public profiles, no algorithmic feed. Comments exist; reactions and shares do not.
- **Not a genealogy database.** We are not competing with Ancestry.com. The tree is a navigation aid, not the product. Don't add gedcom imports, DNA matching, or census record search.
- **Not a CMS.** No tags, no folders, no custom fields. Memories attach to people and dates; that's the whole taxonomy.
- **Not a notification engine.** One weekly email (the Sunday prompt). No push, no in-app red dots, no "X new memories" badges.

## Fidelity

**High.** The mock is the visual target. Re-implement against the existing codebase (Next.js + Tailwind, see `CLAUDE.md` for file paths) — don't port the JSX in `reference/` verbatim, that's design code. Tokens are already in `tokens.css` and shipped.

The one place to expect ambiguity is interaction detail the mock doesn't show (loading states, empty states, error states). The spec calls these out where they matter; where it's silent, default to the quietest possible treatment — a hairline, a soft message, no spinners larger than they need to be.

## Shipped already

The visual system, the memory detail surface (`/memory/[id]` with audio player + live transcription + comments), and the home page (`/home`) are all live. Don't rebuild any of these — the brief is about what comes *next*.

## How to start

1. Read `BUILD_PROMPT.md` first — it's the directive with the four implementation gates.
2. Then this brief, then `CLAUDE.md` end-to-end. The Status block at the top of `CLAUDE.md` tells you exactly what's shipped.
3. Open `reference/Family History - Folio.html` in a browser. Pan around. Every surface in the v2 pass is on this canvas.
4. Follow the build prompt. Stop and confirm at each gate.

If something feels off-brand while you're building, trust the instinct — flag it before you ship. The aesthetic is doing real work here, and it's easier to course-correct in review than to walk back a pattern that's already shipped to three pages.

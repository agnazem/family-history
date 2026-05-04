# Folio — Family History App: Claude Code Handoff

This bundle is everything a developer (or Claude Code) needs to ship the next phase of the Folio family-history app. Open `CLAUDE.md` for the full spec; this README orients you.

## What's in this bundle

| File | What it is |
|---|---|
| `CLAUDE.md` | **Source of truth.** Phased implementation spec, status of shipped work, and full build spec for what's next. Start here. |
| `tokens.css` | Drop-in CSS variables — colors, type, hairlines. Already merged into the codebase as part of Phase 1; included here for reference and re-derivation. |
| `prompts-seed.md` | 52 starter Sunday-prompt questions for Phase 3 seed data. |
| `reference/Family History - Folio.html` | The visual reference — open in a browser and pan the canvas. Every screen the spec describes is laid out here side-by-side. |
| `reference/screens/*.jsx` | Per-screen JSX for the visual reference. Treat as design-spec source: read them to disambiguate anything `CLAUDE.md` is silent on. |
| `reference/primitives.jsx`, `reference/tokens.jsx`, `reference/design-canvas.jsx`, `reference/ios-frame.jsx` | Supporting files for the visual reference. Not meant to be ported. |

## About the design files — read this before you copy anything

**The HTML and JSX files in `reference/` are design references, not production code.** They use inline-style React inside a single HTML file for fidelity to the visual target — no build step, no router, no real data. **Do not port these components verbatim into your codebase.** Re-implement against your existing component library, design system, and Tailwind classes (or equivalent). The mock's job is to fix the visual target; your job is to make it native to the codebase.

If the project does not yet have an established framework for this app, choose the most appropriate one for the team and stack and implement against that — the spec is framework-agnostic. The example file paths in `CLAUDE.md` (`app/page.tsx`, `components/...`) assume Next.js + Tailwind because that's the codebase this was originally written against.

## Fidelity

**High-fidelity.** Colors, typography, spacing, and interactions are final. Pixel-perfect recreation is the goal. Tokens are in `tokens.css` and already shipped; the type/color/spacing scale is settled.

The one place to expect ambiguity is anything the spec calls out as "the spec is canonical when it conflicts with the mock; the mock is canonical when this doc is silent." When in doubt, read the JSX.

## Status of the work

**Shipped:**
- **Phase 1** — Visual refresh (tokens, type, restyled tree/person/memory cards, hairline + gold-hover treatment)
- **Phase 2** — `/memory/[id]` route, custom audio player, live Whisper transcription with two-pass finalizer, editable transcripts, person tagging, threaded comments, `/timeline`, `/activity`, "Tell me about" recording flow, AI person summaries

**Next up — what this handoff is asking you to build:**
- **Phase 2.5** — Home page (currently a placeholder; see `CLAUDE.md` §Phase 2.5 for the full build spec including greeting logic, data shape, component breakdown, and mobile variant)
- **Phase 3** — Sunday prompt feature (depends on Phase 2.5; spec in `CLAUDE.md` §Phase 3)

Phase 2.5 should ship first because Phase 3's prompt card needs a slot on Home to live in.

## How to start (suggested workflow for Claude Code)

1. Read `CLAUDE.md` end-to-end. The Status block at the top tells you exactly what's shipped and what isn't.
2. Open `reference/Family History - Folio.html` in a browser. Pan around. The "Home" artboard and the "Mobile · Home" artboard are what you're building.
3. Read `reference/screens/home.jsx` alongside `CLAUDE.md` §Phase 2.5. The JSX shows component structure and inline measurements; the spec covers data, edge cases, and copy logic.
4. Build Phase 2.5 against the existing codebase patterns. Spec lists six new files under `components/home/`.
5. When 2.5 is shipped, move to Phase 3. The Sunday prompt card already has a slot — you're wiring data and adding the cron + email + archive route.

## Assets and brand

No external brand assets are required. The visual identity is entirely typographic (Fraunces + DM Sans + DM Mono, all Google Fonts) plus the warm-amber color palette in `tokens.css`. Avatars in the mock are letter-initials only; real avatars use whatever upload pipeline already exists in the codebase.

## Questions while implementing

If `CLAUDE.md` is silent on something:
1. Check the corresponding `reference/screens/<screen>.jsx` file.
2. Check `reference/primitives.jsx` for shared component behaviors (Surface, Btn, Avatar, Eyebrow, etc.).
3. If still unclear, the spec calls out a deferred / out-of-scope note explicitly. Anything not addressed and not deferred is a real gap — flag it rather than guess.

# TODOS

## P1

## P2

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

### Tree visualization upgrade
**What:** Update the `@xyflow/react` tree nodes to the Folio hairline aesthetic — cream surface, hairline border, name in Fraunces, dates in DM Mono. Connection lines: `stroke="#E0D2BB"`, `strokeWidth={1}`.
**Why:** The current node look doesn't match the rest of the app after the visual refresh.
**Effort:** S (human: ~half day / CC: ~10 min)
**Depends on:** Visual refresh (shipped)
**Note:** Closed by v2 design pass (Tree v2 implementation).

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

## Done

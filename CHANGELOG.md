# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0.0] - 2026-05-04

### Added
- **Add Photo page** (`/add-photo`): dedicated upload flow matching the record session — drag-and-drop, click, or paste an image, tag people, and save with a title and date
- **EXIF metadata extraction**: date taken and GPS location are automatically read from photo files and pre-populated in the form using `exifr`; GPS coordinates are reverse-geocoded via Nominatim to a human-readable place name
- **Location field on memories**: photos (and other memories) can now store a place name, displayed in the "About this photo / recording" sidebar panel
- **Family scroll strip on person page**: the related-people strip is now visible on all tabs (not just Memories), supports horizontal trackpad/mouse scroll, and shows left/right chevron buttons when more than 3 family members exist
- **AI entity extraction** (`/api/ai/extract-entities`): extracts named people, places, and time references from live recording transcripts to surface as confirmation chips
- **AI next-prompts** (`/api/ai/next-prompts`): generates 3 gentle follow-up questions during a recording session based on what's been said so far
- **Lineage module** (`lib/tree/lineage.ts`): computes the ancestor/descendant/sibling/spouse path from any person to the tree root, used to highlight direct lineage in the tree canvas
- **Tree lineage mode**: toggle in the tree canvas that dims non-lineage nodes and highlights the direct path from root to selected person
- DB migration `013`: `maiden_name` column on `people` table (idempotent `IF NOT EXISTS`)
- DB migration `014`: `location` column on `memories` table

### Changed
- **Memory detail layout for photos**: photo renders full-width on the left with the "About this photo" panel on the right (desktop grid); transcript section is hidden for photo memories; "About this recording" label is now type-aware
- **Timeline page**: audio entries now use the shared `AudioPlayer` component instead of a raw `<audio>` element; transcript snippets shown as `line-clamp-3` previews
- **Audio duration tracking**: `AudioRecorder` now reports the actual elapsed recording duration (not estimated), which is saved to `duration_sec` in the database and displayed in Archive stats
- **Record page right-rail**: entity extraction panel shows confirmed/unconfirmed chips; next-prompts panel surfaces follow-up questions during recording
- **Hero `AudioPlayer`**: waveform visualizer with deterministic bar heights, progress scrubber, skip ±15s controls, and live duration display
- **Person page hero**: display-scale name with maiden name (`née`) and birth year fact row; new Photos tab
- Add Photo button on home page now routes to `/add-photo` instead of `/tree`
- `app/api/ai/extract-entities` and `app/api/ai/next-prompts` now require authentication

### Fixed
- Transcript paragraph timestamps no longer produce `-1:-1` values when sentence-trimmed text had spacing mismatches
- `fetchAiContext` missing from `useEffect` dependency array on record page

## [0.1.1.0] - 2026-05-02

### Added
- Folio warm-cream design token system: `--canvas`, `--surface`, `--surface-alt`, `--ink`, `--ink-soft`, `--ink-mute`, `--rule`, `--accent-soft`, `--gold`
- DM Mono font loaded via `next/font` — used for eyebrow labels, dates, and datelines
- Utility CSS classes: `.fraunces-display`, `.italic-flourish`, `.eyebrow`, `.dateline`, `.body-*`, `.rule`

### Changed
- All pages and components now use warm cream backgrounds instead of cool white/gray
- Memory cards: uniform cream surface with hairline border; hover highlights in gold rather than colored type chips per memory type
- Family tree: connection lines reduced to hairline (`1px`, `#E0D2BB`); person nodes updated to cream surface with Fraunces names and DM Mono dates; couple junction node uses warm palette
- Person page: name renders at display scale with responsive clamp; dates shown in DM Mono with em-dash; bio expanded to 19px/1.55 line-height
- Relationship section labels and person chips updated to Folio token system
- Landing/auth page: Fraunces headline, warm ink tokens, surface card replaces white card with drop shadow

### Fixed
- Eyebrow label contrast: `--ink-mute` → `--ink-soft` (3.55:1 → 7.12:1, WCAG AA)
- Dateline contrast: `--gold` → `--accent` (2.72:1 → 5.6:1, WCAG AA)
- Person name headline: responsive `clamp(28px, 7vw, 56px)` prevents overflow on narrow screens
- Removed `memoryTypes` dead code from PersonNode, TreeCanvas, and tree page
- All hardcoded hex values in `tailwind.config.ts` replaced with CSS variable references

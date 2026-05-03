# Changelog

All notable changes to this project will be documented in this file.

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

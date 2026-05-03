# Family History — Design Vision

A design specification for the Family History app. Covers aesthetic intent, color tokens, typography, elevation, and component patterns across all four screens. Use this document to extend, redesign, or generate new UI that stays true to the established direction.

Live mockup reference: `/mockup` (all four screens rendered with inline styles — the ground truth for visual decisions).

---


## Aesthetic intent

The app feels like a well-made archival object — a family ledger or photo album that has aged gracefully. Every surface is warm, never cold. The palette draws from aged paper, unbleached linen, and natural wood tones. There are no blues or grays for primary actions; the accent color is a deep amber-brown.

The typeface pairing is deliberate: **Fraunces** (an optical serif, slightly variable, designed to feel handmade) for all display text — names, headings, dates on cards. **DM Sans** for UI chrome — labels, buttons, metadata. The contrast between these two creates a sense of "the record" (Fraunces) vs. "the interface" (DM Sans).

White space is generous. Cards breathe. There is no heavy chrome. The tree canvas background (`#FAFAF8`) reads as warm off-white parchment, not a blank webpage.

Interactions are quiet: `shadow-sm` at rest, `shadow-md` on hover, a thin amber ring for focus. Nothing bounces or slides aggressively. The app should feel calm and trustworthy — these are memories people care about.

---

## Color tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` / `canvas` | `#FAFAF8` | Page backgrounds, tree canvas, form backgrounds |
| `--surface` | `#FFFFFF` | Cards, modals, toolbar |
| `--surface-2` | `#F5F3F0` | Upload zones, inactive inputs, subtle fills |
| `--text-1` | `#18181A` | Primary text, names, headings |
| `--text-2` | `#6B6560` | Secondary text, bios, body copy |
| `--text-3` | `#A8A39D` | Tertiary text, dates, placeholders, meta |
| `--accent` | `#8B5E3C` | Primary brand color, CTA buttons, links |
| `--accent-hover` | `#7A5234` | Hover state for accent elements |
| `--accent-mid` | `#C2874F` | Memory indicator dots, accent highlights |
| `--accent-pale` | `#F5EFE8` | Accent backgrounds, hover fills, badges |
| `--accent-border` | `#DBC9B6` | Accent-colored borders, relationship chips |
| `--border` | `#EDE8E3` | Default card borders, dividers |
| `--border-2` | `#F0ECE8` | Subtle inner dividers, section borders |

### Danger / destructive
- Text: `#B8362A`
- Border: `#F0C4C0`
- Background: transparent (ghost style only)

### Tailwind mapping
```
accent.DEFAULT  = #8B5E3C
accent.hover    = #7A5234
accent.mid      = #C2874F
accent.pale     = #F5EFE8
accent.border   = #DBC9B6
canvas          = #FAFAF8
```

---

## Typography

### Typefaces
- **Display**: Fraunces — variable optical serif. Load with `opsz` axis, `weight: "variable"`, styles `normal` + `italic`. CSS var: `--font-fraunces`.
- **UI**: DM Sans — geometric sans-serif. Load optical size range 9–40, weights 300–600. CSS var: `--font-dm-sans`.

### Scale and usage

| Role | Family | Size | Weight | Notes |
|------|--------|------|--------|-------|
| Page title (folio) | Fraunces | 30px | 300 | `letter-spacing: -0.02em`, `line-height: 1.15` |
| Section title | Fraunces | 18–20px | 400 | e.g. "Relationships", "Memories" |
| Settings heading | Fraunces | 24px | 300 | |
| Memory card title | Fraunces | 16px | 400 | `line-height: 1.3` |
| Tree node name | Fraunces | 12.5px | 400 | `line-height: 1.25`, `line-clamp-2` |
| Brand name | Fraunces | 15px | 400 | Toolbar only, `letter-spacing: -0.01em` |
| Body / bio | DM Sans | 13.5px | 400 | `line-height: 1.65`, `color: --text-2` |
| Button | DM Sans | 12–13.5px | 500 | All interactive controls |
| Label / meta | DM Sans | 10–12px | 400–600 | Dates, badges, section headings |
| Tree node dates | DM Sans | 10px | 400 | `color: --text-3` |

Headings use `text-wrap: balance`. All text is antialiased (`-webkit-font-smoothing: antialiased`).

---

## Elevation & shadows

Three levels. All shadows use warm brown undertones (`rgba(28,20,14,…)`), never gray or blue.

| Level | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 3px rgba(28,20,14,.07), 0 1px 2px rgba(28,20,14,.04)` | Cards at rest, tree nodes, memory cards |
| `shadow-md` | `0 4px 16px rgba(28,20,14,.09), 0 2px 4px rgba(28,20,14,.04)` | Hovered cards, modals, panels |
| `shadow-lg` | `0 12px 40px rgba(28,20,14,.12), 0 4px 8px rgba(28,20,14,.05)` | Device frames in mockup, overlays |

Focus ring: `box-shadow: 0 0 0 3px #F5EFE8` (accent-pale), no dark outline.

---

## Border radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | `6px` | Buttons, badges, toolbar buttons |
| `radius-md` | `10px` | Form inputs, chips, some panels |
| `radius-lg` | `12px` | Cards (tree nodes, memory cards, form card, settings cards) |
| `rounded-full` | `9999px` | Avatars, memory indicator dots, badges with pill shape |
| Brand icon | `7px` | The 26×26px toolbar brand icon |

---

## Component patterns

### Tree node card

The fundamental unit of the tree. Fixed size: **192×64px**. Never grows or shrinks regardless of name length or date presence.

```
┌─────────────────────────────────────────┐  ← w-192, h-64, rounded-lg
│  [Av]  Name (line-clamp-2, 12.5px)    ●  │  ← amber dot top-right if memories
│         Dates (10px, text-3)              │
└─────────────────────────────────────────┘
```

- Background: white
- Border: `1px solid accent-border` (living) or `1px solid gray-200` (deceased)
- Shadow: `shadow-sm` at rest → `shadow-md` on hover
- Border also shifts to `accent-mid` on hover
- Padding: `0 13px` (horizontal only, avatar+text are centered vertically with `flex items-center`)
- Avatar: 32px circle, left-aligned, person-specific background (see Avatar system)
- Name: Fraunces 12.5px, `line-clamp-2`, stone-800 (living) or stone-400 (deceased)
- Dates: DM Sans 10px, stone-400, always reserves 13px height even when empty
- Memory indicator dot: 8×8px circle, `bg-accent-mid`, `ring-2 ring-white`, absolute top-[7px] right-[7px]
- Selected/focused state: amber `ring-3 ring-accent-pale` + shadow-md

### Toolbar

52px tall, white/translucent background (`rgba(250,250,248,.96)`), `border-b: 1px solid --border`.

Left: Brand pill — 26×26px amber rounded icon (`border-radius: 7px`) with BookOpen icon in white, followed by family name in Fraunces 15px.

Right: Icon + label buttons using DM Sans 12.5px, weight 500. Groups separated by 1px vertical dividers. Min touch target: 44×44px.

Button variants:
- Ghost: `background: transparent; border: 1px solid --border; color: --text-2`
- Primary: `background: --accent; color: white`
- Icon-only: `background: transparent; border: 1px solid transparent; color: --text-2`
- Active (select mode): `background: --accent-pale; border: 1px solid --accent-mid; color: --accent`

### Person folio header

White surface, generous padding (28px 32px), `border-bottom: 1px solid --border-2`.

Hero layout: 72px avatar circle left, name + metadata right.
- Name: Fraunces 30px weight 300, `letter-spacing: -0.02em`
- Nickname shown below as italic secondary line: `color: --text-2`
- Dates: DM Sans 13px, `color: --text-3`
- Bio: DM Sans 13.5px, `color: --text-2`, `line-height: 1.65`, `max-width: 400px`
- Edit/Delete buttons below bio: ghost style with 12px DM Sans

The body area (`--bg` background, 28px 32px padding) contains Relationships and Memories sections.

### Relationship chips

```
┌──────────────────────────────────┐
│  [26px Av]  First Last           │
└──────────────────────────────────┘
```
White surface, `border: 1px solid --border`, `border-radius: --radius-md`, `padding: 6px 12px 6px 6px`. Hover: `border-color: --accent-mid`.

Section headings above chip groups: `font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: --text-3`.

Add relationship buttons: `color: --accent; border: 1px solid --accent-border; background: --accent-pale; border-radius: --radius-sm`.

### Memory card

```
┌───────────────────────────────────┐
│ ████████████████ ← 3px accent bar │  ← gradient top bar, color by type
│ [Badge] Date                       │
│ Title (Fraunces 16px)              │
│ Body text (DM Sans 13px)           │
│ Also in: [tiny avatars]            │
└───────────────────────────────────┘
```

- Container: white surface, `border: 1px solid --border`, `border-radius: --radius-lg`, `shadow-sm`
- Top accent bar: 3px tall, left-to-right gradient (color depends on memory type — see below)
- Badge: 10px uppercase, `letter-spacing: 0.06em`, `border-radius: 4px`, type-specific color on pale background
- Title: Fraunces 16px weight 400, `color: --text-1`
- Body: DM Sans 13px, `color: --text-2`, `line-height: 1.6`
- Tagged avatars: 19px circles, `border: 1.5px solid white`, overlapping (-5px margin)

Memory type colors:
- Story: `#8B5E3C` / `#C2874F` (amber gradient)
- Photo: `#5E8B7A` / `#7AB5A0` (teal gradient)
- Audio: use a complementary warm gradient (suggest `#7A6B5E` / `#A89B8C`)

### Form inputs

- Background: `--bg` (not white — inputs sit inside white cards, so they appear inset)
- Border: `1px solid --border`
- Border-radius: `--radius-md` (10px)
- Padding: `9px 13px`
- Font: DM Sans 14px, `color: --text-1`
- Focus: `border-color: --accent-mid; box-shadow: 0 0 0 3px --accent-pale`
- Labels: DM Sans 11px, weight 600, `color: --text-2`, `letter-spacing: 0.03em`

Form cards: white surface, `border: 1px solid --border`, `border-radius: --radius-lg`, `shadow-sm`, 28px padding.

Form actions (Save/Cancel): full-width row, equal-flex buttons, 10px padding, `border-radius: --radius-md`.

### Settings / member rows

Member list rows: 12px vertical padding, 20px horizontal padding, `border-bottom: 1px solid --border-2`.
- 36px avatar left
- Name + email stack center (13.5px / 11.5px)
- Role badge right: admin uses amber pale + border, member uses surface-2

Invite panel: email input (full DM Sans, `--bg` background) + amber primary button, both 8px vertical padding.

---

## Avatar system

Avatars use a person-specific hue derived from their initial or identity. This creates visual distinctiveness on the tree without photos.

### Size variants
| Size | Dimensions | Font size |
|------|-----------|-----------|
| `sm` (tree node) | 32×32px | 13px Fraunces |
| `md` (chip) | 26×26px | 10.5px Fraunces |
| `lg` (settings row) | 36×36px | 14px Fraunces |
| `xl` (folio hero) | 72×72px | 26px Fraunces weight 300 |

### Color palette (assign by initial or rotation)
| Person / Initial | Background | Text |
|-----------------|-----------|------|
| Amber (T, amber family) | `#E8DDD4` | `#8B5E3C` |
| Purple (E, lavender) | `#E4E0EC` | `#5E4B8B` |
| Blue (R, slate) | `#D4E0EC` | `#2E6B9E` |
| Green (J, sage) | `#DCEADE` | `#3A7D44` |
| Warm amber (P, pale) | `#F5EFE8` | `#8B5E3C` |
| Teal | `#D4ECE8` | `#2E7A6B` |

The selected/primary person (e.g. the folio subject, the admin user) uses the **amber gradient avatar**:
```css
background: linear-gradient(145deg, #D4A574 0%, #A87B52 100%);
color: white;
```

When a real profile photo is present, show it as a circle crop. The colored initial circle is the fallback.

---

## Tree connector lines

SVG lines between nodes use `stroke: #DDD8D2` (warm taupe), `stroke-width: 1.5`.

Spouse connections use `stroke-dasharray: 4 3` (dashed) to distinguish from parent-child relationships visually.

---

## Interaction states

| State | Change |
|-------|--------|
| Default card | `shadow-sm`, color border |
| Card hover | `shadow-md`, `border-color: --accent-mid` |
| Card focused (selected on tree) | `ring: 3px solid --accent-pale`, `shadow-md`, `border-color: --accent-mid` |
| Input focus | `border-color: --accent-mid`, `box-shadow: 0 0 0 3px --accent-pale` |
| Button hover (ghost) | `background: --surface-2` or `--accent-pale` for accent-tinted |
| Destructive hover | `background: #FEF2F1`, `border-color: #F0C4C0` |

All transitions: `150–200ms ease`. Respect `prefers-reduced-motion: reduce` by disabling transitions.

---

## Screen inventory

| Screen | Route | Description |
|--------|-------|-------------|
| Tree Canvas | `/tree` | React Flow canvas with PersonNode cards, toolbar |
| Person Folio | `/person/[id]` | Profile page: avatar, bio, relationships, memories |
| Edit Person | `/person/[id]/edit` | Form to edit name, dates, bio, photo |
| Settings / Members | `/settings` | Family admin: member list + invite |
| Add Memory modal | overlay | Sheet/dialog for adding story, photo, audio |
| Timeline | `/timeline` | Chronological memory feed |
| Activity | `/activity` | Recent changes feed |

---

## Tech implementation notes

- All color tokens are defined in `tailwind.config.ts` under `theme.extend.colors`
- CSS custom properties (`--background`, `--foreground`) in `app/globals.css`
- Fraunces loaded via `next/font/google` with `weight: "variable"`, `axes: ["opsz"]`
- DM Sans loaded via `next/font/google` with `weight: ["300", "400", "500", "600"]`
- CSS classes: `font-display` → Fraunces, `font-sans` → DM Sans (Tailwind)
- Tree nodes: `@xyflow/react` custom node, fixed `w-[192px] h-[64px]`
- Deceased persons: `border-gray-200`, name `text-stone-400` instead of `text-stone-800`

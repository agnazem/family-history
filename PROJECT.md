# Family History — Project Brief

A collaborative family history app where members can build a visual family tree, record memories (stories, photos, audio), and use AI to surface insights and connections from what's been shared.

---

## What it does

**Family tree canvas** — a draggable, zoomable React Flow canvas where each person is a node card. Relationships (parent-child, spouse, sibling) are drawn as edges. Nodes show the person's avatar, name, birth/death dates, and a dot indicator if they have any memories.

**Person folios** — tapping a node opens a full profile page: avatar, name, bio, relationships (add/edit/link), and a chronological memory feed.

**Memories** — four types: story (note), photo, audio, document. Each memory can tag multiple people and appears in each tagged person's folio.

**AI summary** — each person has a "About [Name]" section powered by Claude. Generated from their memories + bio, editable inline, and regeneratable any time.

**"Tell me about" voice flow** — a guided recording modal on each person's folio page. The user speaks freely; live transcription runs in the browser (Web Speech API). When they stop, Claude parses the transcript and returns structured suggestions: individual memory cards to create, new people mentioned (with relationship inference), and relationship links to existing tree members. Each suggestion is checkboxable and editable before saving. The raw audio can also be saved as an audio memory.

**Timeline** — `/timeline`, chronological view of all memories across the family.

**Activity feed** — `/activity`, recent actions in the family.

**Settings / Members** — family admin can invite members by email, change roles, revoke access.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 App Router (`"use client"` / RSC) |
| Language | TypeScript |
| Styling | Tailwind CSS with custom design tokens |
| Database | Supabase (Postgres + RLS) |
| Auth | Supabase Auth (email/password + magic link) |
| Storage | Supabase Storage (`photos` bucket for images and audio) |
| Tree canvas | `@xyflow/react` (React Flow v12) |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| Fonts | `next/font/google` — Fraunces (display) + DM Sans (UI) |

---

## Repository structure

```
app/
  (auth)/           sign-in, sign-up pages
  activity/         activity feed page
  api/
    ai/
      summarize/    POST — generate person summary from memories
      parse-recording/ POST — extract memories/people/relationships from transcript
    invitations/    invite + revoke
    members/        list, add, change role, remove
    people/         delete person (cascade)
  family/new/       create family onboarding
  invite/           accept invitation flow
  mockup/           static HTML design reference (all 4 screens)
  person/[id]/      person folio page
    edit/           edit person form
  settings/         family admin panel
  timeline/         chronological memory view
  tree/             main tree canvas page

components/
  folio/
    AddMemoryModal    add memory (story/photo/audio/document)
    AudioPlayer       custom audio player with seek + duration fix
    MemoryCard        memory preview card
    MemoryModal       full memory detail + edit/delete
    PersonSummary     AI-generated summary with edit + regenerate
    TellMeModal       voice recording → AI parsing → suggestion review
    AddRelatedPersonModal  add parent/child/sibling/spouse (new or existing)
  search/
    SearchModal       ⌘K search across people and memories
  tree/
    AddPersonPanel    slide-in panel to add a new person
    AddRelationshipPanel  link two existing people
    PersonNode        React Flow custom node — the tree card
    RelationshipModal view/delete a relationship
    TreeCanvas        the React Flow canvas wrapper
  ui/
    Avatar            initials + photo circle, multiple sizes
    ConfirmModal      generic danger confirmation dialog
    Spinner           loading indicator

lib/
  anthropic.ts        Anthropic client singleton (server-side only)
  hooks/
    useFamily         current user's family + membership
    useMemories       memories for a person, with real-time subscription
    usePeople         all people + relationships, with real-time subscription
  layout.ts           auto-layout algorithm for the tree
  supabase/
    client.ts         browser Supabase client
    server.ts         server Supabase client (for API routes + middleware)
  utils.ts            shared helpers (formatDate, etc.)

middleware.ts         route protection — all routes except /, /auth/callback, /invite, /mockup
types/index.ts        all TypeScript interfaces
```

---

## Database schema

### `families`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | |
| created_by | uuid → auth.users | |
| created_at | timestamptz | |

### `family_members`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| family_id | uuid → families | |
| user_id | uuid → auth.users | |
| role | text | `admin` or `member` |
| joined_at | timestamptz | |

### `people`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| family_id | uuid → families | |
| first_name | text | |
| middle_name | text | nullable |
| last_name | text | |
| nickname | text | nullable — shown as `"nickname"` |
| dob | date | nullable |
| dod | date | nullable — presence marks person as deceased |
| bio | text | nullable — human-written bio |
| ai_summary | text | nullable — AI-generated, human-editable |
| profile_photo_url | text | nullable |
| canvas_x, canvas_y | float | position on tree canvas |
| created_by | uuid → auth.users | |
| created_at | timestamptz | |

### `relationships`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| family_id | uuid | |
| person_a_id | uuid → people | for `parent_child`: person_a = parent |
| person_b_id | uuid → people | for `parent_child`: person_b = child |
| type | text | `parent_child`, `spouse`, `sibling` |

### `memories`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| family_id | uuid | |
| type | text | `audio`, `photo`, `document`, `note` |
| title | text | |
| description | text | nullable |
| storage_url | text | nullable — Supabase Storage public URL |
| recorded_by | uuid → auth.users | |
| date_of_memory | text | nullable — can be a date string or descriptive ("Summer 1972") |
| created_at | timestamptz | |

### `memory_people`
Join table — which people are tagged in each memory.
| Column | Type |
|--------|------|
| id | uuid PK |
| memory_id | uuid → memories |
| person_id | uuid → people |
| family_id | uuid |

### `invitations`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| family_id | uuid | |
| email | text | |
| token | text | unique, used in invite link |
| invited_by | uuid → auth.users | |
| status | text | `pending`, `accepted` |
| created_at | timestamptz | |

---

## Key architectural decisions

### Route protection
Middleware at `middleware.ts` checks Supabase session and redirects unauthenticated users to `/`. Public paths: `/`, `/auth/callback`, `/invite`, `/mockup`.

### Client vs. server components
All pages are `"use client"` (interactive by default). API routes in `app/api/` use `createClient` from `lib/supabase/server.ts` which reads cookies. The Anthropic client (`lib/anthropic.ts`) is server-only — only imported in API routes.

### Real-time subscriptions
`useMemories` and `usePeople` both open Supabase Realtime channels on family-scoped tables. Changes from other users appear without refresh.

### Tree layout
Auto-layout (`lib/layout.ts`) computes generational positions. Manual dragging is also supported — positions are persisted to `canvas_x` / `canvas_y` on mouseup.

### Audio duration bug
Supabase Storage streams files without a `Content-Length` header. The browser reports `duration = Infinity`. Fix in `AudioPlayer.tsx`: detect `Infinity` on `loadedmetadata`, seek to `1e101` to trigger a range request, then `ondurationchange` fires with the real duration and we reset `currentTime = 0`.

### Navigation
All "Back" buttons use `router.push(path)` not `router.back()`. This ensures consistent navigation regardless of how the user arrived at a page.

### Person node sizing
Fixed at `w-[192px] h-[64px]`. Name uses `line-clamp-2`. Dates row always reserves `h-[13px]` even when empty — this prevents variable-height nodes on the canvas.

### AI summary persistence
`ai_summary` lives on the `people` row. The `/api/ai/summarize` route generates text from memories; the `PersonSummary` component then does a direct Supabase client update to persist it. The summary section shows "AI-generated · editable" to set expectations.

### Voice recording architecture
`TellMeModal` runs two things simultaneously when recording starts:
1. `MediaRecorder` (via `getUserMedia`) — captures the audio blob for optional storage
2. `SpeechRecognition` / `webkitSpeechRecognition` — provides live browser-side transcription (no extra API cost, goes to Google/Apple servers)

On stop, the transcript goes to `/api/ai/parse-recording` which returns structured JSON. All DB writes (creating memories, people, relationships) happen client-side after the user reviews and confirms suggestions. The API route is pure AI inference — no DB access.

---

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL        Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   Supabase anon key (safe to expose)
SUPABASE_SERVICE_ROLE_KEY       Service role key (server-only)
NEXT_PUBLIC_APP_URL             App base URL (used in invite emails)
ANTHROPIC_API_KEY               Anthropic API key (server-only, for AI features)
```

---

## Design system

See `DESIGN.md` for the full visual specification — color tokens, typography, elevation, component patterns, avatar system.

Short version:
- **Aesthetic**: warm archival — aged paper, linen, wood tones. Feels like a well-made family ledger.
- **Canvas background**: `#FAFAF8` (warm off-white)
- **Accent**: `#8B5E3C` (deep amber-brown) — all primary actions, links
- **Fonts**: Fraunces (display/names/headings) + DM Sans (UI/labels/buttons)
- **Cards**: white surface, 1px warm border, `shadow-sm` at rest → `shadow-md` on hover
- **No cold colors**: no primary blue or gray. Everything warm.

Live mockup at `/mockup` — all four screens rendered with inline styles, the ground truth for visual decisions.

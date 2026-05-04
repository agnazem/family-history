# Folio — Implementation Handoff

This document is the source of truth for the Folio visual direction and the features behind it. The visual reference for everything below is `Family History — Folio.html` in this project. When in doubt, open it and read the JSX in `screens/`. Spec is canonical when it conflicts with the mock; the mock is canonical when this doc is silent.

Companion file: `handoff/tokens.css` — drop-in design tokens.

## Status (as of May 2026)

**Phase 1 — Visual refresh — ✅ SHIPPED.**
Warm amber tokens, Fraunces 400 / bigger sizes / DM Mono eyebrows, `.eyebrow` / `.italic-flourish` / `.dateline` utilities, tree nodes + person page header + memory cards restyled, hairline + `hover:border-[--gold]` interactions throughout.

**Phase 2 — Memory detail + audio pipeline — ✅ SHIPPED.**
`/memory/[id]` server-rendered route with OG tags, custom audio player (1x/1.5x/2x), live Whisper transcription with two-pass finalizer, editable transcript with debounced autosave, person tagging, threaded comments, audio/photo/document/note memory types. Bonus surfaces shipped alongside: `/timeline`, `/activity`, "Tell me about" recording flow on person pages, AI-generated person summaries.

**Phase 2.5 — Home page — ⏳ NEXT.** Spec below. Depends on Phase 2's `/memory/[id]` route, which exists.

**Phase 3 — Sunday prompt — ⏳ AFTER 2.5.** Spec below. Depends on Phase 2.5's prompt card surface.

The original Phase 1 / Phase 2 specs are preserved below for reference and for re-derivation if anything needs to be revisited; treat them as historical unless something on those surfaces is being explicitly reworked.

---

## Phase 1 — Visual refresh (target: 1–2 days, one PR)

**Goal:** the app feels like Folio without changing any flows, routes, or data. Pure presentational diff.

**In scope:** restyling pages and components that already exist in the repo — `app/page.tsx` (home), `app/tree/page.tsx`, `app/person/[id]/page.tsx`, `components/MemoryCard.tsx`, `components/PersonChip.tsx`, plus tokens. Editing markup and classes inside these files is the entire job.

**Out of scope:** new *routes*, new components, new fields, new endpoints, new state. If you find yourself creating a file under `app/` or `components/` that didn't exist before, stop — you're off-track. (Restyling `app/page.tsx` is fine and required; *creating* a new page is not.)

### 1.1 Tokens

Replace your color and type tokens with the values in `handoff/tokens.css`. Concretely:

**Color (light mode only for now — ignore dark):**
| Token | Old | New |
|---|---|---|
| `--canvas` / page bg | `#FAFAF8` | `#F7F1E6` |
| `--surface` / cards | `#FFFFFF` | `#FFFEFB` |
| `--surface-alt` / sunken | `#F4F2EE` | `#F0E6D2` |
| `--ink` / primary text | `#1A1A1A` | `#1F1A14` |
| `--ink-soft` / secondary | `#666` | `#5A4F3F` |
| `--ink-mute` / tertiary | `#999` | `#8A7E69` |
| `--rule` / hairlines | `#E5E5E5` | `#E0D2BB` |
| `--accent` / brand | `#8B5E3C` *(unchanged)* | `#8B5E3C` |
| `--accent-soft` / accent bg | — | `#F0E1CD` |
| `--gold` / years, eras | — | `#C2874F` |

**Type:**
- Keep Fraunces + DM Sans. Add DM Mono for eyebrow labels (it's already in the brand font set; just import it).
- Display headlines: Fraunces, **weight 400** (not 300), tracking -0.02em, line-height 1.05. Sizes go **bigger** — h1 40 → 56, hero display 48 → 72. Old eyes are part of the audience; bigger reads more confident, not louder.
- Body: DM Sans 17/1.55. **Bump from 16 to 17.** Reading comfort matters here more than typical SaaS.
- Eyebrow / caps labels: DM Mono 12, tracking 0.06em, uppercase, color `--ink-mute`.
- New utility: `.italic-flourish` — Fraunces italic, same size as surrounding text. Use sparingly on **names**, **dates**, and **relationship words** ("her sister Jane", "the *summer* of 1962"). One per heading max.

### 1.2 Per-component changes

For each existing component, here's the literal diff to make. File paths assume your Next.js + Tailwind structure.

**`components/MemoryCard.tsx`**
- Surface: `bg-white` → `bg-[--surface]`, add `border border-[--rule]`, drop any existing `shadow-*`.
- Eyebrow tag (the relationship/era label): wrap in `<span class="font-mono text-[12px] tracking-[0.06em] uppercase text-[--ink-mute]">`.
- Title: Fraunces, `text-[28px] leading-[1.2] font-medium`. If the title contains a quoted phrase, render the quote in `italic`.
- Byline ("recorded by Mom · 12 min"): DM Sans 14, `text-[--ink-soft]`. The "by Mom" portion is `italic` Fraunces — that's the flourish.
- Hover: `hover:border-[--gold]` only. No translate, no shadow lift. The aesthetic is library-quiet.

**`components/PersonChip.tsx`**
- Avatar: 40px circle, `border border-[--rule]`. No ring on hover.
- Name: DM Sans 15 medium. **Relationship line** below: Fraunces italic 13, `text-[--ink-soft]` ("her grandmother", "your uncle").

**`app/page.tsx` (Home) — deferred from Phase 1.**
Home was not part of the shipped Phase 1 restyle. The page exists as a placeholder. **See Phase 2.5 below for the full build spec.** Phase 1's tokens and utilities are prerequisites, and they're done.

**`app/tree/page.tsx`**
- Background `bg-[--canvas]`, no other change to the `@xyflow/react` graph itself.
- Person nodes get the new card treatment from `screens/tree.jsx`: cream surface, hairline border, name in Fraunces, dates in DM Mono small.
- Connection lines: `stroke="#E0D2BB"`, `strokeWidth={1}`. Hairline, not bold.

**`app/person/[id]/page.tsx`**
- Header: name as Fraunces 64px, dates underneath in DM Mono ("1934 — 2019"), em-dash not hyphen.
- Bio paragraph: DM Sans 19/1.55, max-width 60ch.
- Memory list reuses `MemoryCard` from above.

**Top nav / toolbar:** no changes this phase. (The TODOs file flags a redesign — defer.)

**Home (`app/page.tsx`):** deferred — see Phase 2.5.

### 1.3 What to QA before shipping phase 1

1. Diff old vs new on home, tree, a person page, a single memory card. Screenshots in the PR.
2. Lighthouse contrast pass on the new ink colors against `--canvas`. The ink is intentionally warm-dark; if any state fails AA, bump `--ink-soft` toward `#4A4030`.
3. Print preview on the person page — the editorial type should hold up on paper. (This is preview for phase 3's PDF export.)

---

## Phase 2 — Memory detail route (target: 1 week)

**Goal:** memories become first-class, linkable artifacts with a real reading experience, and recording produces a live transcript word-by-word. This is the single biggest emotional unlock in the app.

> **Heads-up for the implementer:** §2.7 (live Whisper transcription) is the riskiest part of this phase. Read it first. Plan to spend roughly half of phase 2's calendar time on the audio pipeline alone — if that's not in your estimate, the estimate is wrong.

The reference screen is `screens/memory.jsx` in this project. Open it.

### 2.1 New route

`app/memory/[id]/page.tsx` — replaces the current `MemoryModal` for direct linking. The modal can stay as a quick-peek; the route is for sharing, embedding, and the eventual PDF export.

URL contract: `/memory/<memoryId>` — server-rendered, OG tags include the title and the first sentence of the transcript so links unfurl nicely in Messages and email.

### 2.2 Data model additions

Extend the existing `memories` table:

```ts
// prisma/schema.prisma additions
model Memory {
  // ... existing fields
  transcript      String?   @db.Text   // markdown, speaker-tagged
  transcriptDraft String?   @db.Text   // unsaved edits, autosaved
  durationSec     Int?
  recordedAt      DateTime?            // distinct from createdAt — when the event in the story happened, fuzzy ok
  recordedAtNote  String?              // "summer 1962", when exact date is unknown
}

model MemoryComment {
  id         String   @id @default(cuid())
  memoryId   String
  authorId   String
  body       String   @db.Text
  createdAt  DateTime @default(now())
  memory     Memory   @relation(fields: [memoryId], references: [id], onDelete: Cascade)
  author     User     @relation(fields: [authorId], references: [id])
  @@index([memoryId, createdAt])
}

model MemoryPerson {
  memoryId String
  personId String
  // role within this story — "subject", "mentioned", "narrator"
  role     String
  memory   Memory @relation(fields: [memoryId], references: [id], onDelete: Cascade)
  person   Person @relation(fields: [personId], references: [id], onDelete: Cascade)
  @@id([memoryId, personId])
}
```

Migrations: additive, no data loss. Backfill `durationSec` from existing audio metadata where present; leave null otherwise.

### 2.3 Page composition

Top to bottom (this matches `screens/memory.jsx`):

1. **Eyebrow** — "RECORDED BY <RecorderName> · <RelativeDate>". Mono caps.
2. **Title** — Fraunces 56–72, max two lines, italic flourish on the most evocative phrase. Editable inline by the recording's author and family admins.
3. **Audio player band** — full-width strip, `bg-[--accent-soft]`, 96px tall. Custom controls: play/pause, scrub bar, time, 1x/1.5x/2x. **No native `<audio>` chrome.** Player state is local; do not persist position to the URL — persist to `localStorage` keyed by memory id (matches our design convention for media playback).
4. **People in this memory** — horizontal row of 4–8 `PersonChip` components. Clicking navigates to that person's page with `?from=memory/<id>` so we can offer a back-link.
5. **Two-column reading area:**
   - Left, 60ch: the transcript. Speaker turns separated by 1.5em vertical space. Speaker name in Fraunces italic at the start of each turn. Timestamps in DM Mono 11, `text-[--ink-mute]`, hung in the left margin (negative margin trick — see mock).
   - Right, 280px: a sticky sidebar with "About this recording" (date, location, equipment, any notes), then "Comments" (phase 2 ships with comments).
6. **Comments** — DM Sans body, threaded one level deep. Reply only to top-level. Italic byline. Soft-delete (display "comment removed" placeholder so the thread reads coherently).

### 2.4 Editing

- Title and transcript are editable in-place by the author. Use a simple `contenteditable` with debounced autosave to `transcriptDraft`. Promote draft → `transcript` on blur after 2s of idle.
- Tagging people: typing `@` in the transcript opens a person picker scoped to the current family tree. Insert as `@[Eleanor Marcaccio](person:abc123)` — markdown link with a custom protocol our renderer understands.
- **Live Whisper transcription is part of phase 2.** See §2.7 for the full audio pipeline spec. Mention auto-detection is still deferred — `@` mentions are manual.

### 2.5 Permissions

- Read: any member of the family tree the memory belongs to.
- Edit transcript / title: author + family admins.
- Delete: author + family admins. Soft-delete only (set `deletedAt`); show as "removed by family" in lists.
- Comment: any tree member. Edit own comment within 15 minutes; after that, immutable.

### 2.6 What to QA before shipping phase 2

1. Direct link to `/memory/<id>` works for logged-out users with a sign-in wall — not a blank screen.
2. Transcript autosave survives a connection drop (replay in DevTools throttling).
3. Mobile reading: transcript collapses to single column under 720px. Audio player band stays sticky to the top while reading on mobile.
4. Comments respect family-tree membership — write a test that fails closed.
5. Live transcript QA — see §2.7.7.

### 2.7 Audio pipeline — live Whisper transcription

The defining moment for this app is "phone down on the table with Grandma." The transcript should appear word-by-word as she speaks, so the recorder can see it's working without breaking eye contact. Target: first word visible within 2 seconds of utterance, full transcript ready within 5 seconds of stop.

#### 2.7.1 Architecture

Three layers, each independently deployable:

1. **Client capture** — `MediaRecorder` in 1-second chunks, `audio/webm;codecs=opus` (fallback `audio/mp4` on iOS Safari < 17). Chunks streamed via WebSocket to our edge worker as they're produced.
2. **Edge worker** — receives chunks, buffers a rolling 30-second window, forwards to OpenAI's `gpt-4o-mini-transcribe` streaming endpoint (NOT `whisper-1` — that's batch only and won't hit our latency target). Streams partial transcripts back to the client over the same socket.
3. **Finalizer** — when the client signals "stop", the worker uploads the full audio blob to S3, kicks a background job that runs `whisper-1` on the complete file for a higher-accuracy final transcript, and replaces the streamed transcript when done. Diff is shown to the recorder for review.

The two-pass approach (fast streaming for UX + slow batch for fidelity) is the standard pattern for this. Don't try to make one model do both jobs.

#### 2.7.2 Endpoints

```
POST /api/recordings/start
  → { recordingId, uploadUrl, wsUrl }
  Creates a draft Memory in pending state. Returns S3 presigned URL for final upload
  and a short-lived (15min) WebSocket ticket for the streaming endpoint.

WS   /ws/transcribe?ticket=<jwt>
  Client → server:  binary audio chunks (Opus, 1s each)
  Client → server:  { type: "stop" } when done
  Server → client:  { type: "partial", text: "...", chunkId: N }
  Server → client:  { type: "committed", text: "...", upTo: N }   // settled, won't change
  Server → client:  { type: "final", transcript: "..." }          // after batch pass
  Server → client:  { type: "error", code, message }

POST /api/recordings/:id/finalize
  Body: { durationSec, recordedAt?, recordedAtNote? }
  Promotes draft Memory → published. Idempotent.
```

#### 2.7.3 Streaming UX rules

- Render two zones: **committed** (settled words, full ink color) and **partial** (the trailing few words being revised, `--ink-mute` color). Whisper's streaming API revises the tail; never animate or flash the committed text.
- Speaker turns are detected client-side from a 1.2s silence gap. Don't try to do server-side diarization in v1 — it's unreliable on consumer mics.
- If the WS drops mid-recording: keep recording locally, queue chunks, reconnect with exponential backoff (1s, 2s, 4s, max 8s). Show a small "reconnecting" pill in the UI but **never stop the local recording**. The full audio file is the source of truth — even with zero streamed text, the batch pass at the end will recover.
- Show a live RMS meter on the record button so the user knows the mic is hot. Use `AnalyserNode` over the MediaRecorder stream (not a separate `getUserMedia` — that doubles CPU on mobile).

#### 2.7.4 Costs and rate limiting

At our scale, ballpark per-recording cost:
- `gpt-4o-mini-transcribe` streaming: ~$0.003/min
- `whisper-1` batch finalizer: ~$0.006/min
- S3 storage + egress: trivial

Average memory ≈ 8 minutes → ~$0.07/recording all-in. Budget for 10x growth before optimizing.

Rate limits:
- Per user: 60 minutes of streaming transcription per day. Beyond that, finish recording locally; transcribe via batch only after upload. Quietly degrade — don't hard-fail.
- Per family tree: 600 minutes/day. (Realistically, never hit.)

#### 2.7.5 Storage

```ts
// Add to Memory:
model Memory {
  // ...
  audioUrl          String?  // S3 path, opus original
  audioMp3Url       String?  // transcoded for browsers that can't play opus
  transcriptStatus  String   @default("pending")  // pending | streaming | finalizing | ready | failed
  transcriptModel   String?  // "gpt-4o-mini-transcribe+whisper-1" — useful for reprocessing later
}
```

Keep both opus (small, our canonical) and mp3 (compatibility). Transcode in the finalizer job; cheap and the second URL unblocks every Safari version we still support.

#### 2.7.6 Privacy

- The streaming endpoint MUST set `prompt: "<no prior context>"` on each call. Do not include any prior memory text as context to Whisper — leakage risk into other families' transcriptions if anything goes wrong on the OpenAI side.
- Audio is only ever stored in our S3 bucket, scoped to the family tree. Do not let OpenAI retain. Set `Openai-Beta: assistants=v2` headers (or current equivalent) and the `store: false` parameter on the transcription request.
- The privacy policy needs a one-liner: "Recordings are transcribed by OpenAI and not retained by them." Coordinate with whoever owns legal copy.

#### 2.7.7 QA before shipping

1. **Latency:** record a 60-second test clip; first word visible ≤ 2s, final batch transcript ≤ 8s after stop. Measure on a Pixel 6 over LTE, not just on dev wifi.
2. **WS resilience:** kill the network mid-recording for 10 seconds via DevTools. Recording continues, chunks queue, reconnect happens, transcript catches up.
3. **iOS Safari:** test on iOS 16 and 17. The mp4 fallback path is the riskiest part of the client.
4. **Background tabs:** if the user switches tabs mid-recording, the MediaRecorder must keep running. (It will, but verify on iOS where Safari throttles aggressively.)
5. **Cost ceiling:** instrument per-recording cost in the finalizer log. Alert if any single recording exceeds $0.50 — almost certainly a runaway loop.
6. **Failure mode:** with `OPENAI_API_KEY` removed, the recording still saves with `transcriptStatus: "failed"` and a banner offers manual entry. Whisper is a feature, not a dependency.

#### 2.7.8 What ships in phase 2 vs later

**Ships in phase 2:**
- Live streaming transcription with two-pass finalizer
- Speaker-turn segmentation by silence gap
- Manual editing of the resulting transcript
- Failure fallback to manual entry

**Defers to a later phase:**
- Speaker diarization (who said what across multiple voices) — wait for a model that can do it well on consumer audio
- Translation / non-English transcription — Whisper handles it but the UX needs language detection and fallback flows
- "Smart summary" of long recordings — defer until usage shows demand

---

## Phase 2.5 — Home page (target: 3–5 days)

**Goal:** build the Home surface from scratch. Phase 1's tokens, type, and component restyles are shipped; Phase 2's `/memory/[id]` route exists. Home is the missing connector — the surface that orients the user, surfaces recent activity, and routes them into recording or reading.

**Status of the route today:** `app/page.tsx` is a placeholder. This phase replaces it.

**Why now:** every other surface assumes a Home that points to it. Without this, the app has no front door — users land on whatever was last open or on the auth callback. The Sunday prompt feature (Phase 3) also needs a card slot here to live in, so this must ship first.

The visual reference is `screens/home.jsx` (desktop) and the `MobileHome` artboard in the same file (mobile). Read that file alongside this section; it is the visual spec.

### 2.5.1 Page composition (desktop)

Top to bottom, inside the existing app shell:

1. **Greeting hero** (no card surface, no border — sits directly on `--canvas`):
   - Eyebrow: `<weekday> · <day> <month> <year> · <h:mm am/pm>` in DM Mono caps. Compute server-side from the request's resolved timezone; do not hydrate from `new Date()` on the client (avoids a flash of the wrong day at midnight rollover).
   - Headline: Fraunces 56–72px, weight 400, line-height 1.04, tracking -0.025em, two lines max. Structure: `Good morning, <FirstName>. <Subject> hasn't been heard from in <N days>.` See §2.5.2 for how to compute the subject and the days number.
   - Action row: three buttons in a flex row, 12px gap. **Record a story** (primary, mic icon, links to the Phase 2 recording flow), **Add a photo** (ghost, photo icon), **Ask <subject> a question →** (quiet/text-only, no icon, links to the Phase 2 "Tell me about" flow scoped to that person). The third button's label uses the same subject name as the headline.

2. **Sunday prompt card** (only renders if today's prompt exists — Phase 3 backs this with real data; for 2.5, hardcode one prompt so the slot is real):
   - Surface: `bg-[--accent-soft]` with a soft top-down gradient to transparent, 28px padding, hairline border.
   - Eyebrow in `--accent` color: `PROMPT FOR TODAY`.
   - Question: Fraunces 28px, italic flourish on the most evocative phrase (in the mock: *"childhood kitchen"*), wrapped in proper smart quotes.
   - Helper line below in `--ink-soft`, 14px: "One question, every Sunday. Three minutes of audio is plenty."
   - **Begin** button on the right (accent fill, mic icon).

3. **Recently told** section:
   - Section header: Fraunces italic 28px "Recently told" + a hairline rule that fills remaining width + a DM Mono caps label "THIS WEEK" on the right. The rule is a separator, not a border on either heading.
   - Rows: render `StoryRow` from the mock — 64px thumbnail, kind eyebrow + duration, title, byline (`<Italic>by</Italic> · era·place`), waveform (audio only), relative when, kebab menu. Hover: border tint to `--gold`, no shadow lift. Click anywhere on the row navigates to `/memory/[id]` (the Phase 2 route).
   - Limit: 4–6 rows. Below that, a quiet text link "See all <N> memories →" that goes to `/memories`.

4. **Sidebar (right column, desktop only — hidden under `lg`):**
   - **Family contributors** card: eyebrow "FAMILY · N CONTRIBUTORS", a wrapped row of 40px avatars (overflow renders as a `+N` chip in the same shape), then a 2-line summary in body copy with two italic name flourishes ("*Eleanor* contributed 23 memories. *Michael* uploaded 47 photos last month."). Pull the top two contributors from the last 30 days.
   - **Coming up** card: eyebrow "COMING UP", then 3 rows. Each row: a fixed 76px DM Mono caps date column in `--accent`, then a title + subtitle. Sources: upcoming birthdays/anniversaries derived from `Person` dates (compute server-side; show next 90 days). Calendar integration and family events are out of scope — if there are fewer than 3 derivable rows, show 1–2 and let the card breathe.
   - **The archive · at a glance** card: eyebrow, then a 2×2 grid of stats. Each stat is Fraunces 32px number + DM Mono caps label below. The four stats: total memories, total people, total audio duration (humanized — "14h", "3h 20m"), earliest year on record (the smallest `birthYear` or `Memory.recordedAt` year across the tree).

Page layout: 1.6fr / 1fr two-column grid at desktop, 40px gap, 40px page padding. Stacks at `lg` and below; sidebar disappears below `768px` (see §2.5.4).

### 2.5.2 Greeting logic

The headline is the most opinionated thing on the page. Spec:

- **First name:** the logged-in user's preferred display name. Fall back to email-local-part if unset.
- **Time-of-day greeting:** `Good morning` (before 12pm), `Good afternoon` (12–5pm), `Good evening` (5pm–4am), `Up early` (4–6am). All times in user's local timezone.
- **Subject** (the italic name in the headline): the *eldest living relative in the user's tree who has not contributed a memory in the longest stretch*. Tiebreak by closeness in the tree (parents/grandparents first). Use their relationship-name to the viewer ("Grandma", "Dad", "Aunt Rosa") — not their given name — pulled from `Person.relationshipLabel` if present, else the given name. If the user is the eldest in the tree or no living relatives have been quiet > 7 days, the subject becomes "the family" and the second clause becomes "have new stories to tell — *N* this week."
- **N days:** `floor((now - lastContributionAt) / 1d)` for that subject. Floor so "17 days" doesn't tick to "18 days" mid-page.

Edge cases:
- New user, empty tree: skip the second clause entirely. Headline reads `Good morning, <name>. Let's start with one story.` and the primary CTA changes to "Add your first person" (links to `/tree?add=1`).
- Subject contributed today: skip the headline subject and render `Good morning, <name>. Anything to add today?`
- Unknown timezone: default to the user's account timezone, then to UTC. Never throw.

Treat this whole computation as one server-side function — `getHomeGreeting(userId)` returning `{ eyebrow, greeting, subjectLabel, subjectPersonId, daysSilent, ctas }` — and pass it as a single prop. Do not let the markup compute it inline. The `subjectPersonId` lets the "Ask <subject> a question" CTA route into the Phase 2 "Tell me about" flow without a second lookup.

### 2.5.3 Data shape

Build one server query that hydrates the page. Sketch:

```ts
type HomeData = {
  greeting: {
    eyebrow: string;          // "Sunday · 03 May 2026 · 9:42 am"
    salutation: string;       // "Good morning, Jamie."
    subject: string | null;   // "Grandma" | null when empty-tree path
    subjectPersonId: string | null;
    daysSilent: number | null;
    ctas: Array<{ id: 'record' | 'photo' | 'ask'; label: string; href: string }>;
  };
  prompt: { id: string; question: string; helper: string } | null;
  recentMemories: Array<{
    id: string;
    title: string;
    kind: 'audio' | 'video' | 'photo' | 'doc';
    durationLabel: string;    // "4:18" | "12 photos" | "3 pages"
    byName: string;           // "Eleanor M."
    era: string;              // "1947 · Brooklyn"
    when: string;             // "Yesterday" | "Wed" — pre-formatted server-side
    waveformPeaks?: number[]; // audio only, 28 normalized peaks 0–1
  }>;
  contributors: {
    total: number;
    avatars: Array<{ id: string; initials: string; imageUrl?: string }>;
    summary: { topName: string; topCount: number; secondName: string; secondCount: number };
  };
  upcoming: Array<{ when: string; what: string; sub: string }>;
  archive: { memories: number; people: number; audioHumanized: string; earliestYear: number };
};
```

Fetch in a single `loader`/`getServerSideProps`/equivalent — do not waterfall. The mobile variant uses a subset of this same payload (greeting + recentMemories + prompt only).

### 2.5.4 Components to create

- `components/home/GreetingHero.tsx`
- `components/home/SundayPromptCard.tsx` (export the inner shell separately so Phase 3 can reuse it on `/prompts/[id]`)
- `components/home/StoryRow.tsx` (note: this is the home variant — distinct from `MemoryCard`. Don't try to unify them; they have different information density and hover affordances.)
- `components/home/ContributorsCard.tsx`
- `components/home/UpcomingCard.tsx`
- `components/home/ArchiveStatsCard.tsx`

Keep each file under 150 lines. Compose them in `app/page.tsx`; that file should read like a document outline.

### 2.5.5 Mobile Home

Reference: the `MobileHome` artboard in `screens/home.jsx`.

- Below `768px`: hide the contributors / upcoming / archive sidebar entirely. Those move to a separate `/family` route in a later phase.
- Greeting hero shrinks to 36–44px headline, single line if it fits, two if not. Eyebrow stays full-size.
- The action row becomes a 2×2 grid: Record (primary, full-width tall), Add photo, Ask, and a fourth quiet "Today's prompt →" tile that scrolls to the prompt card.
- Story rows lose the waveform on the right (audio rows still show the play affordance on the thumbnail). Tap target ≥ 64px tall.
- Sticky bottom-anchored Record button appears once the user scrolls past the hero — same primary style, mic icon, 56px tall, safe-area inset respected.

### 2.5.6 What to QA before shipping phase 2.5

1. SSR: view-source shows the greeting and recent memories — no client-side flash.
2. Greeting: empty-tree, all-quiet, subject-contributed-today, and Tokyo-timezone cases all render the right copy. Snapshot tests for each.
3. The "Ask Grandma a question →" CTA actually opens the Phase 2 "Tell me about" flow scoped to the right person.
4. Story rows route to `/memory/[id]` (the Phase 2 route) and back-link works.
5. Mobile sticky record button respects iOS safe-area insets and doesn't overlap the last story row at scroll-bottom.
6. Lighthouse: TTFB < 400ms on Home with 200 memories seeded.

---

## Phase 3 — Sunday prompt (target: 3–4 days)

**Goal:** a weekly question, surfaced on home, that drives recording between holidays. This is the retention feature.

### 3.1 The mechanic

Every Sunday at 8am local-to-each-user, one prompt becomes "the prompt of the week". It appears:
- On home, as a hero card under the welcome line.
- In a transactional email to opted-in users (one email per week max).

A user can "answer" a prompt by recording a memory while the prompt is active. The memory gets `Memory.promptId` set; the prompt page shows everyone's answers.

When the next Sunday rolls over, this week's prompt moves to the archive at `/prompts`. Past prompts remain answerable forever — they just leave the home rail.

### 3.2 Data model

```ts
model Prompt {
  id           String    @id @default(cuid())
  question     String    @db.Text          // the prompt itself, Fraunces italic ready
  hint         String?   @db.Text          // optional: "think about a smell, a sound, a song"
  category     String                       // "childhood" | "love" | "work" | "place" | "lesson" | "everyday"
  weekOf       DateTime?                    // Sunday this prompt is featured (null = unscheduled)
  createdAt    DateTime  @default(now())
  memories     Memory[]
  @@index([weekOf])
}

// Memory gets:
model Memory {
  // ...
  promptId String?
  prompt   Prompt? @relation(fields: [promptId], references: [id])
}
```

Seed ~52 prompts at launch so the first year is covered. I've drafted a starter set — see `handoff/prompts-seed.md`. Tone is conversational and specific: not "tell me about your childhood" but "what did the kitchen smell like on Sunday mornings when you were small?"

### 3.3 Surfaces

**Home card** (`app/page.tsx`):
- Surface `bg-[--accent-soft]`, hairline border, generous padding (40px).
- Eyebrow: "THIS SUNDAY · WEEK OF <date>".
- Question in Fraunces italic, 32px, max 18 words. The italic *is* the visual cue that it's a prompt.
- Two CTAs: "Record an answer" (primary) and "Skip this week" (text-only, dismisses the card for this week, persists per-user).
- If the user already answered: the card flips to "You answered on <date> ↗" linking to their memory.

**Prompt detail** (`/prompts/[id]`):
- Same shape as the memory page (consistent reading experience).
- Question hero, then a grid of memories that answered it, sorted newest first. Each card shows the recorder's name and a 1-line transcript excerpt.

**Archive** (`/prompts`):
- A simple list. Each row: week, question, count of answers from your family. Italic Fraunces questions hung against a light cream background.

### 3.4 Scheduling

This is the one piece of phase 3 that has any real complexity.

- A Sunday cron at 00:00 UTC promotes the next un-promoted prompt by setting its `weekOf` to the upcoming Sunday in UTC. The "active" prompt is whichever has the most recent past `weekOf`.
- "Sunday at 8am local" is a rendering concern, not a scheduling concern: the prompt is technically active all week, but the email goes out at 8am in the user's local timezone via per-user scheduling.
- Manual override: an admin route `/admin/prompts` lets us pin a specific prompt to a specific week. Useful for holidays ("what's a Thanksgiving you'll never forget?").

### 3.5 Email

Use the existing transactional email setup. One template, plain typography (Fraunces is loaded as a webfont in the email; fall back to Georgia). Subject: "*<question>*" — italic in subject would be ideal but most clients strip it; settle for the bare question with no prefix. Pre-header: "A new question from Folio."

Opt-in only. Setting lives in `/settings/notifications`. Default: off. We earn the inbox.

### 3.6 What to QA before shipping phase 3

1. Sunday rollover happens once per week, idempotently. Run the cron twice in a row and verify no double-promotion.
2. Timezone handling: a user in Tokyo gets the email at 8am JST, not 8am UTC.
3. "Skip this week" persists for that user only and resets the next Sunday.
4. Prompt archive paginates correctly past 50 prompts.

---

## Cross-cutting notes

### Accessibility

- All Fraunces display sizes ≥ 28px must remain 400+ weight. Going lighter at large sizes hurts low-vision users disproportionately.
- Italic flourishes never carry meaning alone. The relationship word is *also* in the markup as a relationship attribute; italic is decoration.
- Audio player must have keyboard controls (space = play/pause, ← → = scrub 5s).
- Transcript must be selectable text, not images. (Obvious, but: no canvas rendering.)

### Performance

- The home page should still SSR with a TTFB under 400ms. The Sunday prompt is a cheap join; don't fetch the answers list inline (lazy on prompt detail).
- Audio loads on play, not on page load. Show duration up-front from `Memory.durationSec`.

### What is NOT in this handoff

Defer until usage data justifies them:

- Mention auto-detection in transcripts. LLM cost; manual `@` works fine.
- Tree visualization upgrade to the Folio hairline aesthetic (the current `@xyflow/react` look is acceptable post-phase-1).
- PDF export of memories and people. Lock-in feature; matters at 50+ memories per family.
- Dark mode / Vellum / Dusk directions. One direction, executed well.
- Onboarding redesign. Instrument the existing flow first.
- Toolbar redesign. Wait until after the activity feed lands.

### Definition of done, per phase

- **Phase 1:** PR merged, screenshots in the PR, no flow changes, Lighthouse contrast clean.
- **Phase 2:** `/memory/[id]` route live, live Whisper transcription with two-pass finalizer working end-to-end on iOS + Android + desktop, transcripts editable, comments working, audio player keyboard-accessible. Two real families using it for at least a week before phase 3 starts.
- **Phase 3:** Sunday cron running idempotently, 52 prompts seeded, email opt-in shipping at 8am local. First Sunday-of-launch QA in production.

---

## File map for Claude Code

When Claude Code opens this project, point it at:

- `handoff/CLAUDE.md` — this file
- `handoff/tokens.css` — drop-in CSS variables for phase 1
- `handoff/prompts-seed.md` — 52 starter prompts for phase 3
- `Family History — Folio.html` — visual reference (open in a browser; pan the canvas)
- `screens/*.jsx` — per-screen JSX, treat as design-spec source

The mock uses inline-style React for fidelity. **Do not port these components verbatim** — re-implement against your existing component library and Tailwind classes. The mock's job is to fix the visual target; your job is to make it native to the codebase.

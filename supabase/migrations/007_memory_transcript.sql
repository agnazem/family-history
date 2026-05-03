-- ============================================================
-- 007_memory_transcript.sql — Phase 2: Memory detail route
-- ============================================================

-- 1. Transcript fields on memories
alter table public.memories
  add column transcript        text,
  add column transcript_draft  text,
  add column duration_sec      integer,
  add column recorded_at       date,
  add column recorded_at_note  text,
  add column transcript_status text not null default 'none'
    check (transcript_status in ('none', 'pending', 'streaming', 'finalizing', 'ready', 'failed')),
  add column audio_mp3_url     text;

create index on public.memories (transcript_status);

-- 2. Role field on memory_people
alter table public.memory_people
  add column role text not null default 'subject'
    check (role in ('subject', 'mentioned', 'narrator'));

-- 3. Parent threading on comments (one level deep)
alter table public.comments
  add column parent_id uuid references public.comments(id) on delete cascade;

create index on public.comments (parent_id);

-- 4. RPC: atomically append a transcript chunk
--    Called by /api/recordings/[id]/chunk after each Whisper result.
create or replace function public.append_transcript_chunk(
  p_memory_id uuid,
  p_text      text
)
returns void
language plpgsql
security definer
as $$
begin
  update public.memories
  set transcript = case
        when coalesce(transcript, '') = '' then p_text
        else transcript || ' ' || p_text
      end
  where id = p_memory_id;
end;
$$;

-- 5. Enable realtime on memories so clients can watch live transcript updates
-- (memories already added in 004; this is a no-op if already present)
do $$ begin
  alter publication supabase_realtime add table public.memories;
exception when others then null;
end $$;

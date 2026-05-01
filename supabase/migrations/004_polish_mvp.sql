-- ============================================================
-- 004_polish_mvp.sql  —  Sprint: Polish & Ship MVP
-- ============================================================

-- 1. date_of_memory on memories
--    Nullable — no backfill. Existing rows show null; timeline treats
--    null as "unknown date" and sorts them last.
alter table public.memories add column date_of_memory date;
create index on public.memories (date_of_memory);

-- 2. display_name on family_members
--    Required for activity feed: auth.users is RLS-blocked on the client,
--    so we store the name the user chooses for this family here.
alter table public.family_members add column display_name text;

-- ============================================================
-- 3. comments table
-- ============================================================

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  memory_id  uuid not null references public.memories(id) on delete cascade,
  family_id  uuid not null references public.families(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  text       text not null check (char_length(text) <= 1000),
  created_at timestamptz default now()
);

create index on public.comments (memory_id);
create index on public.comments (family_id);

alter table public.comments enable row level security;

create policy "members can read comments" on public.comments
  for select using (public.is_family_member(family_id));

create policy "members can insert comments" on public.comments
  for insert with check (
    public.is_family_member(family_id) and user_id = auth.uid()
  );

-- ============================================================
-- 4. Memory RLS: add missing UPDATE policy + expand DELETE to admins
-- ============================================================

-- UPDATE was entirely missing from the initial schema — memory edits
-- would silently fail without this policy.
create policy "recorder or admin can update memory" on public.memories
  for update using (
    recorded_by = auth.uid() or public.is_family_admin(family_id)
  );

-- Replace narrow recorder-only delete with recorder-or-admin.
drop policy if exists "recorder can delete memory" on public.memories;
create policy "recorder or admin can delete memory" on public.memories
  for delete using (
    recorded_by = auth.uid() or public.is_family_admin(family_id)
  );

-- ============================================================
-- 5. memory_people RLS: expand DELETE to allow admin
-- ============================================================

drop policy if exists "recorder can delete memory_people" on public.memory_people;
create policy "recorder or admin can delete memory_people" on public.memory_people
  for delete using (
    exists (
      select 1 from public.memories m
      where m.id = memory_id
        and (m.recorded_by = auth.uid() or public.is_family_admin(m.family_id))
    )
  );

-- ============================================================
-- 6. Enable realtime on memories and comments
-- ============================================================

alter publication supabase_realtime add table public.memories;
alter publication supabase_realtime add table public.comments;

-- ============================================================
-- 7. RPC: atomic memory creation
--    Wraps memories + memory_people inserts in one transaction so a
--    partial failure (e.g. network drop mid-request) can't leave an
--    orphan memory with no tagged people.
-- ============================================================

create or replace function public.create_memory_with_people(
  p_family_id      uuid,
  p_type           text,
  p_title          text,
  p_description    text,
  p_storage_url    text,
  p_recorded_by    uuid,
  p_date_of_memory date,
  p_person_ids     uuid[]
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_memory_id uuid;
begin
  insert into public.memories (
    family_id, type, title, description, storage_url, recorded_by, date_of_memory
  )
  values (
    p_family_id, p_type, p_title, p_description, p_storage_url, p_recorded_by, p_date_of_memory
  )
  returning id into v_memory_id;

  insert into public.memory_people (memory_id, person_id, family_id)
  select v_memory_id, unnest(p_person_ids), p_family_id;

  return v_memory_id;
end;
$$;

-- ============================================================
-- 8. Storage: tighten write policies to family members only
--    Previous policies allowed any authenticated user to write to any
--    path. These replacements verify the path's family_id segment maps
--    to a family the caller actually belongs to.
--
--    Path conventions:
--      photos:    profiles/{family_id}/{person_id}/...   (profile photos)
--                 {family_id}/{person_id}/...            (memory photos)
--      audio:     {family_id}/{person_id}/...
--      artifacts: {family_id}/{person_id}/...
-- ============================================================

drop policy if exists "auth write photos" on storage.objects;
create policy "family member write photos" on storage.objects
  for insert with check (
    bucket_id = 'photos'
    and auth.role() = 'authenticated'
    and public.is_family_member(
      case
        when split_part(name, '/', 1) = 'profiles'
          then split_part(name, '/', 2)::uuid
        else split_part(name, '/', 1)::uuid
      end
    )
  );

drop policy if exists "auth write audio" on storage.objects;
create policy "family member write audio" on storage.objects
  for insert with check (
    bucket_id = 'audio'
    and auth.role() = 'authenticated'
    and public.is_family_member(split_part(name, '/', 1)::uuid)
  );

drop policy if exists "auth write artifacts" on storage.objects;
create policy "family member write artifacts" on storage.objects
  for insert with check (
    bucket_id = 'artifacts'
    and auth.role() = 'authenticated'
    and public.is_family_member(split_part(name, '/', 1)::uuid)
  );

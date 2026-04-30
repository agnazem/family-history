-- Many-to-many: one artifact can be tagged to multiple family members
create table public.memory_people (
  id         uuid primary key default gen_random_uuid(),
  memory_id  uuid not null references public.memories(id) on delete cascade,
  person_id  uuid not null references public.people(id) on delete cascade,
  family_id  uuid not null references public.families(id) on delete cascade,
  unique (memory_id, person_id)
);

create index on public.memory_people (person_id);
create index on public.memory_people (memory_id);
create index on public.memory_people (family_id);

alter table public.memory_people enable row level security;

create policy "members can read memory_people" on public.memory_people
  for select using (public.is_family_member(family_id));
create policy "members can insert memory_people" on public.memory_people
  for insert with check (public.is_family_member(family_id));
create policy "recorder can delete memory_people" on public.memory_people
  for delete using (
    exists (
      select 1 from public.memories m
      where m.id = memory_id and m.recorded_by = auth.uid()
    )
  );

-- Backfill existing memories into memory_people
insert into public.memory_people (memory_id, person_id, family_id)
select id, person_id, family_id from public.memories;

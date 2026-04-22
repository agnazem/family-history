-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

create table public.families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

create table public.family_members (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'member' check (role in ('admin', 'member')),
  joined_at   timestamptz default now(),
  unique (family_id, user_id)
);

create table public.people (
  id                  uuid primary key default gen_random_uuid(),
  family_id           uuid not null references public.families(id) on delete cascade,
  first_name          text not null,
  last_name           text not null,
  dob                 date,
  dod                 date,
  bio                 text,
  profile_photo_url   text,
  canvas_x            float not null default 200,
  canvas_y            float not null default 200,
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz default now()
);

create table public.relationships (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  person_a_id uuid not null references public.people(id) on delete cascade,
  person_b_id uuid not null references public.people(id) on delete cascade,
  type        text not null check (type in ('parent_child', 'spouse', 'sibling')),
  unique (person_a_id, person_b_id, type)
);

create table public.memories (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null references public.people(id) on delete cascade,
  family_id   uuid not null references public.families(id) on delete cascade,
  type        text not null check (type in ('audio', 'photo', 'document', 'note')),
  title       text not null,
  description text,
  storage_url text,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  email       text not null,
  token       uuid not null default gen_random_uuid(),
  invited_by  uuid references auth.users(id) on delete set null,
  status      text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at  timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index on public.family_members (user_id);
create index on public.people (family_id);
create index on public.relationships (family_id);
create index on public.memories (person_id);
create index on public.memories (family_id);

-- ============================================================
-- ENABLE REALTIME
-- ============================================================

alter publication supabase_realtime add table public.people;
alter publication supabase_realtime add table public.relationships;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.people enable row level security;
alter table public.relationships enable row level security;
alter table public.memories enable row level security;
alter table public.invitations enable row level security;

-- Helper: is the current user a member of a given family?
create or replace function public.is_family_member(fid uuid)
returns boolean
language sql security definer
as $$
  select exists (
    select 1 from public.family_members
    where family_id = fid and user_id = auth.uid()
  );
$$;

-- Helper: is the current user an admin of a given family?
create or replace function public.is_family_admin(fid uuid)
returns boolean
language sql security definer
as $$
  select exists (
    select 1 from public.family_members
    where family_id = fid and user_id = auth.uid() and role = 'admin'
  );
$$;

-- families
create policy "members can read family" on public.families
  for select using (public.is_family_member(id));
create policy "creator can insert family" on public.families
  for insert with check (auth.uid() = created_by);

-- family_members
create policy "members can read members" on public.family_members
  for select using (public.is_family_member(family_id));
create policy "user can join family" on public.family_members
  for insert with check (auth.uid() = user_id);

-- people
create policy "members can read people" on public.people
  for select using (public.is_family_member(family_id));
create policy "members can insert people" on public.people
  for insert with check (public.is_family_member(family_id));
create policy "members can update people" on public.people
  for update using (public.is_family_member(family_id));

-- relationships
create policy "members can read relationships" on public.relationships
  for select using (public.is_family_member(family_id));
create policy "members can insert relationships" on public.relationships
  for insert with check (public.is_family_member(family_id));
create policy "members can delete relationships" on public.relationships
  for delete using (public.is_family_member(family_id));

-- memories
create policy "members can read memories" on public.memories
  for select using (public.is_family_member(family_id));
create policy "members can insert memories" on public.memories
  for insert with check (public.is_family_member(family_id));
create policy "recorder can delete memory" on public.memories
  for delete using (recorded_by = auth.uid());

-- invitations
create policy "admins can read invitations" on public.invitations
  for select using (public.is_family_admin(family_id));
create policy "admins can insert invitations" on public.invitations
  for insert with check (public.is_family_admin(family_id));

-- ============================================================
-- STORAGE BUCKETS (run in Supabase dashboard or via CLI)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('profile-photos', 'profile-photos', true);
-- insert into storage.buckets (id, name, public) values ('audio', 'audio', false);
-- insert into storage.buckets (id, name, public) values ('photos', 'photos', false);
-- insert into storage.buckets (id, name, public) values ('artifacts', 'artifacts', false);

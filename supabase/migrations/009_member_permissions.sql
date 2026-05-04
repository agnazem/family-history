-- Add granular permissions to family_members
alter table public.family_members
  add column if not exists can_edit_tree     boolean not null default true,
  add column if not exists can_edit_memories boolean not null default true;

-- Permission requests table
create table if not exists public.permission_requests (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references public.families(id) on delete cascade,
  user_id      uuid not null,
  permission   text not null check (permission in ('can_edit_tree', 'can_edit_memories')),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at   timestamptz not null default now()
);

-- One pending request per user+family+permission at a time
create unique index if not exists permission_requests_pending_unique
  on public.permission_requests (family_id, user_id, permission)
  where status = 'pending';

alter table public.permission_requests enable row level security;

-- Members can read their own requests
create policy "members read own requests"
  on public.permission_requests for select
  using (auth.uid() = user_id);

-- Members can insert their own requests
create policy "members insert own requests"
  on public.permission_requests for insert
  with check (auth.uid() = user_id);

-- Service role (API) manages all updates

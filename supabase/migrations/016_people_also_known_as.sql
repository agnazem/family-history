alter table public.people
  add column also_known_as text[] not null default '{}'::text[];

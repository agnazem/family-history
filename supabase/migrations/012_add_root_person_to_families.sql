-- Allow admins to set the tree root person on their family
alter table public.families
  add column if not exists root_person_id uuid references public.people(id) on delete set null;

create policy "admins can update family" on public.families
  for update using (public.is_family_admin(id));

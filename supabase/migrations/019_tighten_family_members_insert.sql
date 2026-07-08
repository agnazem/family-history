-- Tighten the family_members INSERT policy so only two legitimate paths work:
-- 1. The user just created this family (families.created_by = auth.uid())
-- 2. The user has a pending invitation for this family matching their email
--
-- A SECURITY DEFINER function is needed because at the moment of insert the user
-- is not yet a member, so direct subqueries against families/invitations would be
-- blocked by their own RLS policies.

create or replace function public.can_join_family(fid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return (
    exists (
      select 1 from public.families
      where id = fid and created_by = auth.uid()
    )
    or
    exists (
      select 1 from public.invitations
      where family_id = fid
        and email = (select email from auth.users where id = auth.uid())
        and status = 'pending'
    )
  );
end;
$$;

drop policy if exists "user can join family" on public.family_members;

create policy "user can join family" on public.family_members
  for insert
  with check (
    auth.uid() = user_id
    and can_join_family(family_id)
  );

-- Allow admins to promote / demote members
create policy "admins can update member roles" on public.family_members
  for update using (public.is_family_admin(family_id));

-- Allow admins to remove members (but not themselves)
create policy "admins can remove members" on public.family_members
  for delete using (
    public.is_family_admin(family_id) and user_id != auth.uid()
  );

-- Allow admins to cancel (delete) invitations
create policy "admins can delete invitations" on public.invitations
  for delete using (public.is_family_admin(family_id));

-- Allow an invited user to read their own pending invitation
-- (needed in the auth callback to discover which family to join)
create policy "user can read own invitation" on public.invitations
  for select using (
    email = (select email from auth.users where id = auth.uid())
  );

-- Allow an invited user to mark their invitation as accepted
create policy "user can accept own invitation" on public.invitations
  for update using (
    email = (select email from auth.users where id = auth.uid())
  );

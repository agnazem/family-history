-- Follow-up security fixes to the RLS/storage hardening in migrations 017-020.
-- Forward-only (019/020 are already released): create-or-replace and drop-if-exists,
-- safe to apply regardless of whether 017-020 have been applied yet.

-- ── 1. can_join_family: case-insensitive email match ──────────────────────────
-- GoTrue lowercases auth.users.email, but invitations.email was stored as the admin
-- typed it. Migration 019's exact, case-sensitive compare silently locked out any
-- invitee whose email contained a capital letter (the auto-join in auth/callback
-- was denied and the invite stayed "pending" forever). Compare case-insensitively.
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
        and lower(email) = lower((select email from auth.users where id = auth.uid()))
        and status = 'pending'
    )
  );
end;
$$;

-- ── 2. Pin search_path on the older SECURITY DEFINER helpers ───────────────────
-- is_family_member / is_family_admin (migration 001) were created without an
-- explicit search_path — the standard Supabase "function search_path mutable" lint.
-- Every storage and table RLS policy calls these, so pin it to public. Bodies are
-- otherwise identical to migration 001.
create or replace function public.is_family_member(fid uuid)
returns boolean
language sql security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_members
    where family_id = fid and user_id = auth.uid()
  );
$$;

create or replace function public.is_family_admin(fid uuid)
returns boolean
language sql security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_members
    where family_id = fid and user_id = auth.uid() and role = 'admin'
  );
$$;

-- ── 3. Make the storage DELETE policies idempotent ────────────────────────────
-- Migration 020 created these without drop-if-exists, so re-applying it aborts with
-- "policy already exists". Recreate them idempotently (definitions unchanged from 020).
drop policy if exists "family member delete audio"          on storage.objects;
drop policy if exists "family member delete photos"         on storage.objects;
drop policy if exists "family member delete artifacts"      on storage.objects;
drop policy if exists "family member delete profile photos" on storage.objects;

create policy "family member delete audio" on storage.objects
  for delete using (
    bucket_id = 'audio'
    and auth.role() = 'authenticated'
    and (owner = auth.uid() or public.is_family_admin(split_part(name, '/', 1)::uuid))
  );

create policy "family member delete photos" on storage.objects
  for delete using (
    bucket_id = 'photos'
    and auth.role() = 'authenticated'
    and (
      owner = auth.uid()
      or public.is_family_admin(
        case
          when split_part(name, '/', 1) = 'profiles'
            then split_part(name, '/', 2)::uuid
          else split_part(name, '/', 1)::uuid
        end
      )
    )
  );

create policy "family member delete artifacts" on storage.objects
  for delete using (
    bucket_id = 'artifacts'
    and auth.role() = 'authenticated'
    and (owner = auth.uid() or public.is_family_admin(split_part(name, '/', 1)::uuid))
  );

create policy "family member delete profile photos" on storage.objects
  for delete using (
    bucket_id = 'profile-photos'
    and auth.role() = 'authenticated'
    and (owner = auth.uid() or public.is_family_admin(split_part(name, '/', 1)::uuid))
  );

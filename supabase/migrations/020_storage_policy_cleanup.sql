-- Three fixes:
-- 1. Drop legacy broad read policies that were never removed when migration 015
--    added family-scoped ones — these old policies win under OR evaluation and
--    allow any authenticated user to read any family's private files.
-- 2. Tighten profile-photos INSERT to require family membership (path: {family_id}/...).
-- 3. Add DELETE policies for all buckets so owners and family admins can remove files.

-- ── 1. Drop legacy over-permissive read policies ──────────────────────────────

drop policy if exists "auth read audio"     on storage.objects;
drop policy if exists "auth read photos"    on storage.objects;
drop policy if exists "auth read artifacts" on storage.objects;

-- ── 2. Tighten profile-photos write policy ────────────────────────────────────

drop policy if exists "auth write profile photos" on storage.objects;

create policy "family member write profile photos" on storage.objects
  for insert with check (
    bucket_id = 'profile-photos'
    and auth.role() = 'authenticated'
    and public.is_family_member(split_part(name, '/', 1)::uuid)
  );

-- ── 3. DELETE policies — uploader (owner) or family admin ─────────────────────

create policy "family member delete audio" on storage.objects
  for delete using (
    bucket_id = 'audio'
    and auth.role() = 'authenticated'
    and (
      owner = auth.uid()
      or public.is_family_admin(split_part(name, '/', 1)::uuid)
    )
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
    and (
      owner = auth.uid()
      or public.is_family_admin(split_part(name, '/', 1)::uuid)
    )
  );

create policy "family member delete profile photos" on storage.objects
  for delete using (
    bucket_id = 'profile-photos'
    and auth.role() = 'authenticated'
    and (
      owner = auth.uid()
      or public.is_family_admin(split_part(name, '/', 1)::uuid)
    )
  );

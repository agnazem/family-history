-- Make audio, photos, and artifacts buckets private.
-- profile-photos stays public (profile pictures are intentionally world-readable).
update storage.buckets
  set public = false
  where id in ('audio', 'photos', 'artifacts');

-- Add read (SELECT) policies so authenticated family members can generate signed URLs
-- for files that belong to their family. The path convention is {family_id}/{...},
-- so split_part(name, '/', 1) extracts the family ID from the object name.

-- Audio recordings
create policy "family member read audio" on storage.objects
  for select using (
    bucket_id = 'audio'
    and auth.role() = 'authenticated'
    and public.is_family_member(split_part(name, '/', 1)::uuid)
  );

-- Photos (family photos, profile photo quick-uploads, TellMe audio)
create policy "family member read photos" on storage.objects
  for select using (
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

-- Artifacts / documents
create policy "family member read artifacts" on storage.objects
  for select using (
    bucket_id = 'artifacts'
    and auth.role() = 'authenticated'
    and public.is_family_member(split_part(name, '/', 1)::uuid)
  );

-- Ensure the profile-photos bucket is public so getPublicUrl() URLs actually resolve.
-- Bucket creation was originally manual (dashboard), so the public flag may be unset
-- in some environments, causing 400 errors when next/image fetches those URLs.
insert into storage.buckets (id, name, public)
  values ('profile-photos', 'profile-photos', true)
  on conflict (id) do update set public = true;

-- Allow anyone (including next/image server-side fetches) to read profile photos.
-- This is belt-and-suspenders: when public = true Supabase bypasses RLS for reads,
-- but an explicit policy ensures the intent survives any future bucket flag reset.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'public read profile photos'
  ) then
    execute $policy$
      create policy "public read profile photos" on storage.objects
        for select using (bucket_id = 'profile-photos');
    $policy$;
  end if;
end $$;

-- Run these after creating buckets in the Supabase dashboard

-- profile-photos: public read, authenticated write
create policy "public read profile photos" on storage.objects
  for select using (bucket_id = 'profile-photos');
create policy "auth write profile photos" on storage.objects
  for insert with check (bucket_id = 'profile-photos' and auth.role() = 'authenticated');
create policy "auth update profile photos" on storage.objects
  for update using (bucket_id = 'profile-photos' and auth.uid() = owner);

-- audio: family members only
create policy "auth read audio" on storage.objects
  for select using (bucket_id = 'audio' and auth.role() = 'authenticated');
create policy "auth write audio" on storage.objects
  for insert with check (bucket_id = 'audio' and auth.role() = 'authenticated');

-- photos: family members only
create policy "auth read photos" on storage.objects
  for select using (bucket_id = 'photos' and auth.role() = 'authenticated');
create policy "auth write photos" on storage.objects
  for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');

-- artifacts: family members only
create policy "auth read artifacts" on storage.objects
  for select using (bucket_id = 'artifacts' and auth.role() = 'authenticated');
create policy "auth write artifacts" on storage.objects
  for insert with check (bucket_id = 'artifacts' and auth.role() = 'authenticated');

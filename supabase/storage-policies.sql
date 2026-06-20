-- ============================================================
-- STORAGE BUCKET SETUP & POLICIES
-- Run in Supabase SQL editor after creating the buckets
-- ============================================================

-- Create buckets (run once in dashboard or CLI):
-- supabase storage create notes       --public
-- supabase storage create papers      --public
-- supabase storage create marketplace --private
-- supabase storage create avatars     --public

-- ── notes (public read, authenticated upload via Edge Fn) ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('notes', 'notes', true, 20971520,  -- 20 MB
  array['application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ── papers (public read) ───────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('papers', 'papers', true, 10485760, array['application/pdf'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

-- ── marketplace (PRIVATE — signed URLs only) ──────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marketplace', 'marketplace', false, 5242880,  -- 5 MB
  array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit;

-- ── avatars (public read) ─────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit;


-- ── Storage RLS policies ──────────────────────────────────

-- notes: public read (anyone can download notes — that's the point)
create policy "Notes: public read"
  on storage.objects for select
  using (bucket_id = 'notes');

-- notes: authenticated upload through Edge Function only
-- (Direct client uploads are blocked — must go via upload-file Edge Fn)
create policy "Notes: service role insert"
  on storage.objects for insert
  with check (bucket_id = 'notes' and auth.role() = 'service_role');

-- marketplace: owner read via signed URL (served by Edge Fn)
create policy "Marketplace: service role all"
  on storage.objects for all
  using (bucket_id = 'marketplace' and auth.role() = 'service_role');

-- avatars: public read, own upload
create policy "Avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Avatars: own upload"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Avatars: own delete"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

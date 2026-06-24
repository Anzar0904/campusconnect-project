-- Migration 019: Club Members & Dating Admin Policies
--
-- 1. Create club_members table with RLS.
-- 2. Create storage bucket 'dating-verification' and policies.
-- 3. Add RLS policies for dating_verification_requests and storage to allow admin access.

-- ============================================================
-- 1. Club Members table
-- ============================================================
create table if not exists public.club_members (
  club_id uuid references public.clubs(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

alter table public.club_members enable row level security;

drop policy if exists "Club members: authenticated select" on public.club_members;
create policy "Club members: authenticated select"
  on public.club_members for select using (auth.role() = 'authenticated');

drop policy if exists "Club members: own insert" on public.club_members;
create policy "Club members: own insert"
  on public.club_members for insert with check (auth.uid() = user_id);

drop policy if exists "Club members: own delete" on public.club_members;
create policy "Club members: own delete"
  on public.club_members for delete using (auth.uid() = user_id);

-- ============================================================
-- 2. Storage Bucket for dating-verification
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dating-verification', 'dating-verification', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

drop policy if exists "Dating verification: own upload" on storage.objects;
create policy "Dating verification: own upload"
  on storage.objects for insert
  with check (bucket_id = 'dating-verification' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Dating verification: own select" on storage.objects;
create policy "Dating verification: own select"
  on storage.objects for select
  using (bucket_id = 'dating-verification' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Dating verification: admin select" on storage.objects;
create policy "Dating verification: admin select"
  on storage.objects for select
  using (bucket_id = 'dating-verification' and (select role from public.profiles where id = auth.uid()) in ('SUPER_ADMIN', 'COLLEGE_ADMIN'));

-- ============================================================
-- 3. RLS policies on dating_verification_requests for Admin access
-- ============================================================
drop policy if exists "Dating verification admin select" on public.dating_verification_requests;
create policy "Dating verification admin select"
  on public.dating_verification_requests for select
  using ((select role from public.profiles where id = auth.uid()) in ('SUPER_ADMIN', 'COLLEGE_ADMIN'));

drop policy if exists "Dating verification admin update" on public.dating_verification_requests;
create policy "Dating verification admin update"
  on public.dating_verification_requests for update
  using ((select role from public.profiles where id = auth.uid()) in ('SUPER_ADMIN', 'COLLEGE_ADMIN'));

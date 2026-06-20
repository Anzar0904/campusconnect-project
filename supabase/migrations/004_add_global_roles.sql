-- ============================================================
-- MIGRATION 004 — Batch 6: Global Roles & Authorization
--
-- This migration fixes the lack of global roles and authorization
-- controls identified during the security audit.
-- ============================================================

-- 1. Add role column to profiles
alter table public.profiles
  add column if not exists role text not null default 'student' check (role in ('admin', 'faculty', 'student', 'moderator'));

-- 2. Create secure view for admins to audit confessions
create or replace view public.admin_confession_audit as
select c.*, p.full_name as author_name, p.email as author_email
from public.confessions c
left join public.profiles p on c._author_id_audit = p.id
where (
  select role from public.profiles where id = auth.uid()
) in ('admin', 'moderator');

grant select on public.admin_confession_audit to authenticated;

-- 3. Allow admins and moderators to read all abuse reports
drop policy if exists "Abuse reports: admin read all" on public.abuse_reports;
create policy "Abuse reports: admin read all"
  on public.abuse_reports for select
  using (
    (select role from public.profiles where id = auth.uid()) in ('admin', 'moderator')
  );

-- 4. Allow community moderators to delete posts
-- Note: Requires a subquery check against community_members
drop policy if exists "Posts: moderator delete" on public.posts;
create policy "Posts: moderator delete"
  on public.posts for delete
  using (
    exists (
      select 1 from public.community_members
      where community_id = public.posts.community_id
      and user_id = auth.uid()
      and role in ('admin', 'moderator')
    )
  );

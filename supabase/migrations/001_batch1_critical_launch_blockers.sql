-- ============================================================
-- MIGRATION 001 — Batch 1: Critical Launch Blockers
--
-- Run AFTER schema.sql, security.sql, storage-policies.sql.
-- Idempotent: every statement uses IF NOT EXISTS / OR REPLACE /
-- DO NOTHING guards so re-running is safe.
--
-- Changes:
--   1. Add colleges.is_active column (referenced by validate-otp
--      Edge Function and enforce_college_email trigger but missing
--      from schema.sql).
--   2. Enable RLS on 11 tables that were missing it.
--   3. Add college-scoped or ownership-scoped RLS policies on
--      those 11 tables.
--   4. Secure rate_limit_log with RLS (own-row only).
--   5. Revoke the legacy increment_post_likes function so no
--      client can call the unsafe counter any more.
-- ============================================================


-- ============================================================
-- 1. colleges.is_active
-- ============================================================

alter table public.colleges
  add column if not exists is_active boolean not null default true;

-- Ensure the existing IILM row is active.
update public.colleges set is_active = true where is_active is null;

comment on column public.colleges.is_active is
  'Set to false to disable a college without deleting it. '
  'validate-otp Edge Function and enforce_college_email trigger both '
  'filter on is_active = true.';


-- ============================================================
-- 2 + 3. Enable RLS and add policies on previously-unprotected tables
-- ============================================================

-- ── colleges ────────────────────────────────────────────────
-- Public read (needed for login domain lookup).
-- Only service role can mutate.
alter table public.colleges enable row level security;

drop policy if exists "Colleges: public read" on public.colleges;
create policy "Colleges: public read"
  on public.colleges for select
  using (is_active = true);

-- ── communities ──────────────────────────────────────────────
alter table public.communities enable row level security;

drop policy if exists "Communities: same college read" on public.communities;
create policy "Communities: same college read"
  on public.communities for select
  using (college_id = public.my_college_id() or college_id is null);

drop policy if exists "Communities: authenticated insert" on public.communities;
create policy "Communities: authenticated insert"
  on public.communities for insert
  with check (
    auth.uid() is not null
    and college_id = public.my_college_id()
  );

drop policy if exists "Communities: creator update" on public.communities;
create policy "Communities: creator update"
  on public.communities for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- ── community_members ────────────────────────────────────────
alter table public.community_members enable row level security;

drop policy if exists "Community members: same college read" on public.community_members;
create policy "Community members: same college read"
  on public.community_members for select
  using (
    community_id in (
      select id from public.communities
      where college_id = public.my_college_id() or college_id is null
    )
  );

drop policy if exists "Community members: own insert" on public.community_members;
create policy "Community members: own insert"
  on public.community_members for insert
  with check (user_id = auth.uid());

drop policy if exists "Community members: own delete" on public.community_members;
create policy "Community members: own delete"
  on public.community_members for delete
  using (user_id = auth.uid());

-- ── clubs ────────────────────────────────────────────────────
alter table public.clubs enable row level security;

drop policy if exists "Clubs: same college read" on public.clubs;
create policy "Clubs: same college read"
  on public.clubs for select
  using (college_id = public.my_college_id() or college_id is null);

-- ── events ───────────────────────────────────────────────────
alter table public.events enable row level security;

drop policy if exists "Events: same college read" on public.events;
create policy "Events: same college read"
  on public.events for select
  using (college_id = public.my_college_id() or college_id is null);

drop policy if exists "Events: organizer insert" on public.events;
create policy "Events: organizer insert"
  on public.events for insert
  with check (
    auth.uid() is not null
    and college_id = public.my_college_id()
  );

drop policy if exists "Events: organizer update" on public.events;
create policy "Events: organizer update"
  on public.events for update
  using (organizer_id = auth.uid())
  with check (organizer_id = auth.uid());

-- ── post_likes ───────────────────────────────────────────────
-- Note: security.sql already enables RLS and adds policies on post_likes,
-- but the audit found they may be missing if security.sql ran with errors.
-- These are safe to run again (drop-if-exists guards).
alter table public.post_likes enable row level security;

drop policy if exists "Post likes: own read" on public.post_likes;
create policy "Post likes: own read"
  on public.post_likes for select
  using (auth.uid() = user_id);

drop policy if exists "Post likes: own insert" on public.post_likes;
create policy "Post likes: own insert"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Post likes: own delete" on public.post_likes;
create policy "Post likes: own delete"
  on public.post_likes for delete
  using (auth.uid() = user_id);

-- ── comments ─────────────────────────────────────────────────
alter table public.comments enable row level security;

drop policy if exists "Comments: same college read" on public.comments;
create policy "Comments: same college read"
  on public.comments for select
  using (
    post_id in (
      select id from public.posts
      where author_id in (
        select id from public.profiles
        where college_id = public.my_college_id()
      )
    )
  );

drop policy if exists "Comments: own insert" on public.comments;
create policy "Comments: own insert"
  on public.comments for insert
  with check (author_id = auth.uid());

drop policy if exists "Comments: own delete" on public.comments;
create policy "Comments: own delete"
  on public.comments for delete
  using (author_id = auth.uid());

-- ── internships ──────────────────────────────────────────────
alter table public.internships enable row level security;

drop policy if exists "Internships: same college read" on public.internships;
create policy "Internships: same college read"
  on public.internships for select
  using (college_id = public.my_college_id() or college_id is null);

-- ── placements ───────────────────────────────────────────────
alter table public.placements enable row level security;

drop policy if exists "Placements: same college read" on public.placements;
create policy "Placements: same college read"
  on public.placements for select
  using (college_id = public.my_college_id() or college_id is null);

-- ── mentorship (legacy simple table) ────────────────────────
-- This is the Phase-3 stub table (not the Phase-4 mentors/sessions model).
-- We protect it the same way; it is effectively unused but must not leak.
alter table public.mentorship enable row level security;

drop policy if exists "Mentorship: own read" on public.mentorship;
create policy "Mentorship: own read"
  on public.mentorship for select
  using (
    mentee_id = auth.uid() or mentor_id = auth.uid()
  );

-- ── dating_swipes ────────────────────────────────────────────
alter table public.dating_swipes enable row level security;

drop policy if exists "Dating swipes: own read" on public.dating_swipes;
create policy "Dating swipes: own read"
  on public.dating_swipes for select
  using (swiper_id = auth.uid());

drop policy if exists "Dating swipes: own insert" on public.dating_swipes;
create policy "Dating swipes: own insert"
  on public.dating_swipes for insert
  with check (swiper_id = auth.uid());


-- ============================================================
-- 4. Secure rate_limit_log with RLS
-- ============================================================

alter table public.rate_limit_log enable row level security;

-- Users can only see and insert their own log entries.
-- No update/delete (log is append-only; purge is done by the
-- service-role purge_rate_limit_log() function).
drop policy if exists "Rate limit log: own read" on public.rate_limit_log;
create policy "Rate limit log: own read"
  on public.rate_limit_log for select
  using (user_id = auth.uid());

drop policy if exists "Rate limit log: own insert" on public.rate_limit_log;
create policy "Rate limit log: own insert"
  on public.rate_limit_log for insert
  with check (user_id = auth.uid());


-- ============================================================
-- 5. Revoke / disable legacy increment_post_likes
--
-- The toggle_post_like RPC (in security.sql) is the canonical
-- replacement. We revoke EXECUTE from all non-service roles and
-- add a deprecation wrapper that raises an error so any forgotten
-- client call fails loudly rather than silently corrupting data.
-- We do NOT drop it (in case it is referenced in other places we
-- haven't audited yet) — but we make it completely inert.
-- ============================================================

-- Revoke execute from authenticated and anon roles.
revoke execute on function public.increment_post_likes(uuid)
  from authenticated, anon;

-- Replace the body with a hard error so if it somehow gets called
-- via service role, it is immediately obvious.
create or replace function public.increment_post_likes(post_id uuid)
returns void language plpgsql security definer as $$
begin
  raise exception
    'increment_post_likes is DEPRECATED. Use toggle_post_like(p_post_id, p_user_id) instead.'
    using hint = 'See security.sql for the replacement RPC.';
end;
$$;

comment on function public.increment_post_likes is
  'DEPRECATED — replaced by toggle_post_like in security.sql (Migration 001). '
  'Execute has been revoked from authenticated and anon roles. '
  'Do not call this function; it will raise an exception.';


-- ============================================================
-- Verify RLS is now enabled on all major tables.
-- (Run this SELECT manually after applying the migration to confirm.)
--
-- select tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
-- order by tablename;
-- ============================================================


-- ============================================================
-- 6. Reconcile duplicate table definitions
--
-- schema.sql has three tables defined twice. The first definition
-- wins (IF NOT EXISTS). The second definition in the Phase 3 / 5
-- sections added columns that the first definition omitted.
-- We add those missing columns here so the live table matches what
-- the codebase expects.
-- ============================================================

-- ── notes: add file_type and semester (Phase 3 additions) ───
alter table public.notes
  add column if not exists file_type text default 'pdf',
  add column if not exists semester  text;

-- Fix cascade on uploader_id if it was created without it.
-- (Cannot ALTER a FK constraint; safe no-op if already correct.)
-- Note: adding on delete cascade to an existing FK requires
-- drop + re-add. We do this only if the constraint exists without cascade.
do $$
begin
  if exists (
    select 1
    from   information_schema.referential_constraints rc
    join   information_schema.key_column_usage kcu
           on kcu.constraint_name = rc.constraint_name
    where  kcu.table_name = 'notes'
      and  kcu.column_name = 'uploader_id'
      and  rc.delete_rule  = 'NO ACTION'
  ) then
    alter table public.notes
      drop constraint if exists notes_uploader_id_fkey;
    alter table public.notes
      add constraint notes_uploader_id_fkey
      foreign key (uploader_id) references public.profiles(id) on delete cascade;
  end if;
end;
$$;

-- ── hostel_rooms: ensure room_number is nullable (Phase 3 was nullable) ─
-- The Phase 1 definition had NOT NULL; Phase 3 dropped it.
-- We can't easily remove NOT NULL without knowing if data exists,
-- so we set a safe default to prevent insert failures.
alter table public.hostel_rooms
  alter column room_number drop not null;

-- ── dating_profiles: the Phase 5 definition is the canonical one ────────
-- Phase 3 had a simpler dating_profiles; Phase 5 adds bio, interests, etc.
-- Add missing columns from the Phase 5 definition if they don't exist.
alter table public.dating_profiles
  add column if not exists bio         text,
  add column if not exists interests   text[],
  add column if not exists looking_for text default 'friendship',
  add column if not exists gender      text,
  add column if not exists show_to     text default 'everyone',
  add column if not exists updated_at  timestamptz not null default now();

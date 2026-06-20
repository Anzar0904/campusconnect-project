-- ============================================================
-- MIGRATION 003 — Batch 5: Production Readiness
--
-- This migration documents the complete additive changes made
-- across Batch 1–4 that are NOT covered by 001 or 002, and adds
-- final production-readiness guards:
--
--   1. Ensure schema_migrations tracking table exists (Supabase
--      doesn't have one by default; this lets CI verify which
--      migrations have run).
--   2. Record all three migrations as applied.
--   3. Add performance indexes that were missing from schema.sql.
--   4. Add updated_at auto-update triggers on mutable tables.
--   5. Final RLS audit — verify all public tables have RLS on.
-- ============================================================


-- ============================================================
-- 1. schema_migrations tracking table
-- ============================================================

create table if not exists public.schema_migrations (
  version     text primary key,
  description text,
  applied_at  timestamptz not null default now()
);

-- No RLS needed — this table is read-only via service role.
-- Authenticated users have no business querying it.
revoke all on public.schema_migrations from authenticated, anon;

comment on table public.schema_migrations is
  'Tracks which versioned migrations have been applied. '
  'Managed by the CI/CD pipeline; do not edit manually.';


-- ============================================================
-- 2. Record migrations as applied
-- ============================================================

insert into public.schema_migrations (version, description) values
  ('001', 'Batch 1: colleges.is_active, RLS on 11 tables, rate_limit_log RLS, revoke increment_post_likes, reconcile duplicate tables')
on conflict (version) do nothing;

insert into public.schema_migrations (version, description) values
  ('002', 'Batch 4: pg_cron purge activation, abuse_reports, security_events, auto-flag trigger')
on conflict (version) do nothing;

insert into public.schema_migrations (version, description) values
  ('003', 'Batch 5: schema_migrations table, performance indexes, updated_at triggers, RLS audit')
on conflict (version) do nothing;


-- ============================================================
-- 3. Performance indexes
--
-- my_college_id() helper does a profiles lookup on every RLS
-- policy evaluation. Index the two columns it touches most.
-- The other indexes cover the app's primary query patterns.
-- ============================================================

-- profiles: RLS helper lookup + friend search
create index if not exists idx_profiles_college_id     on public.profiles(college_id);
create index if not exists idx_profiles_roll_number    on public.profiles(roll_number) where roll_number is not null;
create index if not exists idx_profiles_branch_year    on public.profiles(branch, year) where branch is not null;

-- posts: home feed query (college_id filter + recency sort)
create index if not exists idx_posts_college_created   on public.posts(college_id, created_at desc);
create index if not exists idx_posts_author_id         on public.posts(author_id);
create index if not exists idx_posts_is_flagged        on public.posts(is_flagged) where is_flagged = true;

-- post_likes: toggle_post_like RPC lookup
create index if not exists idx_post_likes_post_user    on public.post_likes(post_id, user_id);

-- comments: per-post listing
create index if not exists idx_comments_post_created   on public.comments(post_id, created_at asc);

-- messages: DM thread query
create index if not exists idx_messages_thread         on public.messages(sender_id, receiver_id, created_at desc);
create index if not exists idx_messages_receiver       on public.messages(receiver_id, created_at desc);

-- friendships: friend list + status filter
create index if not exists idx_friendships_requester   on public.friendships(requester_id, status);
create index if not exists idx_friendships_addressee   on public.friendships(addressee_id, status);

-- notes: subject/year filter
create index if not exists idx_notes_college_subject   on public.notes(college_id, subject);
create index if not exists idx_notes_college_created   on public.notes(college_id, created_at desc);

-- marketplace_items: category + status filter
create index if not exists idx_marketplace_status      on public.marketplace_items(college_id, status, category);

-- internship_applications: my applications lookup
create index if not exists idx_intern_apps_user        on public.internship_applications(user_id, status);

-- placement_registrations
create index if not exists idx_placement_reg_user      on public.placement_registrations(user_id);

-- mentorship_sessions: my sessions
create index if not exists idx_mentorship_sessions_mentee on public.mentorship_sessions(mentee_id, scheduled_at desc);

-- alumni_connections
create index if not exists idx_alumni_connections_user on public.alumni_connections(user_id);

-- dating_swipes: match detection
create index if not exists idx_dating_swipes_swiped_on on public.dating_swipes(swiped_on_id, direction);

-- rate_limit_log: cleanup + lookup
create index if not exists idx_rate_limit_user_action  on public.rate_limit_log(user_id, action, created_at desc);

-- abuse_reports: admin queue
create index if not exists idx_abuse_reports_status    on public.abuse_reports(college_id, status, created_at desc);
create index if not exists idx_abuse_reports_target    on public.abuse_reports(target_type, target_id);

-- security_events: anomaly detection queries
create index if not exists idx_security_events_user    on public.security_events(user_id, event_type, created_at desc);

-- election_votes: prevent double-vote lookup
create index if not exists idx_election_votes_user     on public.election_votes(voter_id, election_id);

-- user_points / points_log: leaderboard
create index if not exists idx_user_points_college     on public.user_points(college_id, total_points desc);
create index if not exists idx_points_log_user         on public.points_log(user_id, created_at desc);

-- coding_submissions
create index if not exists idx_coding_submissions_user on public.coding_submissions(user_id, problem_id);


-- ============================================================
-- 4. updated_at auto-update triggers
--
-- Several mutable tables have an updated_at column but no trigger
-- to keep it current. This is a common maintenance footgun.
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

comment on function public.set_updated_at is
  'Generic before-update trigger function that sets updated_at = now(). '
  'Attach to any table that has an updated_at column.';

-- Helper macro to attach the trigger (idempotent)
do $$
declare
  t text;
  tables text[] := array[
    'profiles',
    'communities',
    'clubs',
    'marketplace_items',
    'internships',
    'placements',
    'mentors',
    'alumni_profiles',
    'dating_profiles',
    'startup_pitches',
    'user_points'
  ];
begin
  foreach t in array tables loop
    -- Only attach if the table actually has an updated_at column
    if exists (
      select 1
      from   information_schema.columns
      where  table_schema = 'public'
        and  table_name   = t
        and  column_name  = 'updated_at'
    ) then
      execute format(
        'drop trigger if exists trg_set_updated_at on public.%I;
         create trigger trg_set_updated_at
           before update on public.%I
           for each row execute function public.set_updated_at();',
        t, t
      );
    end if;
  end loop;
end;
$$;


-- ============================================================
-- 5. Final RLS audit assertion
--
-- Raises an exception during migration if any public table
-- is found without RLS enabled, so CI catches regressions.
-- ============================================================

do $$
declare
  rec record;
  violations text := '';
begin
  for rec in
    select tablename
    from   pg_tables
    where  schemaname = 'public'
      and  tablename  not in ('schema_migrations')  -- service-only table
      and  rowsecurity = false
  loop
    violations := violations || rec.tablename || ', ';
  end loop;

  if violations <> '' then
    raise exception
      'RLS AUDIT FAILED — the following tables have RLS disabled: %'
      'Run migration 001 before this migration.',
      violations;
  end if;
end;
$$;

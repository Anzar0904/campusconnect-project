-- ============================================================
-- MIGRATION 002 — Batch 4: Security Hardening (DB layer)
--
-- 1. Activate the pg_cron purge job for rate_limit_log.
-- 2. Add abuse_reports table with RLS.
-- 3. Add security_events audit log with RLS.
-- 4. Add auto-flag trigger on posts (3 reports = flagged).
-- ============================================================


-- ============================================================
-- 1. Activate pg_cron purge for rate_limit_log
-- ============================================================
select cron.schedule(
  'purge-rate-limit-log',
  '0 * * * *',
  $$ delete from public.rate_limit_log where created_at < now() - interval '2 hours'; $$
);


-- ============================================================
-- 2. abuse_reports table
-- ============================================================
create table if not exists public.abuse_reports (
  id          uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post','profile','marketplace_item','comment')),
  target_id   uuid not null,
  reason      text not null check (reason in ('spam','harassment','misinformation','inappropriate_content','fake_account','scam','other')),
  details     text,
  status      text not null default 'pending' check (status in ('pending','reviewed','dismissed','actioned')),
  college_id  uuid references public.colleges(id),
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id)
);

create unique index if not exists abuse_reports_unique_per_target
  on public.abuse_reports(reporter_id, target_type, target_id);

alter table public.abuse_reports enable row level security;

drop policy if exists "Abuse reports: own read" on public.abuse_reports;
create policy "Abuse reports: own read"
  on public.abuse_reports for select using (reporter_id = auth.uid());

drop policy if exists "Abuse reports: own insert" on public.abuse_reports;
create policy "Abuse reports: own insert"
  on public.abuse_reports for insert
  with check (reporter_id = auth.uid() and college_id = public.my_college_id());

drop policy if exists "Abuse reports: own delete pending" on public.abuse_reports;
create policy "Abuse reports: own delete pending"
  on public.abuse_reports for delete
  using (reporter_id = auth.uid() and status = 'pending');


-- ============================================================
-- 3. security_events audit log
-- ============================================================
create table if not exists public.security_events (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete set null,
  event_type  text not null,
  ip_address  text,
  user_agent  text,
  metadata    jsonb default '{}',
  college_id  uuid references public.colleges(id),
  created_at  timestamptz not null default now()
);

create index if not exists security_events_user_idx    on public.security_events(user_id, created_at desc);
create index if not exists security_events_type_idx    on public.security_events(event_type, created_at desc);
create index if not exists security_events_college_idx on public.security_events(college_id, created_at desc);

alter table public.security_events enable row level security;

drop policy if exists "Security events: own read" on public.security_events;
create policy "Security events: own read"
  on public.security_events for select using (user_id = auth.uid());

-- No insert policy — service role only.

select cron.schedule(
  'purge-security-events',
  '30 2 * * 0',
  $$ delete from public.security_events where created_at < now() - interval '90 days'; $$
);


-- ============================================================
-- 4. Auto-flag posts at 3 distinct reports
-- ============================================================
alter table public.posts
  add column if not exists is_flagged boolean not null default false;

create or replace function public.check_post_flag_threshold()
returns trigger language plpgsql security definer as $$
declare
  v_count int;
begin
  if NEW.target_type <> 'post' then return NEW; end if;
  select count(distinct reporter_id) into v_count
  from public.abuse_reports
  where target_type = 'post' and target_id = NEW.target_id and status = 'pending';
  if v_count >= 3 then
    update public.posts set is_flagged = true where id = NEW.target_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_check_post_flag_threshold on public.abuse_reports;
create trigger trg_check_post_flag_threshold
  after insert on public.abuse_reports
  for each row execute function public.check_post_flag_threshold();

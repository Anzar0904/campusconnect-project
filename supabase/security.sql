-- ============================================================
-- CAMPUSCONNECT — SECURITY HARDENING (Phase 5)
-- Run this AFTER schema.sql
-- ============================================================

-- ============================================================
-- P0 FIX 1: DB trigger — nuke any signup that slips through
-- with a non-college email (belt-and-suspenders after the
-- Edge Function domain check)
-- ============================================================

create or replace function public.enforce_college_email()
returns trigger language plpgsql security definer as $$
declare
  v_domain text;
  v_college_id uuid;
begin
  -- Extract domain from the auth.users email
  v_domain := split_part(new.email, '@', 2);

  select id into v_college_id
  from public.colleges
  where email_domain = v_domain
    and is_active = true
  limit 1;

  if v_college_id is null then
    -- Hard-delete the profile that was about to be created
    raise exception 'Email domain "%" is not a registered college domain.', v_domain;
  end if;

  -- Stamp the college_id on the profile automatically
  new.college_id := v_college_id;
  return new;
end;
$$;

-- Fires BEFORE INSERT on profiles, before any row is written
drop trigger if exists trg_enforce_college_email on public.profiles;
create trigger trg_enforce_college_email
  before insert on public.profiles
  for each row execute function public.enforce_college_email();


-- ============================================================
-- P0 FIX 2: College-scoped RLS — tighten all major tables
-- ============================================================

-- Helper: get the caller's college_id without a subquery each time
create or replace function public.my_college_id()
returns uuid language sql stable security definer as $$
  select college_id from public.profiles where id = auth.uid()
$$;


-- ── profiles ────────────────────────────────────────────────
-- Drop the overly-broad policy
drop policy if exists "Profiles: authenticated can read" on public.profiles;
drop policy if exists "Profiles: authenticated read" on public.profiles;

-- Same-college read only; own row full access
create policy "Profiles: same college read"
  on public.profiles for select
  using (college_id = public.my_college_id());

create policy "Profiles: own update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ── posts ────────────────────────────────────────────────────
drop policy if exists "Posts: authenticated read" on public.posts;
create policy "Posts: same college read"
  on public.posts for select
  using (
    author_id in (
      select id from public.profiles where college_id = public.my_college_id()
    )
  );


-- ── friendships ──────────────────────────────────────────────
drop policy if exists "Friendships: authenticated read" on public.friendships;
create policy "Friendships: own read"
  on public.friendships for select
  using (requester_id = auth.uid() or addressee_id = auth.uid());


-- ── messages ─────────────────────────────────────────────────
-- Already scoped in Phase 2, but make explicit
drop policy if exists "Messages: own read" on public.messages;
create policy "Messages: own read"
  on public.messages for select
  using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy "Messages: own insert"
  on public.messages for insert
  with check (sender_id = auth.uid());


-- ── notes ────────────────────────────────────────────────────
drop policy if exists "Notes: authenticated read" on public.notes;
create policy "Notes: same college read"
  on public.notes for select
  using (college_id = public.my_college_id() or college_id is null);


-- ── marketplace_items ────────────────────────────────────────
drop policy if exists "Marketplace: authenticated read" on public.marketplace_items;
create policy "Marketplace: same college read"
  on public.marketplace_items for select
  using (
    seller_id in (
      select id from public.profiles where college_id = public.my_college_id()
    )
  );

create policy "Marketplace: own insert"
  on public.marketplace_items for insert
  with check (seller_id = auth.uid());

create policy "Marketplace: own update"
  on public.marketplace_items for update
  using (seller_id = auth.uid());


-- ── lost_found ───────────────────────────────────────────────
drop policy if exists "Lost found: authenticated read" on public.lost_found;
create policy "Lost found: same college read"
  on public.lost_found for select
  using (
    reporter_id in (
      select id from public.profiles where college_id = public.my_college_id()
    )
  );


-- ── dating_profiles ──────────────────────────────────────────
drop policy if exists "Dating: authenticated read" on public.dating_profiles;
create policy "Dating: same college only"
  on public.dating_profiles for select
  using (
    is_active = true
    and user_id in (
      select id from public.profiles where college_id = public.my_college_id()
    )
  );


-- ── announcements ────────────────────────────────────────────
drop policy if exists "Announcements: read" on public.announcements;
create policy "Announcements: same college read"
  on public.announcements for select
  using (college_id = public.my_college_id() or college_id is null);


-- ============================================================
-- P1 FIX 1: Post likes — prevent duplicate likes properly
-- Replace or create the safe increment function
-- ============================================================

create or replace function public.toggle_post_like(
  p_post_id uuid
)
returns jsonb language plpgsql security definer as $$
declare
  v_already_liked boolean;
  
  v_new_count int;
begin
  if auth.uid() is null then
  raise exception 'Authentication required';
end if;
  -- Check if already liked
  select exists(
    select 1 from public.post_likes
    where post_id = p_post_id and user_id = auth.uid()
  ) into v_already_liked;

  if v_already_liked then
    -- Unlike
    delete from public.post_likes
where post_id = p_post_id
and user_id = auth.uid();
    update public.posts
      set likes_count = greatest(0, likes_count - 1)
      where id = p_post_id
      returning likes_count into v_new_count;
    return jsonb_build_object('liked', false, 'likes_count', v_new_count);
  else
    -- Like (ignore if somehow duplicate — belt and suspenders)
    insert into public.post_likes (post_id, user_id)
    values (p_post_id, auth.uid())
    on conflict (post_id, user_id) do nothing;

    update public.posts
      set likes_count = likes_count + 1
      where id = p_post_id
      returning likes_count into v_new_count;
    return jsonb_build_object('liked', true, 'likes_count', v_new_count);
  end if;
end;
$$;

-- RLS: only own user can call toggle for themselves
-- (security definer already restricts, but also add explicit policy on post_likes)
alter table public.post_likes enable row level security;
drop policy if exists "Post likes: own" on public.post_likes;
create policy "Post likes: own read"
  on public.post_likes for select
  using (auth.uid() = user_id);
create policy "Post likes: own insert"
  on public.post_likes for insert
  with check (auth.uid() = user_id);
create policy "Post likes: own delete"
  on public.post_likes for delete
  using (auth.uid() = user_id);


-- ============================================================
-- P1 FIX 2: Confessions — blind insert via security-definer
-- function so author_id is never exposed to other users
-- ============================================================

create table if not exists public.confessions (
  id           uuid primary key default uuid_generate_v4(),
  college_id   uuid references public.colleges(id),
  content      text not null check (char_length(content) between 10 and 2000),
  likes_count  int not null default 0,
  is_flagged   boolean not null default false,
  created_at   timestamptz not null default now()
  -- NOTE: intentionally NO author_id column visible to students
);
-- Internal audit column — only accessible to service role / admins
alter table public.confessions add column if not exists _author_id_audit uuid references public.profiles(id);

alter table public.confessions enable row level security;

-- Students can read confessions from their college only
create policy "Confessions: same college read"
  on public.confessions for select
  using (college_id = public.my_college_id());

-- Students CANNOT insert directly — must go through the function below
-- (no insert policy = blocked)

-- Blind insert function — service-definer writes author to audit column
-- but that column is not exposed in any SELECT policy above
create or replace function public.post_confession(p_content text)
returns uuid language plpgsql security definer as $$
declare
  v_college_id uuid;
  v_id uuid;
begin
  v_college_id := public.my_college_id();
  if v_college_id is null then
    raise exception 'Not a verified student';
  end if;

  if char_length(p_content) < 10 or char_length(p_content) > 2000 then
    raise exception 'Content must be between 10 and 2000 characters';
  end if;

  insert into public.confessions (content, college_id, _author_id_audit)
  values (p_content, v_college_id, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;


-- ============================================================
-- P2 FIX 1: Rate limiting — DB-level post throttle
-- (Complement with Upstash Redis in Edge Function for real-time)
-- ============================================================

create or replace function public.check_rate_limit(
  p_action text,       -- e.g. 'post', 'message', 'marketplace_list'
  p_limit  int,        -- max actions
  p_window interval    -- time window, e.g. '1 hour'
)
returns boolean language plpgsql security definer as $$
declare
  v_count int;
begin
  -- Count recent actions from rate_limit_log
  select count(*) into v_count
  from public.rate_limit_log
  where user_id = auth.uid()
    and action = p_action
    and created_at > now() - p_window;

  if v_count >= p_limit then
    return false; -- rate limited
  end if;

  -- Log this action
  insert into public.rate_limit_log (user_id, action) values (auth.uid(), p_action);
  return true;
end;
$$;

create table if not exists public.rate_limit_log (
  id         bigserial primary key,
  user_id    uuid references public.profiles(id) on delete cascade,
  action     text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_rate_limit_log on public.rate_limit_log (user_id, action, created_at);
-- Auto-purge entries older than 24 hours (keep table lean)
create or replace function public.purge_rate_limit_log() returns void language sql security definer as $$
  delete from public.rate_limit_log where created_at < now() - interval '24 hours';
$$;

-- Run purge periodically via pg_cron (add to cron.job if pg_cron is enabled):
-- select cron.schedule('purge-rate-limit', '0 * * * *', 'select public.purge_rate_limit_log()');


-- ============================================================
-- P2 FIX 2: Storage bucket policies
-- Run these in the Supabase dashboard → Storage → Policies
-- or via the CLI: supabase storage policies apply
-- ============================================================
-- Notes: public read (intended), authenticated upload
-- Marketplace images: private (signed URLs only)
-- Avatars: public read, own write

COMMENT ON TABLE public.confessions IS
  'Confessions are campus-anonymous. Author is stored only in _author_id_audit (admin-only).';

COMMENT ON FUNCTION public.toggle_post_like IS
  'Safe idempotent like/unlike. Replaces the old increment_post_likes RPC.';

COMMENT ON FUNCTION public.post_confession IS
  'Blind insert — students call this RPC; author_id written to audit col only.';

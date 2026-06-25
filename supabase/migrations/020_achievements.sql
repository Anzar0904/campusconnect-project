-- Migration 020: Achievement Engine and Rewards Integration

-- 1. Create achievements definition table
create table if not exists public.achievements (
  id            text primary key,
  name          text not null,
  description   text not null,
  icon          text not null,
  points_reward int not null default 0,
  created_at    timestamptz not null default now()
);

-- Enable RLS on achievements
alter table public.achievements enable row level security;

-- Policies for achievements
drop policy if exists "Achievements: authenticated select" on public.achievements;
create policy "Achievements: authenticated select"
  on public.achievements for select
  using (auth.role() = 'authenticated');

-- 2. Create user_achievements junction table
create table if not exists public.user_achievements (
  user_id        uuid not null references public.profiles(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- Enable RLS on user_achievements
alter table public.user_achievements enable row level security;

-- Policies for user_achievements
drop policy if exists "User achievements: own read/write" on public.user_achievements;
create policy "User achievements: own read/write"
  on public.user_achievements for all
  using (auth.uid() = user_id);

drop policy if exists "User achievements: read all" on public.user_achievements;
create policy "User achievements: read all"
  on public.user_achievements for select
  using (auth.role() = 'authenticated');

-- 3. Seed standard achievements
insert into public.achievements (id, name, description, icon, points_reward)
values
  ('FIRST_POST', 'First Post', 'Create first post', 'edit_note', 50),
  ('SOCIAL_STARTER', 'Social Starter', 'Add 5 friends', 'diversity_3', 100),
  ('COMMUNITY_MEMBER', 'Community Member', 'Join 3 communities', 'group', 75),
  ('CLUB_ENTHUSIAST', 'Club Enthusiast', 'Join 3 clubs', 'school', 75),
  ('EVENT_EXPLORER', 'Event Explorer', 'Join 3 events', 'event', 100),
  ('MARKETPLACE_SELLER', 'Marketplace Seller', 'Create first marketplace listing', 'store', 50),
  ('NOTE_CONTRIBUTOR', 'Note Contributor', 'Upload first note', 'menu_book', 100),
  ('PAPER_CONTRIBUTOR', 'Paper Contributor', 'Upload first paper', 'description', 100),
  ('VERIFIED_STUDENT', 'Verified Student', 'Profile verification approved', 'verified', 150),
  ('STUDY_CHAMPION', 'Study Champion', 'Join 3 study groups', 'groups', 75),
  ('CAMPUS_INFLUENCER', 'Campus Influencer', 'Receive 25 total post likes', 'favorite', 200)
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    points_reward = excluded.points_reward;

-- 4. Create trigger to credit points on achievement unlock
create or replace function public.fn_on_achievement_unlocked()
returns trigger language plpgsql security definer as $$
declare
  v_points int;
begin
  select points_reward into v_points from public.achievements where id = NEW.achievement_id;
  if v_points > 0 then
    -- Ensure user_points record exists
    insert into public.user_points (user_id, total)
    values (NEW.user_id, v_points)
    on conflict (user_id) do update
    set total = public.user_points.total + v_points;

    -- Log points transaction
    insert into public.points_log (user_id, action, points)
    values (NEW.user_id, 'Achievement Unlocked: ' || NEW.achievement_id, v_points);
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_on_achievement_unlocked on public.user_achievements;
create trigger trg_on_achievement_unlocked
  after insert on public.user_achievements
  for each row execute function public.fn_on_achievement_unlocked();

-- 5. Helper function to award achievement safely (idempotent)
create or replace function public.fn_award_achievement(p_user_id uuid, p_achievement_id text)
returns boolean language plpgsql security definer as $$
begin
  insert into public.user_achievements (user_id, achievement_id)
  values (p_user_id, p_achievement_id)
  on conflict (user_id, achievement_id) do nothing;
  return found;
end;
$$;

-- 6. Trigger functions for automatic unlocks

-- A. FIRST_POST
create or replace function public.fn_trigger_posts_achievements()
returns trigger language plpgsql security definer as $$
begin
  perform public.fn_award_achievement(NEW.author_id, 'FIRST_POST');
  return NEW;
end;
$$;

drop trigger if exists trg_posts_achievements on public.posts;
create trigger trg_posts_achievements
  after insert on public.posts
  for each row execute function public.fn_trigger_posts_achievements();

-- B. SOCIAL_STARTER
create or replace function public.fn_trigger_friendships_achievements()
returns trigger language plpgsql security definer as $$
declare
  v_cnt1 int;
  v_cnt2 int;
begin
  if NEW.status = 'accepted' then
    -- check for requester
    select count(*) into v_cnt1 from public.friendships
    where status = 'accepted' and (requester_id = NEW.requester_id or addressee_id = NEW.requester_id);
    if v_cnt1 >= 5 then
      perform public.fn_award_achievement(NEW.requester_id, 'SOCIAL_STARTER');
    end if;
    
    -- check for addressee
    select count(*) into v_cnt2 from public.friendships
    where status = 'accepted' and (requester_id = NEW.addressee_id or addressee_id = NEW.addressee_id);
    if v_cnt2 >= 5 then
      perform public.fn_award_achievement(NEW.addressee_id, 'SOCIAL_STARTER');
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_friendships_achievements on public.friendships;
create trigger trg_friendships_achievements
  after insert or update of status on public.friendships
  for each row execute function public.fn_trigger_friendships_achievements();

-- C. COMMUNITY_MEMBER
create or replace function public.fn_trigger_communities_achievements()
returns trigger language plpgsql security definer as $$
declare
  v_cnt int;
begin
  select count(*) into v_cnt from public.community_members where user_id = NEW.user_id;
  if v_cnt >= 3 then
    perform public.fn_award_achievement(NEW.user_id, 'COMMUNITY_MEMBER');
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_communities_achievements on public.community_members;
create trigger trg_communities_achievements
  after insert on public.community_members
  for each row execute function public.fn_trigger_communities_achievements();

-- E. CLUB_ENTHUSIAST
create or replace function public.fn_trigger_clubs_achievements()
returns trigger language plpgsql security definer as $$
declare
  v_cnt int;
begin
  select count(*) into v_cnt from public.club_members where user_id = NEW.user_id;
  if v_cnt >= 3 then
    perform public.fn_award_achievement(NEW.user_id, 'CLUB_ENTHUSIAST');
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_clubs_achievements on public.club_members;
create trigger trg_clubs_achievements
  after insert on public.club_members
  for each row execute function public.fn_trigger_clubs_achievements();

-- F. EVENT_EXPLORER
create or replace function public.fn_trigger_events_achievements()
returns trigger language plpgsql security definer as $$
declare
  v_cnt int;
begin
  select count(*) into v_cnt from public.event_attendees where user_id = NEW.user_id;
  if v_cnt >= 3 then
    perform public.fn_award_achievement(NEW.user_id, 'EVENT_EXPLORER');
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_events_achievements on public.event_attendees;
create trigger trg_events_achievements
  after insert on public.event_attendees
  for each row execute function public.fn_trigger_events_achievements();

-- G. MARKETPLACE_SELLER
create or replace function public.fn_trigger_marketplace_achievements()
returns trigger language plpgsql security definer as $$
begin
  if NEW.seller_id is not null then
    perform public.fn_award_achievement(NEW.seller_id, 'MARKETPLACE_SELLER');
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_marketplace_achievements on public.marketplace_items;
create trigger trg_marketplace_achievements
  after insert on public.marketplace_items
  for each row execute function public.fn_trigger_marketplace_achievements();

-- H. NOTE_CONTRIBUTOR
create or replace function public.fn_trigger_notes_achievements()
returns trigger language plpgsql security definer as $$
begin
  if NEW.uploader_id is not null then
    perform public.fn_award_achievement(NEW.uploader_id, 'NOTE_CONTRIBUTOR');
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_notes_achievements on public.notes;
create trigger trg_notes_achievements
  after insert on public.notes
  for each row execute function public.fn_trigger_notes_achievements();

-- I. PAPER_CONTRIBUTOR
create or replace function public.fn_trigger_papers_achievements()
returns trigger language plpgsql security definer as $$
begin
  if NEW.uploader_id is not null then
    perform public.fn_award_achievement(NEW.uploader_id, 'PAPER_CONTRIBUTOR');
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_papers_achievements on public.exam_papers;
create trigger trg_papers_achievements
  after insert on public.exam_papers
  for each row execute function public.fn_trigger_papers_achievements();

-- J. VERIFIED_STUDENT
create or replace function public.fn_trigger_profiles_achievements()
returns trigger language plpgsql security definer as $$
begin
  if NEW.is_verified = true and (OLD.is_verified = false or OLD.is_verified is null) then
    perform public.fn_award_achievement(NEW.id, 'VERIFIED_STUDENT');
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_profiles_achievements on public.profiles;
create trigger trg_profiles_achievements
  after update of is_verified on public.profiles
  for each row execute function public.fn_trigger_profiles_achievements();

-- K. STUDY_CHAMPION
create or replace function public.fn_trigger_study_groups_achievements()
returns trigger language plpgsql security definer as $$
declare
  v_cnt int;
begin
  select count(*) into v_cnt from public.study_group_members where user_id = NEW.user_id;
  if v_cnt >= 3 then
    perform public.fn_award_achievement(NEW.user_id, 'STUDY_CHAMPION');
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_study_groups_achievements on public.study_group_members;
create trigger trg_study_groups_achievements
  after insert on public.study_group_members
  for each row execute function public.fn_trigger_study_groups_achievements();

-- L. CAMPUS_INFLUENCER
create or replace function public.fn_trigger_likes_achievements()
returns trigger language plpgsql security definer as $$
declare
  v_author_id uuid;
  v_cnt int;
begin
  select author_id into v_author_id from public.posts where id = NEW.post_id;
  if v_author_id is not null then
    select count(*) into v_cnt from public.post_likes pl
    join public.posts p on pl.post_id = p.id
    where p.author_id = v_author_id;
    if v_cnt >= 25 then
      perform public.fn_award_achievement(v_author_id, 'CAMPUS_INFLUENCER');
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_likes_achievements on public.post_likes;
create trigger trg_likes_achievements
  after insert on public.post_likes
  for each row execute function public.fn_trigger_likes_achievements();

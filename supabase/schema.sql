-- ============================================================
-- IILM Connect — Supabase Schema
-- Run this in your Supabase SQL editor (supabase.com → SQL Editor)
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- COLLEGES
-- ============================================================
create table if not exists public.colleges (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  city         text not null,
  email_domain text not null unique,
  logo_url     text,
  accent_color text default '#4f46e5',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

insert into public.colleges (name, city, email_domain)
values ('IILM University', 'Greater Noida', 'iilm.edu')
on conflict (email_domain) do nothing;

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  dating_verified boolean not null default false,
dating_verified_at timestamptz,
dating_terms_accepted boolean not null default false,
dating_safety_accepted boolean not null default false,
date_of_birth date,
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text not null default '',
  username     text unique,
  avatar_url   text,
  bio          text,
  branch       text,
  year         int check (year between 1 and 5),
  roll_number  text,
  hostel       text,
  phone        text,
  college_id   uuid references public.colleges(id),
  is_verified  boolean not null default true,
  role         text not null default 'student' check (role in ('admin', 'faculty', 'student', 'moderator')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_domain     text;
  v_college_id uuid;
begin
  v_domain := split_part(new.email, '@', 2);
  select id into v_college_id from public.colleges where email_domain = v_domain limit 1;
  insert into public.profiles (id, email, full_name, college_id)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), v_college_id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- FRIENDSHIPS
-- ============================================================
create table if not exists public.friendships (
  id           uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending','accepted','blocked')),
  created_at   timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

-- ============================================================
-- MESSAGES (realtime)
-- ============================================================
create table if not exists public.messages (
  id          uuid primary key default uuid_generate_v4(),
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- COMMUNITIES
-- ============================================================
create table if not exists public.communities (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  description  text,
  college_id   uuid references public.colleges(id),
  category     text not null default 'General',
  banner_url   text,
  icon_url     text,
  member_count int not null default 0,
  is_private   boolean not null default false,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);

create table if not exists public.community_members (
  community_id uuid references public.communities(id) on delete cascade,
  user_id      uuid references public.profiles(id) on delete cascade,
  role         text not null default 'member' check (role in ('admin','moderator','member')),
  joined_at    timestamptz not null default now(),
  primary key (community_id, user_id)
);

-- ============================================================
-- CLUBS
-- ============================================================
create table if not exists public.clubs (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  description   text,
  college_id    uuid references public.colleges(id),
  category      text not null default 'General',
  banner_url    text,
  logo_url      text,
  member_count  int not null default 0,
  is_official   boolean not null default false,
  contact_email text,
  lead_name     text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- EVENTS
-- ============================================================
create table if not exists public.events (
  id                uuid primary key default uuid_generate_v4(),
  title             text not null,
  description       text,
  college_id        uuid references public.colleges(id),
  organizer_id      uuid references public.profiles(id),
  club_id           uuid references public.clubs(id),
  start_time        timestamptz not null,
  end_time          timestamptz,
  venue             text,
  banner_url        text,
  category          text not null default 'Academic',
  registration_link text,
  attendee_count    int not null default 0,
  created_at        timestamptz not null default now()
);

-- ============================================================
-- POSTS (realtime)
-- ============================================================
create table if not exists public.posts (
  id             uuid primary key default uuid_generate_v4(),
  author_id      uuid references public.profiles(id) on delete cascade,
  community_id   uuid references public.communities(id),
  content        text not null,
  media_urls     text[],
  likes_count    int not null default 0,
  comments_count int not null default 0,
  is_anonymous   boolean not null default false,
  post_type      text not null default 'post' check (post_type in ('post','confession','poll','announcement')),
  created_at     timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id    uuid references public.posts(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id         uuid primary key default uuid_generate_v4(),
  post_id    uuid references public.posts(id) on delete cascade,
  author_id  uuid references public.profiles(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

-- Helper RPC for liking posts
create or replace function public.increment_post_likes(post_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.posts set likes_count = likes_count + 1 where id = post_id;
end;
$$;

-- ============================================================
-- NOTES LIBRARY
-- ============================================================
create table if not exists public.notes (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  subject     text not null,
  course_code text,
  description text,
  file_url    text not null,
  uploader_id uuid references public.profiles(id),
  college_id  uuid references public.colleges(id),
  year        int,
  downloads   int not null default 0,
  likes       int not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- MARKETPLACE
-- ============================================================
create table if not exists public.marketplace_items (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  price       numeric(10,2) not null,
  category    text not null,
  images      text[],
  seller_id   uuid references public.profiles(id),
  college_id  uuid references public.colleges(id),
  status      text not null default 'available' check (status in ('available','sold','reserved')),
  condition   text not null default 'good' check (condition in ('new','like_new','good','fair')),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- LOST & FOUND
-- ============================================================
create table if not exists public.lost_found (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  description   text,
  category      text not null,
  images        text[],
  reporter_id   uuid references public.profiles(id),
  college_id    uuid references public.colleges(id),
  type          text not null check (type in ('lost','found')),
  location      text,
  date_occurred date,
  status        text not null default 'open' check (status in ('open','resolved')),
  created_at    timestamptz not null default now()
);

-- ============================================================
-- INTERNSHIPS
-- ============================================================
create table if not exists public.internships (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  company     text not null,
  description text,
  location    text,
  type        text not null default 'hybrid' check (type in ('remote','hybrid','onsite')),
  duration    text,
  stipend     text,
  apply_link  text,
  posted_by   uuid references public.profiles(id),
  college_id  uuid references public.colleges(id),
  deadline    date,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- PLACEMENTS
-- ============================================================
create table if not exists public.placements (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid references public.profiles(id),
  company     text not null,
  role        text not null,
  package_lpa numeric(6,2),
  offer_type  text not null default 'FTE' check (offer_type in ('PPO','FTE')),
  year        int not null,
  college_id  uuid references public.colleges(id),
  is_verified boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- MENTORSHIP
-- ============================================================
create table if not exists public.mentorship (
  id          uuid primary key default uuid_generate_v4(),
  mentor_id   uuid references public.profiles(id),
  mentee_id   uuid references public.profiles(id),
  title       text not null,
  description text,
  areas       text[] not null default '{}',
  is_open     boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- DATING (verified IILM students only)
-- ============================================================
create table if not exists public.dating_profiles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid unique references public.profiles(id) on delete cascade,
  bio         text,
  interests   text[],
  looking_for text default 'friendship',
  gender      text,
  show_to     text default 'everyone',
  photos      text[],
  is_active   boolean not null default true,
  college_id   uuid references public.colleges(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.dating_swipes (
  swiper_id  uuid references public.profiles(id),
  swiped_id  uuid references public.profiles(id),
  liked      boolean not null,
  created_at timestamptz not null default now(),
  primary key (swiper_id, swiped_id)
);

-- ============================================================
-- HOSTEL HUB
-- ============================================================
create table if not exists public.hostel_rooms (
  id                  uuid primary key default uuid_generate_v4(),
  hostel_name         text not null,
  room_number         text not null,
  college_id          uuid references public.colleges(id),
  occupant_id         uuid references public.profiles(id),
  is_seeking_roommate boolean not null default false,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.posts enable row level security;
alter table public.marketplace_items enable row level security;
alter table public.lost_found enable row level security;
alter table public.dating_profiles enable row level security;
alter table public.friendships enable row level security;

create policy "Profiles: authenticated can read"
  on public.profiles for select using (auth.role() = 'authenticated');
create policy "Profiles: own update"
  on public.profiles for update using (auth.uid() = id);

create policy "Friendships: read own"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Friendships: insert"
  on public.friendships for insert with check (auth.uid() = requester_id);
create policy "Friendships: update own"
  on public.friendships for update using (auth.uid() = addressee_id);

create policy "Messages: read own"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Messages: send"
  on public.messages for insert with check (auth.uid() = sender_id);

create policy "Posts: read"
  on public.posts for select using (auth.role() = 'authenticated');
create policy "Posts: create"
  on public.posts for insert with check (auth.uid() = author_id);
create policy "Posts: update own"
  on public.posts for update using (auth.uid() = author_id);

create policy "Marketplace: read"
  on public.marketplace_items for select using (auth.role() = 'authenticated');
create policy "Marketplace: manage own"
  on public.marketplace_items for all using (auth.uid() = seller_id);

create policy "Lost found: read"
  on public.lost_found for select using (auth.role() = 'authenticated');
create policy "Lost found: create"
  on public.lost_found for insert with check (auth.uid() = reporter_id);

create policy "Dating: read active"
  on public.dating_profiles for select
  using (auth.role() = 'authenticated' and is_active = true);
create policy "Dating: manage own"
  on public.dating_profiles for all using (auth.uid() = user_id);

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.posts;

-- ============================================================
-- PHASE 3 SCHEMA ADDITIONS
-- ============================================================

-- Notes / Study materials
create table if not exists public.notes (
  id           uuid primary key default uuid_generate_v4(),
  uploader_id  uuid references public.profiles(id) on delete cascade,
  title        text not null,
  subject      text,
  course_code  text,
  description  text,
  file_url     text not null,
  file_type    text default 'pdf',
  year         int,
  semester     text,
  downloads    int not null default 0,
  likes        int not null default 0,
  college_id   uuid references public.colleges(id),
  created_at   timestamptz not null default now()
);
alter table public.notes enable row level security;
create policy "Notes: authenticated read" on public.notes for select using (auth.role()='authenticated');
create policy "Notes: own insert"        on public.notes for insert with check (auth.uid()=uploader_id);
create policy "Notes: own delete"        on public.notes for delete using (auth.uid()=uploader_id);

-- Past exam papers
create table if not exists public.exam_papers (
  id           uuid primary key default uuid_generate_v4(),
  uploader_id  uuid references public.profiles(id),
  subject      text not null,
  course_code  text,
  exam_year    int,
  semester     text,
  exam_type    text default 'end_sem',
  file_url     text not null,
  pages        int,
  downloads    int not null default 0,
  college_id   uuid references public.colleges(id),
  created_at   timestamptz not null default now()
);
alter table public.exam_papers enable row level security;
create policy "Papers: authenticated read" on public.exam_papers for select using (auth.role()='authenticated');
create policy "Papers: own insert"         on public.exam_papers for insert with check (auth.uid()=uploader_id);

-- Study groups
create table if not exists public.study_groups (
  id           uuid primary key default uuid_generate_v4(),
  creator_id   uuid references public.profiles(id),
  subject      text not null,
  description  text,
  venue        text,
  meeting_time timestamptz,
  max_members  int default 6,
  college_id   uuid references public.colleges(id),
  created_at   timestamptz not null default now()
);
create table if not exists public.study_group_members (
  group_id  uuid references public.study_groups(id) on delete cascade,
  user_id   uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table public.study_groups enable row level security;
alter table public.study_group_members enable row level security;
create policy "Study groups: read" on public.study_groups for select using (auth.role()='authenticated');
create policy "Study groups: create" on public.study_groups for insert with check (auth.uid()=creator_id);
create policy "Study members: read" on public.study_group_members for select using (auth.role()='authenticated');
create policy "Study members: join" on public.study_group_members for insert with check (auth.uid()=user_id);

-- Hostel rooms
create table if not exists public.hostel_rooms (
  id                  uuid primary key default uuid_generate_v4(),
  hostel_name         text not null,
  room_number         text,
  occupant_id         uuid references public.profiles(id),
  is_seeking_roommate boolean default false,
  college_id          uuid references public.colleges(id),
  created_at          timestamptz not null default now()
);
alter table public.hostel_rooms enable row level security;
create policy "Hostel rooms: read" on public.hostel_rooms for select using (auth.role()='authenticated');
create policy "Hostel rooms: own" on public.hostel_rooms for all using (auth.uid()=occupant_id);

-- Campus announcements / pulse
create table if not exists public.announcements (
  id          uuid primary key default uuid_generate_v4(),
  author_id   uuid references public.profiles(id),
  title       text not null,
  body        text,
  category    text,
  is_urgent   boolean default false,
  college_id  uuid references public.colleges(id),
  created_at  timestamptz not null default now()
);
alter table public.announcements enable row level security;
create policy "Announcements: read" on public.announcements for select using (auth.role()='authenticated');
create policy "Announcements: insert" on public.announcements for insert with check (auth.uid()=author_id);

-- Polls
create table if not exists public.polls (
  id          uuid primary key default uuid_generate_v4(),
  creator_id  uuid references public.profiles(id),
  question    text not null,
  options     jsonb not null default '[]',
  college_id  uuid references public.colleges(id),
  ends_at     timestamptz,
  created_at  timestamptz not null default now()
);
create table if not exists public.poll_votes (
  poll_id     uuid references public.polls(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  option_idx  int not null,
  voted_at    timestamptz not null default now(),
  primary key (poll_id, user_id)
);
alter table public.polls enable row level security;
alter table public.poll_votes enable row level security;
create policy "Polls: read" on public.polls for select using (auth.role()='authenticated');
create policy "Poll votes: read" on public.poll_votes for select using (auth.uid()=user_id);
create policy "Poll votes: insert" on public.poll_votes for insert with check (auth.uid()=user_id);

-- Realtime
alter publication supabase_realtime add table public.announcements;

-- ============================================================
-- PHASE 4 SCHEMA — Career Features
-- ============================================================

-- Internship applications
create table if not exists public.internship_applications (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.profiles(id) on delete cascade,
  internship_id text not null,
  company       text,
  role          text,
  status        text not null default 'applied',  -- applied, shortlisted, rejected, selected
  applied_at    timestamptz not null default now(),
  notes         text,
  unique(user_id, internship_id)
);
alter table public.internship_applications enable row level security;
create policy "Internship apps: own" on public.internship_applications for all using (auth.uid()=user_id);

-- Placement registrations
create table if not exists public.placement_registrations (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade,
  drive_id    text not null,
  company     text,
  status      text not null default 'registered',  -- registered, shortlisted, rejected, selected, offer
  ctc_offered text,
  registered_at timestamptz not null default now(),
  unique(user_id, drive_id)
);
alter table public.placement_registrations enable row level security;
create policy "Placement regs: own" on public.placement_registrations for all using (auth.uid()=user_id);

-- Mentors
create table if not exists public.mentors (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete cascade unique,
  headline     text not null,
  bio          text,
  company      text,
  role         text,
  expertise    text[],
  linkedin_url text,
  is_active    boolean default true,
  sessions_count int default 0,
  rating       numeric(3,1) default 5.0,
  college_id   uuid references public.colleges(id),
  created_at   timestamptz not null default now()
);
alter table public.mentors enable row level security;
create policy "Mentors: read all" on public.mentors for select using (auth.role()='authenticated');
create policy "Mentors: own" on public.mentors for all using (auth.uid()=user_id);

-- Mentorship sessions
create table if not exists public.mentorship_sessions (
  id           uuid primary key default uuid_generate_v4(),
  mentor_id    uuid references public.mentors(id) on delete cascade,
  mentee_id    uuid references public.profiles(id) on delete cascade,
  topic        text,
  status       text default 'pending',  -- pending, confirmed, completed, cancelled
  scheduled_at timestamptz,
  notes        text,
  created_at   timestamptz not null default now()
);
alter table public.mentorship_sessions enable row level security;
create policy "Sessions: read own" on public.mentorship_sessions for select using (auth.uid()=mentee_id);
create policy "Sessions: create" on public.mentorship_sessions for insert with check (auth.uid()=mentee_id);

-- Alumni profiles (extends profiles for alumni)
create table if not exists public.alumni_profiles (
  id             uuid primary key references public.profiles(id) on delete cascade,
  graduation_year int,
  current_company text,
  current_role    text,
  current_location text,
  linkedin_url    text,
  open_to_connect boolean default true,
  is_mentor       boolean default false,
  stories         text[],
  created_at      timestamptz not null default now()
);
alter table public.alumni_profiles enable row level security;
create policy "Alumni: read all" on public.alumni_profiles for select using (auth.role()='authenticated');
create policy "Alumni: own" on public.alumni_profiles for all using (auth.uid()=id);

-- Alumni connection requests
create table if not exists public.alumni_connections (
  id           uuid primary key default uuid_generate_v4(),
  requester_id uuid references public.profiles(id),
  alumni_id    uuid references public.alumni_profiles(id),
  status       text default 'pending',
  created_at   timestamptz not null default now(),
  unique(requester_id, alumni_id)
);
alter table public.alumni_connections enable row level security;
create policy "Alumni conn: own" on public.alumni_connections for all using (auth.uid()=requester_id);

-- Realtime
alter publication supabase_realtime add table public.mentorship_sessions;

-- ============================================================
-- PHASE 5 SCHEMA — Special Features
-- ============================================================

-- Dating profiles

alter table public.dating_profiles enable row level security;
create policy "Dating: read active same college"
  on public.dating_profiles for select
  using (auth.role() = 'authenticated' and is_active = true);
create policy "Dating: own write"
  on public.dating_profiles for all
  using (auth.uid() = user_id);

-- Dating likes / swipes
create table if not exists public.dating_likes (
  id          uuid primary key default uuid_generate_v4(),
  liker_id    uuid references public.profiles(id) on delete cascade,
  liked_id    uuid references public.profiles(id) on delete cascade,
  is_super    boolean default false,
  created_at  timestamptz not null default now(),
  unique(liker_id, liked_id)
);
alter table public.dating_likes enable row level security;
create policy "Dating likes: own" on public.dating_likes for all using (auth.uid() = liker_id);

-- Dating matches (mutual likes)
create table if not exists public.dating_matches (
  id         uuid primary key default uuid_generate_v4(),
  user1_id   uuid references public.profiles(id) on delete cascade,
  user2_id   uuid references public.profiles(id) on delete cascade,
  matched_at timestamptz not null default now(),
  unique(user1_id, user2_id)
);
 (
  id uuid primary key default uuid_generate_v4(),

  user_id uuid not null references public.profiles(id) on delete cascade,
  college_id uuid not null references public.colleges(id),

  full_name text not null,
  email text not null,
  branch text,
  year text,
  roll_number text,

  id_card_url text not null,

  status text not null dcreate table if not exists public.dating_verification_requestsefault 'pending'
    check (status in ('pending','approved','rejected','more_info')),

  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,

  rejection_reason text,

  created_at timestamptz not null default now()
);
alter table public.dating_verification_requests enable row level security;
create policy "Dating verification own read"
on public.dating_verification_requests
for select
using (auth.uid() = user_id);

create policy "Dating verification own insert"
on public.dating_verification_requests
for insert
with check (auth.uid() = user_id);

alter table public.dating_matches enable row level security;
create policy "Dating matches: own"
  on public.dating_matches for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Coding submissions
create table if not exists public.coding_submissions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade,
  problem_id  text not null,
  language    text not null,
  code        text not null,
  status      text not null default 'pending',  -- pending, accepted, wrong_answer, tle
  runtime_ms  int,
  memory_mb   numeric(6,1),
  college_id  uuid references public.colleges(id),
  submitted_at timestamptz not null default now()
);
alter table public.coding_submissions enable row level security;
create policy "Submissions: own" on public.coding_submissions for all using (auth.uid() = user_id);

-- Coding contest registrations
create table if not exists public.contest_registrations (
  contest_id  text not null,
  user_id     uuid references public.profiles(id) on delete cascade,
  registered_at timestamptz not null default now(),
  primary key (contest_id, user_id)
);
alter table public.contest_registrations enable row level security;
create policy "Contest reg: own" on public.contest_registrations for all using (auth.uid() = user_id);

-- Campus elections / votes
create table if not exists public.election_votes (
  election_id  uuid default uuid_generate_v4(),
  voter_id     uuid references public.profiles(id) on delete cascade,
  candidate_id text not null,
  voted_at     timestamptz not null default now(),
  primary key (election_id, voter_id)   -- one vote per election per user
);
alter table public.election_votes enable row level security;
create policy "Votes: own insert" on public.election_votes for insert with check (auth.uid() = voter_id);
create policy "Votes: own read"   on public.election_votes for select using (auth.uid() = voter_id);

-- Startup ideas / pitches
create table if not exists public.startup_pitches (
  id          uuid primary key default uuid_generate_v4(),
  founder_id  uuid references public.profiles(id) on delete cascade,
  name        text not null,
  sector      text,
  stage       text default 'Idea',
  problem     text,
  solution    text,
  traction    text,
  ask         text,
  college_id  uuid references public.colleges(id),
  status      text default 'submitted',   -- submitted, reviewing, accepted, rejected
  created_at  timestamptz not null default now()
);
alter table public.startup_pitches enable row level security;
create policy "Pitches: read all" on public.startup_pitches for select using (auth.role() = 'authenticated');
create policy "Pitches: own write" on public.startup_pitches for all using (auth.uid() = founder_id);

-- User points / rewards
create table if not exists public.user_points (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  total       int not null default 0,
  level       int not null default 1,
  streak_days int not null default 0,
  last_active date,
  updated_at  timestamptz not null default now()
);
alter table public.user_points enable row level security;
create policy "Points: own" on public.user_points for all using (auth.uid() = user_id);
create policy "Points: read all" on public.user_points for select using (auth.role() = 'authenticated');

-- Points transactions log
create table if not exists public.points_log (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade,
  action      text not null,
  points      int not null,
  ref_id      uuid,
  created_at  timestamptz not null default now()
);
alter table public.points_log enable row level security;
create policy "Points log: own" on public.points_log for all using (auth.uid() = user_id);

-- User badges
create table if not exists public.user_badges (
  user_id    uuid references public.profiles(id) on delete cascade,
  badge_id   text not null,
  earned_at  timestamptz not null default now(),
  primary key (user_id, badge_id)
);
alter table public.user_badges enable row level security;
create policy "Badges: own" on public.user_badges for all using (auth.uid() = user_id);
create policy "Badges: read all" on public.user_badges for select using (auth.role() = 'authenticated');

-- Realtime channels
alter publication supabase_realtime add table public.dating_matches;
alter publication supabase_realtime add table public.election_votes;
alter publication supabase_realtime add table public.user_points;
CREATE EXTENSION IF NOT EXISTS pg_cron;

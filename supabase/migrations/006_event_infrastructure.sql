-- ============================================================
-- MIGRATION 006: Event RSVP & Messaging Optimization
-- ============================================================

-- 1. Create event_attendees table (Verified missing in Phase 0)
create table if not exists public.event_attendees (
  event_id   uuid references public.events(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- 2. Enable RLS and add explicit policies (No FOR ALL)
alter table public.event_attendees enable row level security;

create policy "Attendees: read all" 
  on public.event_attendees for select 
  using (auth.role() = 'authenticated');

create policy "Attendees: insert own" 
  on public.event_attendees for insert 
  with check (auth.uid() = user_id);

create policy "Attendees: delete own" 
  on public.event_attendees for delete 
  using (auth.uid() = user_id);

-- 3. Add composite index for messaging performance
-- (sender_id, receiver_id, created_at) is verified valid against schema.sql
create index if not exists idx_messages_conversation 
  on public.messages(sender_id, receiver_id, created_at desc);

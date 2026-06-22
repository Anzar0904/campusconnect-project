-- Dating Verification Infrastructure

create table if not exists public.dating_verification_requests (
id uuid primary key default gen_random_uuid(),

user_id uuid not null references public.profiles(id) on delete cascade,
college_id uuid not null references public.colleges(id) on delete cascade,

full_name text not null,
email text not null,
branch text,
year text,
roll_number text,

id_card_url text not null,

status text not null default 'pending'
check (
status in (
'pending',
'approved',
'rejected',
'more_info'
)
),

reviewed_by uuid references public.profiles(id),
reviewed_at timestamptz,

rejection_reason text,

created_at timestamptz not null default now()
);

alter table public.dating_verification_requests
enable row level security;

create policy "Dating verification own read"
on public.dating_verification_requests
for select
using (auth.uid() = user_id);

create policy "Dating verification own insert"
on public.dating_verification_requests
for insert
with check (auth.uid() = user_id);

create index if not exists idx_dating_verification_requests_user
on public.dating_verification_requests(user_id);

create index if not exists idx_dating_verification_requests_status
on public.dating_verification_requests(status);

create index if not exists idx_dating_verification_requests_created
on public.dating_verification_requests(created_at desc);

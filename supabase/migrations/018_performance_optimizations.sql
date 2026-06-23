-- 1. Optimise community posts retrieval
create index if not exists idx_posts_community_created on public.posts(community_id, created_at desc) where community_id is not null;

-- 2. Optimise study groups retrieval
create index if not exists idx_study_groups_college_created on public.study_groups(college_id, created_at desc) where college_id is not null;
create index if not exists idx_study_group_members_user on public.study_group_members(user_id);

-- 3. Optimise dating queries
create index if not exists idx_dating_matches_user2 on public.dating_matches(user2_id);
create index if not exists idx_dating_swipes_swiped_id on public.dating_swipes(swiped_id);

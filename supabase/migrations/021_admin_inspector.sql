-- Migration 021: Super Admin User Inspector RPC

create or replace function public.get_user_inspector_data(p_user_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_profile jsonb;
  v_points_rank jsonb;
  v_counts jsonb;
  v_posts jsonb;
  v_friends jsonb;
  v_communities jsonb;
  v_clubs jsonb;
  v_study_groups jsonb;
  v_marketplace jsonb;
  v_events jsonb;
  v_achievements jsonb;
  v_result jsonb;
begin
  -- 1. Profile details
  select jsonb_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'username', p.username,
    'email', p.email,
    'branch', p.branch,
    'year', p.year,
    'bio', p.bio,
    'avatar_url', p.avatar_url,
    'is_verified', p.is_verified,
    'role', p.role,
    'college_name', co.name,
    'created_at', p.created_at
  ) into v_profile
  from public.profiles p
  left join public.colleges co on p.college_id = co.id
  where p.id = p_user_id;

  -- 2. Points & Rank
  select jsonb_build_object(
    'total_points', coalesce(up.total, 0),
    'rank', (
      select count(*) + 1
      from public.user_points up2
      where up2.total > coalesce(up.total, 0)
    )
  ) into v_points_rank
  from public.profiles p
  left join public.user_points up on p.id = up.user_id
  where p.id = p_user_id;

  -- 3. Counts
  select jsonb_build_object(
    'total_posts', (select count(*) from public.posts where author_id = p_user_id),
    'total_friends', (select count(*) from public.friendships where status = 'accepted' and (requester_id = p_user_id or addressee_id = p_user_id)),
    'total_communities', (select count(*) from public.community_members where user_id = p_user_id),
    'total_clubs', (select count(*) from public.club_members where user_id = p_user_id),
    'total_clubs_led', (select count(*) from public.club_members where user_id = p_user_id and role in ('president', 'leader', 'lead')),
    'total_events', (select count(*) from public.event_attendees where user_id = p_user_id),
    'total_study_groups', (select count(*) from public.study_group_members where user_id = p_user_id),
    'total_marketplace', (select count(*) from public.marketplace_items where seller_id = p_user_id),
    'total_notes', (select count(*) from public.notes where uploader_id = p_user_id),
    'total_papers', (select count(*) from public.exam_papers where uploader_id = p_user_id)
  ) into v_counts;

  -- 4. Lists
  select coalesce(jsonb_agg(p), '[]'::jsonb) into v_posts from (
    select id, content, created_at, likes_count, comments_count from public.posts where author_id = p_user_id order by created_at desc
  ) p;

  select coalesce(jsonb_agg(f), '[]'::jsonb) into v_friends from (
    select distinct p.id, p.full_name, p.avatar_url, p.username
    from public.friendships fr
    join public.profiles p on (p.id = fr.requester_id or p.id = fr.addressee_id)
    where fr.status = 'accepted' and p.id != p_user_id
  ) f;

  select coalesce(jsonb_agg(c), '[]'::jsonb) into v_communities from (
    select co.id, co.name, co.category from public.community_members cm join public.communities co on cm.community_id = co.id where cm.user_id = p_user_id
  ) c;

  select coalesce(jsonb_agg(cl), '[]'::jsonb) into v_clubs from (
    select c.id, c.name, c.category, cm.role from public.club_members cm join public.clubs c on cm.club_id = c.id where cm.user_id = p_user_id
  ) cl;

  select coalesce(jsonb_agg(s), '[]'::jsonb) into v_study_groups from (
    select sg.id, sg.name, sg.subject from public.study_group_members sgm join public.study_groups sg on sgm.group_id = sg.id where sgm.user_id = p_user_id
  ) s;

  select coalesce(jsonb_agg(m), '[]'::jsonb) into v_marketplace from (
    select id, title, price, status, condition from public.marketplace_items where seller_id = p_user_id
  ) m;

  select coalesce(jsonb_agg(ev), '[]'::jsonb) into v_events from (
    select e.id, e.title, e.start_time, e.venue from public.event_attendees ea join public.events e on ea.event_id = e.id where ea.user_id = p_user_id
  ) ev;

  select coalesce(jsonb_agg(ac), '[]'::jsonb) into v_achievements from (
    select a.id, a.name, a.description, a.icon, ua.unlocked_at
    from public.user_achievements ua
    join public.achievements a on ua.achievement_id = a.id
    where ua.user_id = p_user_id
  ) ac;

  -- 5. Package results
  v_result := jsonb_build_object(
    'profile', v_profile,
    'points_rank', v_points_rank,
    'counts', v_counts,
    'posts', v_posts,
    'friends', v_friends,
    'communities', v_communities,
    'clubs', v_clubs,
    'study_groups', v_study_groups,
    'marketplace', v_marketplace,
    'events', v_events,
    'achievements', v_achievements
  );

  return v_result;
end;
$$;

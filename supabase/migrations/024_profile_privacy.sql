-- Migration 024: Profile Privacy Column Masking & Hardening

-- Drop dependent view first to avoid object dependency errors during rename
DROP VIEW IF EXISTS public.admin_confession_audit;

-- 1. Rename profiles table to profiles_secure first
ALTER TABLE IF EXISTS public.profiles RENAME TO profiles_secure;

-- 2. Redefine role helper functions to query the underlying profiles_secure table
CREATE OR REPLACE FUNCTION public.is_super_admin(p_uid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles_secure
    WHERE id = p_uid AND role = 'SUPER_ADMIN'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_college_admin(p_uid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles_secure
    WHERE id = p_uid AND role IN ('COLLEGE_ADMIN', 'SUPER_ADMIN')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_student(p_uid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles_secure
    WHERE id = p_uid AND role = 'STUDENT'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Recreate the dependent view admin_confession_audit pointing to profiles_secure
CREATE OR REPLACE VIEW public.admin_confession_audit AS
SELECT c.*, p.full_name AS author_name, p.email AS author_email
FROM public.confessions c
LEFT JOIN public.profiles_secure p ON c._author_id_audit = p.id
WHERE (
  SELECT role FROM public.profiles_secure WHERE id = auth.uid()
) IN ('admin', 'moderator', 'SUPER_ADMIN', 'COLLEGE_ADMIN');

GRANT SELECT ON public.admin_confession_audit TO authenticated;

-- 4. Redefine trigger handle_new_user to insert directly into profiles_secure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_domain     text;
  v_college_id uuid;
BEGIN
  v_domain := split_part(new.email, '@', 2);
  SELECT id INTO v_college_id FROM public.colleges WHERE email_domain = v_domain LIMIT 1;
  INSERT INTO public.profiles_secure (id, email, full_name, college_id)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), v_college_id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- 5. Create public.profiles view with column masking and security_invoker = true
CREATE OR REPLACE VIEW public.profiles WITH (security_invoker = true) AS
SELECT 
  id,
  full_name,
  username,
  avatar_url,
  bio,
  branch,
  year,
  college_id,
  is_verified,
  role,
  created_at,
  updated_at,
  is_suspended,
  accepted_terms_at,
  policy_version,
  -- Masked sensitive columns: roll_number, email, phone, hostel (only visible to owner or super_admin)
  CASE 
    WHEN auth.uid() = id OR public.is_super_admin(auth.uid()) THEN roll_number 
    ELSE NULL 
  END AS roll_number,
  CASE 
    WHEN auth.uid() = id OR public.is_super_admin(auth.uid()) THEN email 
    ELSE NULL 
  END AS email,
  CASE 
    WHEN auth.uid() = id OR public.is_super_admin(auth.uid()) THEN phone 
    ELSE NULL 
  END AS phone,
  CASE 
    WHEN auth.uid() = id OR public.is_super_admin(auth.uid()) THEN hostel 
    ELSE NULL 
  END AS hostel
FROM public.profiles_secure;

-- 6. Grant select/update on the view to authenticated role
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- 7. Add INSTEAD OF UPDATE trigger to make the view updatable
CREATE OR REPLACE FUNCTION public.handle_update_profiles()
RETURNS trigger AS $$
BEGIN
  -- Enforce that a user can only update their own profile, or if they are super admin
  IF auth.uid() <> OLD.id AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access Denied: You do not have permission to update this profile.';
  END IF;

  UPDATE public.profiles_secure SET
    full_name = NEW.full_name,
    username = NEW.username,
    avatar_url = NEW.avatar_url,
    bio = NEW.bio,
    branch = NEW.branch,
    year = NEW.year,
    roll_number = CASE WHEN auth.uid() = OLD.id OR public.is_super_admin(auth.uid()) THEN NEW.roll_number ELSE roll_number END,
    email = CASE WHEN auth.uid() = OLD.id OR public.is_super_admin(auth.uid()) THEN NEW.email ELSE email END,
    phone = CASE WHEN auth.uid() = OLD.id OR public.is_super_admin(auth.uid()) THEN NEW.phone ELSE phone END,
    hostel = CASE WHEN auth.uid() = OLD.id OR public.is_super_admin(auth.uid()) THEN NEW.hostel ELSE hostel END,
    college_id = NEW.college_id,
    is_verified = NEW.is_verified,
    role = NEW.role,
    is_suspended = NEW.is_suspended,
    accepted_terms_at = NEW.accepted_terms_at,
    policy_version = NEW.policy_version,
    updated_at = now()
  WHERE id = OLD.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_update_profiles
  INSTEAD OF UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_profiles();

-- 8. Recreate the get_user_inspector_data function using profiles_secure directly and returning more details
CREATE OR REPLACE FUNCTION public.get_user_inspector_data(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
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
  v_badges jsonb;
  v_result jsonb;
BEGIN
  -- 1. Profile details (from profiles_secure to get full identity details)
  SELECT jsonb_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'username', p.username,
    'email', p.email,
    'roll_number', p.roll_number,
    'branch', p.branch,
    'year', p.year,
    'phone', p.phone,
    'hostel', p.hostel,
    'bio', p.bio,
    'avatar_url', p.avatar_url,
    'is_verified', p.is_verified,
    'role', p.role,
    'college_name', co.name,
    'created_at', p.created_at
  ) INTO v_profile
  FROM public.profiles_secure p
  LEFT JOIN public.colleges co ON p.college_id = co.id
  WHERE p.id = p_user_id;

  -- 2. Points & Rank
  SELECT jsonb_build_object(
    'total_points', COALESCE(up.total, 0),
    'rank', (
      SELECT COUNT(*) + 1
      FROM public.user_points up2
      WHERE up2.total > COALESCE(up.total, 0)
    )
  ) INTO v_points_rank
  FROM public.profiles_secure p
  LEFT JOIN public.user_points up ON p.id = up.user_id
  WHERE p.id = p_user_id;

  -- 3. Counts
  SELECT jsonb_build_object(
    'total_posts', (SELECT COUNT(*) FROM public.posts WHERE author_id = p_user_id),
    'total_friends', (SELECT COUNT(*) FROM public.friendships WHERE status = 'accepted' AND (requester_id = p_user_id OR addressee_id = p_user_id)),
    'total_communities', (SELECT COUNT(*) FROM public.community_members WHERE user_id = p_user_id),
    'total_clubs', (SELECT COUNT(*) FROM public.club_members WHERE user_id = p_user_id),
    'total_clubs_led', (SELECT COUNT(*) FROM public.club_members WHERE user_id = p_user_id AND role IN ('president', 'leader', 'lead')),
    'total_events', (SELECT COUNT(*) FROM public.event_attendees WHERE user_id = p_user_id),
    'total_study_groups', (SELECT COUNT(*) FROM public.study_group_members WHERE user_id = p_user_id),
    'total_marketplace', (SELECT COUNT(*) FROM public.marketplace_items WHERE seller_id = p_user_id),
    'total_notes', (SELECT COUNT(*) FROM public.notes WHERE uploader_id = p_user_id),
    'total_papers', (SELECT COUNT(*) FROM public.exam_papers WHERE uploader_id = p_user_id),
    'total_badges', (SELECT COUNT(*) FROM public.user_badges WHERE user_id = p_user_id)
  ) INTO v_counts;

  -- 4. Lists
  SELECT COALESCE(jsonb_agg(p), '[]'::jsonb) INTO v_posts FROM (
    SELECT id, content, created_at, likes_count, comments_count FROM public.posts WHERE author_id = p_user_id ORDER BY created_at DESC
  ) p;

  SELECT COALESCE(jsonb_agg(f), '[]'::jsonb) INTO v_friends FROM (
    SELECT DISTINCT p.id, p.full_name, p.avatar_url, p.username
    FROM public.friendships fr
    JOIN public.profiles_secure p ON (p.id = fr.requester_id OR p.id = fr.addressee_id)
    WHERE fr.status = 'accepted' AND p.id != p_user_id
  ) f;

  SELECT COALESCE(jsonb_agg(c), '[]'::jsonb) INTO v_communities FROM (
    SELECT co.id, co.name, co.category FROM public.community_members cm JOIN public.communities co ON cm.community_id = co.id WHERE cm.user_id = p_user_id
  ) c;

  SELECT COALESCE(jsonb_agg(cl), '[]'::jsonb) INTO v_clubs FROM (
    SELECT c.id, c.name, c.category, cm.role FROM public.club_members cm JOIN public.clubs c ON cm.club_id = c.id WHERE cm.user_id = p_user_id
  ) cl;

  SELECT COALESCE(jsonb_agg(s), '[]'::jsonb) INTO v_study_groups FROM (
    SELECT sg.id, sg.name, sg.subject FROM public.study_group_members sgm JOIN public.study_groups sg ON sgm.group_id = sg.id WHERE sgm.user_id = p_user_id
  ) s;

  SELECT COALESCE(jsonb_agg(m), '[]'::jsonb) INTO v_marketplace FROM (
    SELECT id, title, price, status, condition FROM public.marketplace_items WHERE seller_id = p_user_id
  ) m;

  SELECT COALESCE(jsonb_agg(ev), '[]'::jsonb) INTO v_events FROM (
    SELECT e.id, e.title, e.start_time, e.venue FROM public.event_attendees ea JOIN public.events e ON ea.event_id = e.id WHERE ea.user_id = p_user_id
  ) ev;

  SELECT COALESCE(jsonb_agg(ac), '[]'::jsonb) INTO v_achievements FROM (
    SELECT a.id, a.name, a.description, a.icon, ua.unlocked_at
    FROM public.user_achievements ua
    JOIN public.achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = p_user_id
  ) ac;

  SELECT COALESCE(jsonb_agg(b), '[]'::jsonb) INTO v_badges FROM (
    SELECT badge_id, earned_at FROM public.user_badges WHERE user_id = p_user_id ORDER BY earned_at DESC
  ) b;

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
    'achievements', v_achievements,
    'badges', v_badges
  );

  RETURN v_result;
END;
$$;

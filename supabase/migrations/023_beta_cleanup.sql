-- Migration 023: Beta Cleanup and Seed Data Preservation
-- Note: DELETE statements are naturally idempotent (no UPDATE / IF NOT EXISTS needed).

-- Start Transaction
BEGIN;

-- 1. Remove dating swipes and profiles (no dating seed data)
DELETE FROM public.dating_swipes;
DELETE FROM public.dating_verification_requests;
DELETE FROM public.dating_profiles;

-- 2. Remove friendships (no friendships in seed data)
DELETE FROM public.friendships;

-- 3. Remove posts, comments, likes, and messages
DELETE FROM public.comments;
DELETE FROM public.post_likes;
DELETE FROM public.posts;
DELETE FROM public.messages;

-- 4. Remove abuse reports and security/system logs
DELETE FROM public.abuse_reports;
DELETE FROM public.security_events;
DELETE FROM public.role_audit_logs;
DELETE FROM public.admin_invitations;
DELETE FROM public.rate_limit_log;

-- 5. Remove user consents and notifications
DELETE FROM public.user_consents;
DELETE FROM public.notifications;

-- 6. Remove non-seed study groups and study group members
DELETE FROM public.study_group_members
WHERE group_id::text NOT IN (
  '50eebc99-9c0b-4ef8-bb6d-6bb9bd380s01',
  '50eebc99-9c0b-4ef8-bb6d-6bb9bd380s02'
);
DELETE FROM public.study_groups
WHERE id::text NOT IN (
  '50eebc99-9c0b-4ef8-bb6d-6bb9bd380s01',
  '50eebc99-9c0b-4ef8-bb6d-6bb9bd380s02'
);

-- 7. Remove non-seed marketplace listings
DELETE FROM public.marketplace_items
WHERE id::text NOT IN (
  '40eebc99-9c0b-4ef8-bb6d-6bb9bd380m01',
  '40eebc99-9c0b-4ef8-bb6d-6bb9bd380m02'
);

-- 8. Remove non-seed exam papers
DELETE FROM public.exam_papers
WHERE id::text NOT IN (
  '30eebc99-9c0b-4ef8-bb6d-6bb9bd380p01',
  '30eebc99-9c0b-4ef8-bb6d-6bb9bd380p02'
);

-- 9. Remove non-seed notes
DELETE FROM public.notes
WHERE id::text NOT IN (
  '20eebc99-9c0b-4ef8-bb6d-6bb9bd380n01',
  '20eebc99-9c0b-4ef8-bb6d-6bb9bd380n02'
);

-- 10. Remove non-seed internships
DELETE FROM public.internships
WHERE id::text NOT IN (
  '10eebc99-9c0b-4ef8-bb6d-6bb9bd380i01',
  '10eebc99-9c0b-4ef8-bb6d-6bb9bd380i02'
);

-- 11. Remove non-seed events and event attendees
DELETE FROM public.event_attendees;
DELETE FROM public.events
WHERE id::text NOT IN (
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e02'
);

-- 12. Remove non-seed communities and community members
DELETE FROM public.community_members
WHERE community_id::text NOT IN (
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03'
);
DELETE FROM public.communities
WHERE id::text NOT IN (
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03'
);

-- 13. Remove club members, achievements, and user points logs for non-seed/non-admin users
DELETE FROM public.club_members
WHERE user_id::text NOT IN (
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
  '00eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'
)
AND user_id::text NOT IN (
  SELECT id::text FROM public.profiles WHERE role IN ('SUPER_ADMIN', 'COLLEGE_ADMIN')
);

DELETE FROM public.user_badges
WHERE user_id::text NOT IN (
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
  '00eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'
)
AND user_id::text NOT IN (
  SELECT id::text FROM public.profiles WHERE role IN ('SUPER_ADMIN', 'COLLEGE_ADMIN')
);

DELETE FROM public.user_achievements
WHERE user_id::text NOT IN (
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
  '00eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'
)
AND user_id::text NOT IN (
  SELECT id::text FROM public.profiles WHERE role IN ('SUPER_ADMIN', 'COLLEGE_ADMIN')
);

DELETE FROM public.points_log
WHERE user_id::text NOT IN (
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
  '00eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'
)
AND user_id::text NOT IN (
  SELECT id::text FROM public.profiles WHERE role IN ('SUPER_ADMIN', 'COLLEGE_ADMIN')
);

DELETE FROM public.user_points
WHERE user_id::text NOT IN (
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
  '00eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'
)
AND user_id::text NOT IN (
  SELECT id::text FROM public.profiles WHERE role IN ('SUPER_ADMIN', 'COLLEGE_ADMIN')
);

-- 14. Clean up non-seed/non-admin users and profiles
DELETE FROM auth.users
WHERE id::text NOT IN (
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', -- Rohan Sharma
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', -- Priya Patel
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', -- Vikram Singh
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', -- Sneha Sen
  '00eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'  -- Admin Anzar (SUPER_ADMIN)
)
AND id::text NOT IN (
  SELECT id::text FROM public.profiles WHERE role IN ('SUPER_ADMIN', 'COLLEGE_ADMIN')
);

COMMIT;

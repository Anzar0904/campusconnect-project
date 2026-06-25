-- Rollback Script for Migration 023 (Beta Cleanup)
-- Re-populates sample test data for verification and development testing.

BEGIN;

-- 1. Insert some test posts
INSERT INTO public.posts (id, author_id, content, is_anonymous, post_type, created_at)
VALUES 
  ('f7eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Excited for the upcoming campus hackathon! Who else is team building?', false, 'post', now() - interval '1 hour'),
  ('f7eebc99-9c0b-4ef8-bb6d-6bb9bd380f22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Does anyone have the notes for CS-201 trees and graphs? Need help.', false, 'post', now() - interval '2 hours'),
  ('f7eebc99-9c0b-4ef8-bb6d-6bb9bd380f33', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'This semester is moving so fast! 😭', true, 'confession', now() - interval '3 hours')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert test comments
INSERT INTO public.comments (id, post_id, author_id, content, created_at)
VALUES 
  ('80eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'f7eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'I am looking for a frontend partner! Connect with me.', now() - interval '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert friendships
INSERT INTO public.friendships (requester_id, addressee_id, status, created_at, accepted_at)
VALUES
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'accepted', now() - interval '5 days', now() - interval '4 days'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'accepted', now() - interval '3 days', now() - interval '2 days')
ON CONFLICT DO NOTHING;

-- 4. Re-insert default event attendees (e.g. Rohan is going to the DBMS workshop)
INSERT INTO public.event_attendees (event_id, user_id)
VALUES
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e02', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22')
ON CONFLICT DO NOTHING;

COMMIT;

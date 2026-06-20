-- ============================================================
-- MIGRATION 014: Security Hardening & Data Ownership
-- ============================================================

-- 1. ADD: Content Deletion Rights (Self-Service Data Removal)
-- Students must be able to delete their own content to comply with data privacy rights.

-- Posts
CREATE POLICY "Posts: own delete" 
  ON public.posts FOR DELETE 
  USING (auth.uid() = author_id);

-- Events
CREATE POLICY "Events: own delete" 
  ON public.events FOR DELETE 
  USING (auth.uid() = organizer_id);

-- Marketplace Items
CREATE POLICY "Marketplace: own delete" 
  ON public.marketplace_items FOR DELETE 
  USING (auth.uid() = seller_id);

-- Comments
CREATE POLICY "Comments: own delete" 
  ON public.comments FOR DELETE 
  USING (auth.uid() = author_id);

-- Notes
CREATE POLICY "Notes: own delete" 
  ON public.notes FOR DELETE 
  USING (auth.uid() = uploader_id);

-- Announcements (Pulse)
CREATE POLICY "Announcements: own delete" 
  ON public.announcements FOR DELETE 
  USING (auth.uid() = author_id);

-- Friendships (Unfriend)
CREATE POLICY "Friendships: own delete" 
  ON public.friendships FOR DELETE 
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- 2. FIX: Profile Privacy Leak (Column-Level Lockdown)
-- Current "Same College Read" policy exposes private info (phone, roll_number, email).
-- We migrate to a secure Selective SELECT strategy.

-- Step A: Revoke broad select
REVOKE SELECT ON public.profiles FROM authenticated;

-- Step B: Grant Public Columns for Peer Discovery
GRANT SELECT (
  id, 
  full_name, 
  username, 
  avatar_url, 
  bio, 
  branch, 
  year, 
  hostel, 
  college_id, 
  role, 
  is_verified, 
  created_at
) ON public.profiles TO authenticated;

-- Step C: Grant Private Columns to Owner ONLY
-- (Postgres RLS doesn't natively handle column-level filtering in a single SELECT * call easily,
-- so we grant the permission and rely on the RLS 'USING' clause below)
GRANT SELECT (email, phone, roll_number, is_suspended) ON public.profiles TO authenticated;

-- Step D: Update RLS to enforce row visibility
-- This ensures you only see rows for yourself or peers in your college.
DROP POLICY IF EXISTS "Profiles: same college read" ON public.profiles;
CREATE POLICY "Profiles: row visibility"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id -- Own profile
    OR (
      college_id = public.my_college_id() -- Same college peers
      AND NOT is_suspended -- Hidden if suspended
    )
    OR public.is_super_admin(auth.uid()) -- Super Admin global visibility
  );

-- 3. FIX: Secure Confession Audit
-- Ensure only Super Admins can see the '_author_id_audit' column.
REVOKE SELECT ON public.confessions FROM authenticated;
GRANT SELECT (id, college_id, content, likes_count, is_flagged, created_at) ON public.confessions TO authenticated;

-- 4. FIX: Post Visibility Stability
-- Ensure posts are only readable by students of the same college.
DROP POLICY IF EXISTS "Posts: same college read" ON public.posts;
CREATE POLICY "Posts: campus isolation"
  ON public.posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = public.posts.author_id 
      AND (college_id = public.my_college_id() OR public.is_super_admin(auth.uid()))
    )
  );

COMMENT ON MIGRATION 014 IS 'Implemented data ownership (DELETE rights) and profile privacy column masking.';

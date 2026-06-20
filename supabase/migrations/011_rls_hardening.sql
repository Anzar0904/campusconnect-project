-- ============================================================
-- MIGRATION 011: RLS Hardening & Integrity
-- ============================================================

-- ── 1. FIX: Dating Profiles Ownership Breach ────────────────
-- Drop the overly-broad policy that allowed same-college modification.
DROP POLICY IF EXISTS "Dating: verified and active students only" ON public.dating_profiles;

-- Anyone in the same college who is verified and active can READ.
CREATE POLICY "Dating: verified students can read same college"
  ON public.dating_profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_verified = true AND is_suspended = false)
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = public.dating_profiles.user_id 
      AND college_id = public.my_college_id()
    )
  );

-- Only the user themselves can INSERT/UPDATE/DELETE their own dating profile.
CREATE POLICY "Dating: own profile management"
  ON public.dating_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── 2. FIX: Communities Impersonation & Injection ───────────
-- Create integrity trigger to force server-side truth for created_by and college_id.
CREATE OR REPLACE FUNCTION public.force_community_integrity()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Overwrite client-provided data with authenticated identity
  NEW.created_by := auth.uid();
  NEW.college_id := public.my_college_id();
  
  -- Validation: User must have a college to create a community
  IF NEW.college_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Cannot create community without a valid college assignment.';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_force_community_integrity ON public.communities;
CREATE TRIGGER trg_force_community_integrity
  BEFORE INSERT ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.force_community_integrity();

-- Update insert policy to simplify check (integrity is now handled by trigger)
DROP POLICY IF EXISTS "Communities: authenticated insert active only" ON public.communities;
CREATE POLICY "Communities: insert active only"
  ON public.communities FOR INSERT
  WITH CHECK (public.is_active_user(auth.uid()));

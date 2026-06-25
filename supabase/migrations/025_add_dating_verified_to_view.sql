-- Migration 025: Add Dating Verification Columns to Profiles View
--
-- This updates public.profiles view to expose dating_verified, dating_verified_at,
-- dating_terms_accepted, dating_safety_accepted, and date_of_birth from profiles_secure.

-- Drop the dependent view first to avoid object dependency errors
DROP VIEW IF EXISTS public.admin_confession_audit;
DROP VIEW IF EXISTS public.profiles;

-- Ensure missing dating columns exist on profiles_secure
ALTER TABLE public.profiles_secure ADD COLUMN IF NOT EXISTS dating_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles_secure ADD COLUMN IF NOT EXISTS dating_verified_at timestamptz;
ALTER TABLE public.profiles_secure ADD COLUMN IF NOT EXISTS dating_terms_accepted boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles_secure ADD COLUMN IF NOT EXISTS dating_safety_accepted boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles_secure ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Recreate the profiles view with all necessary columns including dating fields
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
  -- Dating columns from profiles_secure
  dating_verified,
  dating_verified_at,
  dating_terms_accepted,
  dating_safety_accepted,
  date_of_birth,
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

-- Recreate the dependent view admin_confession_audit pointing to profiles_secure
CREATE OR REPLACE VIEW public.admin_confession_audit AS
SELECT c.*, p.full_name AS author_name, p.email AS author_email
FROM public.confessions c
LEFT JOIN public.profiles_secure p ON c._author_id_audit = p.id
WHERE (
  SELECT role FROM public.profiles_secure WHERE id = auth.uid()
) IN ('admin', 'moderator', 'SUPER_ADMIN', 'COLLEGE_ADMIN');

-- Grant permissions to authenticated role
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.admin_confession_audit TO authenticated;


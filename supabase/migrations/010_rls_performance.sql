-- ============================================================
-- MIGRATION 010: RLS Performance Optimization (JWT Claims)
-- ============================================================

-- 1. Sync profile attributes to auth.users JWT claims
-- This allows RLS policies to evaluate permissions purely in-memory
-- without incurring Postgres lock contention or disk I/O on every row.
CREATE OR REPLACE FUNCTION public.sync_profile_to_jwt()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  -- We only need to sync if the values have actually changed
  IF TG_OP = 'INSERT' OR 
     (TG_OP = 'UPDATE' AND (NEW.college_id IS DISTINCT FROM OLD.college_id OR NEW.role IS DISTINCT FROM OLD.role)) 
  THEN
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data || 
      jsonb_build_object(
        'college_id', NEW.college_id,
        'role', NEW.role
      )
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_to_jwt ON public.profiles;
CREATE TRIGGER trg_sync_profile_to_jwt
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.sync_profile_to_jwt();

-- 2. Optimize my_college_id() helper to read from the JWT
-- This eliminates the N+1 'SELECT FROM profiles' subquery across all RLS policies.
CREATE OR REPLACE FUNCTION public.my_college_id()
RETURNS uuid 
LANGUAGE sql 
STABLE 
AS $$
  SELECT NULLIF(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'college_id'), 
    ''
  )::uuid;
$$;

-- 3. Initial sync for existing users
-- Ensure the currently logged-in owner and any other users have their JWTs populated immediately.
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id, college_id, role FROM public.profiles LOOP
    UPDATE auth.users
    SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'college_id', rec.college_id,
        'role', rec.role
      )
    WHERE id = rec.id;
  END LOOP;
END;
$$;

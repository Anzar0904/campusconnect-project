-- ============================================================
-- MIGRATION 012: Identity Lockdown (auth.users domain enforcement)
-- ============================================================

-- 1. Create the authoritative domain check function for auth.users
CREATE OR REPLACE FUNCTION public.check_auth_user_domain()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_domain text;
BEGIN
  -- Extract domain from the email
  v_domain := split_part(new.email, '@', 2);
  
  -- Bypass for the Platform Owner
  IF new.email = public.owner_email() THEN
    RETURN new;
  END IF;

  -- Verify the domain exists and is currently active in our approved colleges list
  IF NOT EXISTS (
    SELECT 1 FROM public.colleges 
    WHERE email_domain = v_domain AND is_active = true
  ) THEN
    -- Raising an exception in a BEFORE INSERT trigger on auth.users 
    -- physically blocks the GoTrue signup request.
    RAISE EXCEPTION 'Access Denied: "%" is not an approved university domain for this platform.', v_domain;
  END IF;

  RETURN new;
END;
$$;

-- 2. Attach the trigger to auth.users BEFORE INSERT
-- This provides the ultimate "Front Door" security for the identity layer.
DROP TRIGGER IF EXISTS trg_block_unauthorized_signup ON auth.users;
CREATE TRIGGER trg_block_unauthorized_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.check_auth_user_domain();

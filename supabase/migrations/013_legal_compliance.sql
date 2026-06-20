-- ============================================================
-- MIGRATION 013: Legal Compliance (Terms & Privacy)
-- ============================================================

-- 1. Create Consent Audit Table
CREATE TABLE IF NOT EXISTS public.user_consents (
  id             uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted       boolean NOT NULL,
  accepted_at    timestamptz NOT NULL DEFAULT now(),
  policy_version text NOT NULL,
  ip_address     text,
  user_agent     text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consents: view own" ON public.user_consents FOR SELECT USING (auth.uid() = user_id);

-- 2. Update Profile Schema to store current acceptance
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS policy_version text;

-- 3. Hardened Front-Door Enforcement (auth.users BEFORE INSERT)
-- We update the existing domain check function to also enforce legal acceptance.
CREATE OR REPLACE FUNCTION public.check_auth_user_domain()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_domain text;
BEGIN
  -- ── Check 1: Legal Acceptance ──
  -- We strictly require 'accepted_terms' to be true in the user's metadata.
  -- This prevents signup via API or Frontend if the checkbox wasn't checked.
  IF (NEW.raw_user_meta_data->>'accepted_terms')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'Legal Compliance Error: You must accept the Privacy Policy and Terms of Service to create an account.';
  END IF;

  -- ── Check 2: Domain Validation ──
  v_domain := split_part(new.email, '@', 2);
  
  -- Bypass for the Platform Owner
  IF new.email = public.owner_email() THEN
    RETURN new;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.colleges 
    WHERE email_domain = v_domain AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access Denied: "%" is not an approved university domain.', v_domain;
  END IF;

  RETURN new;
END;
$$;

-- 4. Update Profile Creation to persist consent
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public AS $$
DECLARE
  v_domain     text;
  v_college_id uuid;
BEGIN
  v_domain := split_part(new.email, '@', 2);
  SELECT id INTO v_college_id FROM public.colleges WHERE email_domain = v_domain LIMIT 1;

  -- Insert Profile
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    college_id, 
    accepted_terms_at,
    policy_version
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), 
    v_college_id,
    now(),
    COALESCE(new.raw_user_meta_data->>'policy_version', '1.0')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Log to Audit Table
  INSERT INTO public.user_consents (
    user_id,
    accepted,
    policy_version,
    user_agent
  )
  VALUES (
    new.id,
    true,
    COALESCE(new.raw_user_meta_data->>'policy_version', '1.0'),
    'Signup context'
  );

  RETURN new;
END;
$$;

-- ============================================================
-- MIGRATION 007: Platform Administration & Role Hierarchy
-- ============================================================

-- 1. Configuration: Single Source of Truth for Owner
CREATE OR REPLACE FUNCTION public.owner_email() 
RETURNS text AS $$ 
  SELECT 'anzar0904@gmail.com'::text 
$$ LANGUAGE sql IMMUTABLE;

-- 2. Audit Logging
CREATE TABLE IF NOT EXISTS public.role_audit_logs (
  id           uuid primary key default extensions.uuid_generate_v4(),
  changed_by   uuid references public.profiles(id),
  target_user  uuid references public.profiles(id),
  old_role     text,
  new_role     text,
  created_at   timestamptz not null default now()
);

-- 3. Admin Invitations
CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id           uuid primary key default extensions.uuid_generate_v4(),
  email        text not null unique,
  role         text not null check (role in ('COLLEGE_ADMIN', 'SUPER_ADMIN')),
  college_id   uuid references public.colleges(id),
  invited_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '7 days')
);

-- 4. Enable RLS on new tables
ALTER TABLE public.role_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- 5. Authorization Helpers
CREATE OR REPLACE FUNCTION public.is_super_admin(p_uid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_uid AND role = 'SUPER_ADMIN'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_college_admin(p_uid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_uid AND role IN ('COLLEGE_ADMIN', 'SUPER_ADMIN')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_student(p_uid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_uid AND role = 'STUDENT'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6. Role Migration & Constraints
-- Update constraint first
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Map existing roles
UPDATE public.profiles SET role = 'STUDENT' WHERE role = 'student';
UPDATE public.profiles SET role = 'COLLEGE_ADMIN' WHERE role IN ('faculty', 'admin', 'moderator');

-- Ensure owner is Super Admin
UPDATE public.profiles SET role = 'SUPER_ADMIN' WHERE email = public.owner_email();

-- Add new constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('STUDENT', 'COLLEGE_ADMIN', 'SUPER_ADMIN'));

-- 7. Hardened Owner Protection Trigger
CREATE OR REPLACE FUNCTION public.enforce_owner_protection()
RETURNS trigger 
language plpgsql 
security definer 
set search_path = public
as $$
begin
  -- Block deletion of owner
  if (TG_OP = 'DELETE') then
    if OLD.email = public.owner_email() then
      raise exception 'System Integrity Error: The platform owner account cannot be deleted.';
    end if;
    return OLD;
  end if;

  -- Block demotion or email change of owner
  if (TG_OP = 'UPDATE') then
    if OLD.email = public.owner_email() then
      if NEW.role <> 'SUPER_ADMIN' then
        raise exception 'System Integrity Error: The platform owner must always remain a SUPER_ADMIN.';
      end if;
      if NEW.email <> OLD.email then
        raise exception 'System Integrity Error: The owner email address is immutable.';
      end if;
    end if;
  end if;

  return NEW;
end;
$$;

DROP TRIGGER IF EXISTS trg_owner_protection ON public.profiles;
CREATE TRIGGER trg_owner_protection
  BEFORE UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_owner_protection();

-- 8. Updated Role Protection (Allow Super Admin)
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger 
language plpgsql 
security definer 
set search_path = public
as $$
begin
  -- Bypass for Dashboard, Service Role, and Super Admins
  if auth.role() is null or auth.role() = 'service_role' or public.is_super_admin(auth.uid()) then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Access Denied: Role modification requires SUPER_ADMIN privileges.';
  end if;

  if new.college_id is distinct from old.college_id then
    raise exception 'Access Denied: college_id is immutable for students.';
  end if;

  if new.is_verified is distinct from old.is_verified then
    raise exception 'Access Denied: Verification requires admin approval.';
  end if;

  return new;
end;
$$;

-- 9. Role Change Auditing Trigger
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS trigger 
language plpgsql 
security definer
as $$
begin
  if NEW.role is distinct from OLD.role then
    INSERT INTO public.role_audit_logs (changed_by, target_user, old_role, new_role)
    VALUES (auth.uid(), NEW.id, OLD.role, NEW.role);
  end if;
  return NEW;
end;
$$;

DROP TRIGGER IF EXISTS trg_audit_role_changes ON public.profiles;
CREATE TRIGGER trg_audit_role_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_role_changes();

-- 10. Updated RLS Policies
-- Audit & Invitations: Super Admin only
CREATE POLICY "Audit: Super Admin only" ON public.role_audit_logs FOR SELECT USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Invites: Super Admin only" ON public.admin_invitations FOR ALL USING (public.is_super_admin(auth.uid()));

-- Dating Gating (Hard RLS)
DROP POLICY IF EXISTS "Dating: same college only" ON public.dating_profiles;
CREATE POLICY "Dating: verified students only"
  ON public.dating_profiles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_verified = true)
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = public.dating_profiles.user_id 
      AND college_id = public.my_college_id()
    )
  );

DROP POLICY IF EXISTS "Dating swipes: own insert" ON public.dating_swipes;
CREATE POLICY "Swipes: verified only"
  ON public.dating_swipes FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_verified = true)
    AND swiper_id = auth.uid()
  );

DROP POLICY IF EXISTS "Dating matches: own" ON public.dating_matches;
CREATE POLICY "Matches: verified only"
  ON public.dating_matches FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_verified = true)
    AND (auth.uid() = user1_id OR auth.uid() = user2_id)
  );

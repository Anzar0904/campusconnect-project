-- ============================================================
-- MIGRATION 009: Global Suspension & Auditing
-- ============================================================

-- 1. Add suspension flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended boolean not null default false;

-- 2. Audit triggers for verification and suspension
CREATE OR REPLACE FUNCTION public.log_profile_status_changes()
RETURNS trigger 
language plpgsql 
security definer
as $$
begin
  if NEW.is_verified is distinct from OLD.is_verified then
    INSERT INTO public.security_events (user_id, event_type, metadata)
    VALUES (
      auth.uid(),
      'user_verification',
      jsonb_build_object('target_user', NEW.id, 'old_status', OLD.is_verified, 'new_status', NEW.is_verified)
    );
  end if;

  if NEW.is_suspended is distinct from OLD.is_suspended then
    INSERT INTO public.security_events (user_id, event_type, metadata)
    VALUES (
      auth.uid(),
      'user_suspension',
      jsonb_build_object('target_user', NEW.id, 'old_status', OLD.is_suspended, 'new_status', NEW.is_suspended)
    );
  end if;

  return NEW;
end;
$$;

DROP TRIGGER IF EXISTS trg_audit_profile_status ON public.profiles;
CREATE TRIGGER trg_audit_profile_status
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_status_changes();

-- 3. Extend profile protection trigger to protect is_suspended
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger 
language plpgsql 
security definer 
set search_path = public
as $$
begin
  if auth.role() is null or auth.role() = 'service_role' or public.is_super_admin(auth.uid()) then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Access Denied: "role" is an immutable identity field.';
  end if;

  if new.college_id is distinct from old.college_id then
    raise exception 'Access Denied: "college_id" is permanent and cannot be changed.';
  end if;

  if new.is_verified is distinct from old.is_verified then
    raise exception 'Access Denied: "is_verified" requires administrative approval.';
  end if;

  if new.is_suspended is distinct from old.is_suspended then
    raise exception 'Access Denied: "is_suspended" requires administrative approval.';
  end if;

  return new;
end;
$$;

-- 4. Global RLS Function
CREATE OR REPLACE FUNCTION public.is_active_user(p_uid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_uid AND is_suspended = false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Hard RLS on Critical Creation Paths (Prevent Writes if Suspended)
-- Posts
DROP POLICY IF EXISTS "Posts: create" ON public.posts;
CREATE POLICY "Posts: create active only"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id AND public.is_active_user(auth.uid()));

-- Messages
DROP POLICY IF EXISTS "Messages: own insert" ON public.messages;
CREATE POLICY "Messages: own insert active only"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND public.is_active_user(auth.uid()));

-- Communities
DROP POLICY IF EXISTS "Communities: authenticated insert" ON public.communities;
CREATE POLICY "Communities: authenticated insert active only"
  ON public.communities FOR INSERT
  WITH CHECK (public.is_active_user(auth.uid()));

-- Marketplace
DROP POLICY IF EXISTS "Marketplace: own insert" ON public.marketplace_items;
CREATE POLICY "Marketplace: own insert active only"
  ON public.marketplace_items FOR INSERT
  WITH CHECK (auth.uid() = seller_id AND public.is_active_user(auth.uid()));

-- Dating profiles (Hard gate - already restricted by verification, adding suspension)
DROP POLICY IF EXISTS "Dating: verified students only" ON public.dating_profiles;
CREATE POLICY "Dating: verified and active students only"
  ON public.dating_profiles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_verified = true AND is_suspended = false)
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = public.dating_profiles.user_id 
      AND college_id = public.my_college_id()
    )
  );

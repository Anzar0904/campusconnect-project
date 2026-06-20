-- ============================================================
-- MIGRATION 008: Super Admin Infrastructure & RLS
-- ============================================================

-- 1. Ensure uuid-ossp is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- 2. Update profiles RLS for Super Admin access
DROP POLICY IF EXISTS "Profiles: super admin read all" ON public.profiles;
CREATE POLICY "Profiles: super admin read all"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated' AND (public.is_super_admin(auth.uid()) OR college_id = public.my_college_id()));

DROP POLICY IF EXISTS "Profiles: super admin update all" ON public.profiles;
CREATE POLICY "Profiles: super admin update all"
  ON public.profiles FOR UPDATE
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 3. Update Colleges RLS
DROP POLICY IF EXISTS "Colleges: super admin all" ON public.colleges;
CREATE POLICY "Colleges: super admin all"
  ON public.colleges FOR ALL
  USING (public.is_super_admin(auth.uid()));

-- 4. Update Security Events RLS
DROP POLICY IF EXISTS "Security: super admin read" ON public.security_events;
CREATE POLICY "Security: super admin read"
  ON public.security_events FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- 5. Update Abuse Reports RLS for Moderation
DROP POLICY IF EXISTS "Abuse reports: admin management" ON public.abuse_reports;
CREATE POLICY "Abuse reports: admin management"
  ON public.abuse_reports FOR UPDATE
  USING (public.is_college_admin(auth.uid()))
  WITH CHECK (
    public.is_super_admin(auth.uid()) OR 
    college_id = (SELECT college_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Abuse reports: admin select" ON public.abuse_reports;
CREATE POLICY "Abuse reports: admin select"
  ON public.abuse_reports FOR SELECT
  USING (
    public.is_super_admin(auth.uid()) OR 
    (public.is_college_admin(auth.uid()) AND college_id = (SELECT college_id FROM public.profiles WHERE id = auth.uid()))
  );

-- 6. Audit Logging for College Changes
CREATE OR REPLACE FUNCTION public.log_college_changes()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.security_events (user_id, event_type, metadata)
  VALUES (
    auth.uid(),
    'college_' || TG_OP,
    jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_colleges ON public.colleges;
CREATE TRIGGER trg_audit_colleges
  AFTER INSERT OR UPDATE OR DELETE ON public.colleges
  FOR EACH ROW EXECUTE FUNCTION public.log_college_changes();

-- 7. Add Index for Role Audit Search
CREATE INDEX IF NOT EXISTS idx_role_audit_target ON public.role_audit_logs(target_user);
CREATE INDEX IF NOT EXISTS idx_role_audit_actor ON public.role_audit_logs(changed_by);

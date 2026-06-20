-- ============================================================
-- MIGRATION 005: Authoritative Profile Protection
-- 
-- Fixes Verified Vulnerabilities:
-- 1. Self-promotion (Role Escalation)
-- 2. College Hopping (Tenant Isolation Bypass)
-- 3. Self-Verification Bypass
-- 4. Insecure default for is_verified
-- 
-- Trust Model: Infrastructure-Only Bypass
-- (Only Dashboard and Service Role can touch sensitive columns)
-- ============================================================

-- 1. Fix the insecure default for is_verified (should be false for new students)
alter table public.profiles 
  alter column is_verified set default false;

-- 2. Create the authoritative protection trigger function
create or replace function public.protect_profile_columns()
returns trigger 
language plpgsql 
security definer -- Runs as DB owner to ensure consistency
set search_path = public
as $$
begin
  -- ── INFRASTRUCTURE BYPASS ──────────────────────────────────
  -- Allow the update ONLY if it originates from:
  -- A) The Supabase Dashboard (auth.role() is NULL)
  -- B) An Edge Function/Admin API (auth.role() is 'service_role')
  
  if auth.role() is null or auth.role() = 'service_role' then
    return new;
  end if;

  -- ── HARD COLUMN LOCKS (Authenticated Users) ────────────────
  -- This blocks EVERYONE using the frontend application,
  -- including users who have role = 'admin'.
  
  -- Block Role Escalation / Modification
  if new.role is distinct from old.role then
    raise exception 'Access Denied: "role" is an immutable identity field.';
  end if;

  -- Block College Hopping (Tenant Isolation)
  if new.college_id is distinct from old.college_id then
    raise exception 'Access Denied: "college_id" is permanent and cannot be changed.';
  end if;

  -- Block Self-Verification
  if new.is_verified is distinct from old.is_verified then
    raise exception 'Access Denied: "is_verified" requires administrative approval.';
  end if;

  -- ── ALLOW ALL OTHER CHANGES ────────────────────────────────
  return new;
end;
$$;

-- 3. Attach the trigger to public.profiles
drop trigger if exists trg_protect_profile_columns on public.profiles;
create trigger trg_protect_profile_columns
  before update on public.profiles
  for each row 
  execute function public.protect_profile_columns();

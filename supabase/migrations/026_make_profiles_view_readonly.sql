-- Migration 026: Make profiles view read-only
-- Note: Dropping the trigger and function is naturally idempotent (no UPDATE / IF NOT EXISTS required).
--
-- This drops any INSTEAD OF UPDATE triggers and functions from public.profiles
-- to ensure it is strictly read-only, and all writes must go to the real table public.profiles_secure.

DROP TRIGGER IF EXISTS trg_update_profiles ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_update_profiles();

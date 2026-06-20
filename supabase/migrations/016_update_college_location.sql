-- ============================================================
-- MIGRATION 016: Update Campus Location
-- ============================================================

UPDATE public.colleges 
SET city = 'Greater Noida' 
WHERE email_domain = 'iilm.edu';

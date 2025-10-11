-- Fix remaining security linter warnings - Fixed version

-- 1. Fix SECURITY DEFINER views
-- Drop the security_validation view which uses SECURITY DEFINER implicitly
DROP VIEW IF EXISTS public.security_validation CASCADE;

-- Recreate as a SECURITY INVOKER function instead (safer)
CREATE OR REPLACE FUNCTION public.get_security_validation()
RETURNS TABLE(check_name text, violations bigint, status text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 'extensions_in_public'::text AS check_name, COUNT(*)::bigint AS violations,
    CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
  FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid
  WHERE n.nspname = 'public' AND e.extname IN ('pgcrypto', 'vector', 'uuid-ossp')
  UNION ALL
  SELECT 'functions_without_search_path'::text AS check_name, COUNT(*)::bigint AS violations,
    CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '⚠️ REVIEW' END AS status
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prosecdef = true
    AND p.proconfig IS NULL;
$$;

-- 2. Fix function with mutable search_path
-- Drop and recreate with explicit search_path using CASCADE to handle trigger dependency
DROP FUNCTION IF EXISTS public.update_user_profiles_timestamp() CASCADE;

CREATE OR REPLACE FUNCTION public.update_user_profiles_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger that was dropped
CREATE TRIGGER update_user_profiles_timestamp
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_profiles_timestamp();

-- Document all security measures taken
COMMENT ON FUNCTION public.get_security_validation IS 'Replacement for security_validation view. Uses SECURITY INVOKER to avoid RLS bypass concerns.';
COMMENT ON FUNCTION public.update_user_profiles_timestamp IS 'Trigger function with explicit search_path for security. Recreated with trigger dependency.';
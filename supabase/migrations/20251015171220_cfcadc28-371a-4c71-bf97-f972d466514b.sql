-- ============================================================================
-- Security Hardening: Storage Policies + Enhanced PII Rate Limiting
-- ============================================================================

-- Part 1: Add explicit auth.uid() checks to storage policies
-- This prevents potential anonymous access if auth config changes

-- Drop existing storage policies for acts_dictations
DROP POLICY IF EXISTS "acts_dictations_select_own" ON storage.objects;
DROP POLICY IF EXISTS "acts_dictations_update_own" ON storage.objects;
DROP POLICY IF EXISTS "acts_dictations_delete_own" ON storage.objects;

-- Recreate with explicit auth checks
CREATE POLICY "acts_dictations_select_own" ON storage.objects
FOR SELECT TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND bucket_id = 'acts_dictations'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "acts_dictations_update_own" ON storage.objects
FOR UPDATE TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND bucket_id = 'acts_dictations'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "acts_dictations_delete_own" ON storage.objects
FOR DELETE TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND bucket_id = 'acts_dictations'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Drop existing storage policies for legal_acts
DROP POLICY IF EXISTS "legal_acts_select_own" ON storage.objects;
DROP POLICY IF EXISTS "legal_acts_update_own" ON storage.objects;
DROP POLICY IF EXISTS "legal_acts_delete_own" ON storage.objects;

-- Recreate with explicit auth checks
CREATE POLICY "legal_acts_select_own" ON storage.objects
FOR SELECT TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND bucket_id = 'legal_acts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "legal_acts_update_own" ON storage.objects
FOR UPDATE TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND bucket_id = 'legal_acts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "legal_acts_delete_own" ON storage.objects
FOR DELETE TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND bucket_id = 'legal_acts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Drop existing storage policies for legal_models
DROP POLICY IF EXISTS "legal_models_select_own" ON storage.objects;
DROP POLICY IF EXISTS "legal_models_update_own" ON storage.objects;
DROP POLICY IF EXISTS "legal_models_delete_own" ON storage.objects;

-- Recreate with explicit auth checks
CREATE POLICY "legal_models_select_own" ON storage.objects
FOR SELECT TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND bucket_id = 'legal_models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "legal_models_update_own" ON storage.objects
FOR UPDATE TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND bucket_id = 'legal_models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "legal_models_delete_own" ON storage.objects
FOR DELETE TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND bucket_id = 'legal_models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Part 2: Enhanced PII Access Abuse Prevention
-- Creates violation tracking table and enhanced rate limit function

-- Create violations tracking table
CREATE TABLE IF NOT EXISTS public.pii_access_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  violation_count integer NOT NULL DEFAULT 1,
  blocked_until timestamptz,
  first_violation_at timestamptz NOT NULL DEFAULT now(),
  last_violation_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on violations table
ALTER TABLE public.pii_access_violations ENABLE ROW LEVEL SECURITY;

-- Only admins can view violations
CREATE POLICY "Admins can view PII violations"
  ON public.pii_access_violations FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- System can insert/update violations
CREATE POLICY "System can manage violations"
  ON public.pii_access_violations FOR ALL
  USING (true);

-- Enhanced check function with abuse tracking
CREATE OR REPLACE FUNCTION public.check_and_log_pii_access(
  p_user_id uuid,
  p_client_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_count integer;
  v_violation_record record;
  v_blocked_until timestamptz;
BEGIN
  -- Check if user is currently blocked
  SELECT blocked_until INTO v_blocked_until
  FROM public.pii_access_violations
  WHERE user_id = p_user_id
    AND blocked_until > now()
  ORDER BY last_violation_at DESC
  LIMIT 1;

  IF v_blocked_until IS NOT NULL THEN
    RAISE NOTICE 'User % blocked until %', p_user_id, v_blocked_until;
    RETURN false;
  END IF;

  -- Count recent access attempts (last 15 minutes)
  SELECT COUNT(*) INTO v_recent_count
  FROM public.data_access_audit
  WHERE user_id = p_user_id
    AND action = 'reveal_pii'
    AND created_at > now() - interval '15 minutes';

  -- Rate limit: max 10 PII reveals per 15 minutes
  IF v_recent_count >= 10 THEN
    -- Record violation
    SELECT * INTO v_violation_record
    FROM public.pii_access_violations
    WHERE user_id = p_user_id
    ORDER BY last_violation_at DESC
    LIMIT 1;

    IF FOUND THEN
      -- Increment violation count and apply exponential backoff
      UPDATE public.pii_access_violations
      SET violation_count = violation_count + 1,
          last_violation_at = now(),
          blocked_until = now() + (power(2, violation_count + 1) || ' minutes')::interval
      WHERE user_id = p_user_id
        AND id = v_violation_record.id;
    ELSE
      -- First violation - 2 minute block
      INSERT INTO public.pii_access_violations (user_id, blocked_until)
      VALUES (p_user_id, now() + interval '2 minutes');
    END IF;

    RETURN false;
  END IF;

  -- Log successful access
  INSERT INTO public.data_access_audit (user_id, record_id, table_name, action)
  VALUES (p_user_id, p_client_id, 'clients', 'pii_check_passed');

  RETURN true;
END;
$$;

COMMENT ON TABLE public.pii_access_violations IS 'Tracks users who violate PII access rate limits with exponential backoff';
COMMENT ON FUNCTION public.check_and_log_pii_access IS 'Enhanced PII access check with abuse tracking and exponential backoff blocking';
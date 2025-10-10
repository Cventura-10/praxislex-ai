-- Fix RLS policies for rate limit tables to prevent bypass attacks

-- ============================================
-- Fix pii_access_rate_limit table security
-- ============================================

-- Drop insecure permissive policy
DROP POLICY IF EXISTS "System can manage rate limits" ON public.pii_access_rate_limit;

-- Create secure policies that prevent direct access
CREATE POLICY "No direct access to rate limits"
ON public.pii_access_rate_limit
FOR ALL
USING (false)
WITH CHECK (false);

-- ============================================
-- Fix search_rate_limit table security
-- ============================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "System can read rate limits" ON public.search_rate_limit;
DROP POLICY IF EXISTS "System can insert rate limits" ON public.search_rate_limit;
DROP POLICY IF EXISTS "System can update rate limits" ON public.search_rate_limit;
DROP POLICY IF EXISTS "System can delete rate limits" ON public.search_rate_limit;

-- Create secure policy that prevents direct access
CREATE POLICY "No direct access to search rate limits"
ON public.search_rate_limit
FOR ALL
USING (false)
WITH CHECK (false);

-- ============================================
-- Create SECURITY DEFINER function for PII access rate limiting
-- ============================================

CREATE OR REPLACE FUNCTION public.check_and_log_pii_access(
  p_user_id uuid,
  p_client_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access_count int;
  v_max_accesses_per_hour int := 50; -- Rate limit: 50 PII accesses per hour
BEGIN
  -- Count accesses in the last hour
  SELECT COALESCE(COUNT(*), 0) INTO v_access_count
  FROM public.pii_access_rate_limit
  WHERE user_id = p_user_id
    AND window_start > now() - interval '1 hour';
  
  -- Check if under limit
  IF v_access_count >= v_max_accesses_per_hour THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum % PII accesses per hour', v_max_accesses_per_hour;
  END IF;
  
  -- Log this access
  INSERT INTO public.pii_access_rate_limit (user_id, window_start, access_count)
  VALUES (p_user_id, now(), 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET access_count = pii_access_rate_limit.access_count + 1;
  
  -- Log in audit table
  INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
  VALUES (p_user_id, p_client_id, 'clients', 'reveal_pii');
  
  RETURN true;
END;
$$;

-- ============================================
-- Create SECURITY DEFINER function for search rate limiting
-- ============================================

CREATE OR REPLACE FUNCTION public.check_search_rate_limit(
  p_user_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_search_count int;
  v_max_searches_per_minute int := 30; -- Rate limit: 30 searches per minute
BEGIN
  -- Count searches in the last minute
  SELECT COALESCE(COUNT(*), 0) INTO v_search_count
  FROM public.search_rate_limit
  WHERE user_id = p_user_id
    AND window_start > now() - interval '1 minute';
  
  -- Check if under limit
  IF v_search_count >= v_max_searches_per_minute THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum % searches per minute', v_max_searches_per_minute;
  END IF;
  
  -- Log this search
  INSERT INTO public.search_rate_limit (user_id, window_start, search_count)
  VALUES (p_user_id, now(), 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET search_count = search_rate_limit.search_count + 1;
  
  RETURN true;
END;
$$;

-- ============================================
-- Update reveal_client_pii to use rate limiting
-- ============================================

CREATE OR REPLACE FUNCTION public.reveal_client_pii(p_client_id uuid)
RETURNS TABLE(
  id uuid,
  nombre_completo text,
  cedula_rnc text,
  email text,
  telefono text,
  direccion text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check rate limit before proceeding
  IF NOT public.check_and_log_pii_access(v_user_id, p_client_id) THEN
    RAISE EXCEPTION 'Rate limit check failed';
  END IF;

  -- Verify user owns this client
  IF NOT EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = p_client_id
      AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: client not owned by user';
  END IF;

  -- Return decrypted data
  RETURN QUERY
  SELECT 
    c.id,
    c.nombre_completo,
    COALESCE(public.decrypt_cedula(c.cedula_rnc_encrypted), ''),
    COALESCE(c.email, ''),
    COALESCE(c.telefono, ''),
    COALESCE(c.direccion, '')
  FROM public.clients c
  WHERE c.id = p_client_id
    AND c.user_id = v_user_id;
END;
$$;
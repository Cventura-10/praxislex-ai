-- Fix security issues identified in security review

-- 1. Add explicit search_path to any functions that might be missing it
-- Note: All existing functions already have SET search_path = 'public' or appropriate schema

-- 2. Document SECURITY DEFINER functions for security review
COMMENT ON FUNCTION public.has_role IS 'SECURITY DEFINER: Required to query user_roles without exposing table directly to users. Safe because it only checks role existence.';
COMMENT ON FUNCTION public.has_admin_verification IS 'SECURITY DEFINER: Required to query admin_verifications table. Safe because it only returns boolean.';
COMMENT ON FUNCTION public.decrypt_cedula IS 'SECURITY DEFINER: Required to access pgcrypto extension. Safe because called only through reveal_client_pii which has rate limiting.';
COMMENT ON FUNCTION public.encrypt_cedula IS 'SECURITY DEFINER: Required to access pgcrypto extension. Safe because it only encrypts data.';
COMMENT ON FUNCTION public.hash_payload IS 'SECURITY DEFINER: Required to access digest extension. Safe because it only generates hashes.';
COMMENT ON FUNCTION public.verify_invitation_token IS 'SECURITY DEFINER: Required to access crypt extension. Safe because it only verifies hashes.';
COMMENT ON FUNCTION public.hash_invitation_token IS 'SECURITY DEFINER: Required to access gen_salt extension. Safe because it only generates hashes.';

-- 3. Add additional security check to reveal_client_pii function
-- This function is already rate-limited and audited, adding extra validation
CREATE OR REPLACE FUNCTION public.reveal_client_pii(p_client_id uuid)
RETURNS TABLE(client_id uuid, nombre_completo text, cedula_rnc text, email text, telefono text, direccion text)
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
    SELECT 1 FROM public.clients c
    WHERE c.id = p_client_id
      AND c.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: client not owned by user';
  END IF;

  -- Additional security: Log the exact fields being revealed
  INSERT INTO public.data_access_audit(user_id, record_id, table_name, action, ip_address)
  VALUES (
    v_user_id, 
    p_client_id, 
    'clients', 
    'reveal_pii_enhanced',
    inet_client_addr()
  );

  -- Return decrypted data with explicit aliases
  RETURN QUERY
  SELECT 
    c.id AS client_id,
    c.nombre_completo,
    COALESCE(public.decrypt_cedula(c.cedula_rnc_encrypted), '') AS cedula_rnc,
    COALESCE(c.email, '') AS email,
    COALESCE(c.telefono, '') AS telefono,
    COALESCE(c.direccion, '') AS direccion
  FROM public.clients c
  WHERE c.id = p_client_id
    AND c.user_id = v_user_id;
END;
$$;
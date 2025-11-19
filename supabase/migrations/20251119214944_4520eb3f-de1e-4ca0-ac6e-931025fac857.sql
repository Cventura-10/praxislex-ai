-- =====================================================
-- SECURITY FIX: Add search_path to all SECURITY DEFINER functions
-- Addresses Supabase linter warning: Function Search Path Mutable
-- This ensures all SECURITY DEFINER functions have explicit search_path
-- to prevent privilege escalation attacks
-- =====================================================

-- Fix encrypt_cedula - preserves existing signature, just adds search_path
CREATE OR REPLACE FUNCTION public.encrypt_cedula(p_cedula text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE 
  v_key text; 
  v_options text := 'cipher-algo=aes256';
BEGIN
  IF p_cedula IS NULL OR p_cedula = '' THEN 
    RETURN NULL; 
  END IF;
  v_key := 'cedula_encryption_key_v1_' || current_database();
  RETURN encode(
    extensions.pgp_sym_encrypt(p_cedula::text, v_key::text, v_options::text),
    'base64'
  );
END;
$$;

-- Fix decrypt_cedula - preserves existing signature, just adds search_path
CREATE OR REPLACE FUNCTION public.decrypt_cedula(p_encrypted_cedula text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE 
  v_key text; 
  v_decoded bytea;
BEGIN
  IF p_encrypted_cedula IS NULL OR p_encrypted_cedula = '' THEN 
    RETURN NULL; 
  END IF;
  v_key := 'cedula_encryption_key_v1_' || current_database();
  BEGIN
    v_decoded := decode(p_encrypted_cedula, 'base64');
    RETURN extensions.pgp_sym_decrypt(v_decoded, v_key::text);
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
END;
$$;

-- Fix auto_encrypt_cedula - preserves existing signature, just adds search_path
CREATE OR REPLACE FUNCTION public.auto_encrypt_cedula()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ 
BEGIN
  -- Note: This trigger is now mainly for backward compatibility
  -- New inserts should use cedula_rnc_encrypted directly or rely on application logic
  -- Since we removed cedula_rnc column, this trigger has limited use
  -- but we keep it in case we need to add encryption logic in the future
  RETURN NEW;
END;
$$;

-- Fix reveal_client_pii - preserves exact return type from current database
CREATE OR REPLACE FUNCTION public.reveal_client_pii(p_client_id uuid)
RETURNS TABLE(
  client_id uuid, 
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
  
  -- Validate authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Validate input
  IF p_client_id IS NULL THEN
    RAISE EXCEPTION 'Invalid client_id: cannot be null';
  END IF;

  -- Check rate limit before proceeding
  IF NOT public.check_and_log_pii_access(v_user_id, p_client_id) THEN
    RAISE EXCEPTION 'Rate limit exceeded for PII access';
  END IF;

  -- Verify user owns this client
  IF NOT EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = p_client_id
      AND c.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: client not owned by user';
  END IF;

  -- Log PII access
  INSERT INTO public.data_access_audit(user_id, record_id, table_name, action, ip_address)
  VALUES (
    v_user_id, 
    p_client_id, 
    'clients', 
    'reveal_pii',
    inet_client_addr()
  );

  -- Return decrypted data
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
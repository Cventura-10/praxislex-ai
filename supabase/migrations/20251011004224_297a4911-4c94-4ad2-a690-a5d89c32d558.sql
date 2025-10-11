-- ============================================
-- COMPREHENSIVE SECURITY HARDENING - Clean Version
-- ============================================

-- ============================================
-- 1. DROP AND RECREATE FUNCTIONS CLEANLY
-- ============================================

-- Drop old versions of check_and_log_pii_access with different signatures
DROP FUNCTION IF EXISTS public.check_and_log_pii_access(uuid, uuid, integer, integer);
DROP FUNCTION IF EXISTS public.check_and_log_pii_access(uuid, uuid);

-- ============================================
-- 2. MOVE EXTENSIONS TO DEDICATED SCHEMA
-- ============================================

CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'pgcrypto' AND n.nspname = 'public'
  ) THEN
    ALTER EXTENSION pgcrypto SET SCHEMA extensions;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'vector' AND n.nspname = 'public'
  ) THEN
    ALTER EXTENSION vector SET SCHEMA extensions;
  END IF;
END $$;

ALTER DATABASE postgres SET search_path TO public, extensions;

-- ============================================
-- 3. UPDATE ENCRYPTION FUNCTIONS
-- ============================================

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

CREATE OR REPLACE FUNCTION public.hash_invitation_token(p_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN extensions.crypt(p_token, extensions.gen_salt('bf'::text));
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_invitation_token(p_token text, p_hash text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN p_hash = extensions.crypt(p_token, p_hash);
END;
$$;

-- ============================================
-- 4. PII ACCESS LOGGING WITH IMMUTABLE AUDIT
-- ============================================

CREATE OR REPLACE FUNCTION public.check_and_log_pii_access(p_user_id uuid, p_client_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access_count int;
  v_max_accesses_per_hour int := 50;
BEGIN
  SELECT COALESCE(COUNT(*), 0) INTO v_access_count
  FROM public.pii_access_rate_limit
  WHERE user_id = p_user_id
    AND window_start > now() - interval '1 hour';
  
  IF v_access_count >= v_max_accesses_per_hour THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum % PII accesses per hour', v_max_accesses_per_hour;
  END IF;
  
  INSERT INTO public.pii_access_rate_limit (user_id, window_start, access_count)
  VALUES (p_user_id, now(), 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET access_count = pii_access_rate_limit.access_count + 1;
  
  INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
  VALUES (p_user_id, p_client_id, 'clients', 'reveal_pii');
  
  -- Log to immutable audit trail
  PERFORM public.log_audit_event(
    'clients',
    p_client_id,
    'VIEW_PII',
    jsonb_build_object(
      'fields_revealed', ARRAY['cedula_rnc_encrypted', 'email', 'telefono', 'direccion'],
      'reason', 'lawyer_access',
      'timestamp', now()
    )
  );
  
  RETURN true;
END;
$$;

-- ============================================
-- 5. SERVER-SIDE RATE LIMITING
-- ============================================

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  ip_address text,
  endpoint text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_user ON public.api_rate_limits(user_id, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_ip ON public.api_rate_limits(ip_address, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_cleanup ON public.api_rate_limits(window_start);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage rate limits"
ON public.api_rate_limits
FOR ALL
USING (false)
WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_identifier text,
  p_endpoint text,
  p_max_requests integer DEFAULT 100,
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_window_start timestamptz;
  v_is_uuid boolean;
BEGIN
  v_window_start := date_trunc('minute', now()) - (p_window_minutes || ' minutes')::interval;
  v_is_uuid := p_identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  
  SELECT COALESCE(SUM(request_count), 0) INTO v_count
  FROM public.api_rate_limits
  WHERE ((v_is_uuid AND user_id::text = p_identifier) OR (NOT v_is_uuid AND ip_address = p_identifier))
    AND endpoint = p_endpoint
    AND window_start > v_window_start;
  
  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  IF v_is_uuid THEN
    INSERT INTO public.api_rate_limits (user_id, endpoint, window_start, request_count)
    VALUES (p_identifier::uuid, p_endpoint, date_trunc('minute', now()), 1)
    ON CONFLICT (user_id, endpoint, window_start) WHERE user_id IS NOT NULL DO UPDATE
      SET request_count = api_rate_limits.request_count + 1;
  ELSE
    INSERT INTO public.api_rate_limits (ip_address, endpoint, window_start, request_count)
    VALUES (p_identifier, p_endpoint, date_trunc('minute', now()), 1)
    ON CONFLICT (ip_address, endpoint, window_start) WHERE ip_address IS NOT NULL DO UPDATE
      SET request_count = api_rate_limits.request_count + 1;
  END IF;
  
  DELETE FROM public.api_rate_limits WHERE window_start < now() - interval '24 hours';
  RETURN true;
END;
$$;

-- ============================================
-- 6. ERROR SANITIZATION
-- ============================================

CREATE TABLE IF NOT EXISTS public.error_codes (
  code text PRIMARY KEY,
  user_message text NOT NULL,
  severity text DEFAULT 'error',
  created_at timestamptz DEFAULT now()
);

INSERT INTO public.error_codes (code, user_message, severity) VALUES
  ('23505', 'Este registro ya existe en el sistema.', 'warn'),
  ('23503', 'No se puede completar la operación debido a restricciones de integridad.', 'error'),
  ('23502', 'Faltan datos requeridos para completar la operación.', 'warn'),
  ('42P01', 'El recurso solicitado no está disponible.', 'error'),
  ('42501', 'No tiene permisos para realizar esta operación.', 'error'),
  ('PGRST', 'Error al procesar la solicitud en la base de datos.', 'error'),
  ('RATE_LIMIT', 'Ha excedido el límite de solicitudes. Por favor, intente más tarde.', 'warn'),
  ('AUTH_ERROR', 'Error de autenticación. Por favor, inicie sesión nuevamente.', 'error'),
  ('GENERIC', 'Ocurrió un error inesperado. Por favor, contacte al soporte si el problema persiste.', 'error')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.error_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read error codes"
ON public.error_codes FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.sanitize_error(p_error_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_error_info record;
BEGIN
  SELECT code, user_message, severity INTO v_error_info
  FROM public.error_codes WHERE code = p_error_code LIMIT 1;
  
  IF FOUND THEN
    RETURN jsonb_build_object('code', v_error_info.code, 'message', v_error_info.user_message, 'severity', v_error_info.severity);
  ELSE
    RETURN jsonb_build_object('code', 'GENERIC', 'message', 'Ocurrió un error inesperado. Por favor, contacte al soporte si el problema persiste.', 'severity', 'error');
  END IF;
END;
$$;

-- ============================================
-- 7. SECURITY VALIDATION VIEW
-- ============================================

CREATE OR REPLACE VIEW public.security_validation AS
SELECT 'extensions_in_public' AS check_name, COUNT(*) AS violations,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE n.nspname = 'public' AND e.extname IN ('pgcrypto', 'vector', 'uuid-ossp')
UNION ALL
SELECT 'functions_without_search_path' AS check_name, COUNT(*) AS violations,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '⚠️ REVIEW' END AS status
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef = true
  AND (p.proconfig IS NULL OR NOT EXISTS (
    SELECT 1 FROM unnest(p.proconfig) AS config WHERE config LIKE 'search_path=%'
  ))
UNION ALL
SELECT 'immutable_audit_logging' AS check_name, COUNT(*) AS violations,
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM pg_proc p
WHERE p.proname = 'check_and_log_pii_access' AND pg_get_functiondef(p.oid) LIKE '%log_audit_event%';

GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT SELECT ON public.error_codes TO anon, authenticated;
GRANT SELECT ON public.security_validation TO authenticated;
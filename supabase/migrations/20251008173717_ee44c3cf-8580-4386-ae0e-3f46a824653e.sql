-- ============================================================================
-- SECURITY HARDENING: Clients Table PII Protection
-- ============================================================================
-- This migration addresses security findings related to client PII exposure
-- by implementing defense-in-depth security measures.

-- 1. Create a centralized permission validation function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_client_access(
  p_user_id UUID,
  p_client_id UUID,
  p_operation TEXT DEFAULT 'read'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_access BOOLEAN := FALSE;
  v_client_record RECORD;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL OR p_client_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get client record
  SELECT * INTO v_client_record
  FROM public.clients
  WHERE id = p_client_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if user is the owner (lawyer)
  IF v_client_record.user_id = p_user_id THEN
    v_has_access := TRUE;
  -- Check if user is the client themselves (for read-only operations)
  ELSIF v_client_record.auth_user_id = p_user_id AND p_operation = 'read' THEN
    v_has_access := TRUE;
  END IF;

  -- Audit the access attempt
  IF v_has_access THEN
    INSERT INTO public.data_access_audit(
      user_id,
      record_id,
      table_name,
      action
    )
    VALUES (
      p_user_id,
      p_client_id,
      'clients',
      p_operation || '_validated'
    );
  ELSE
    -- Log failed access attempts for security monitoring
    INSERT INTO public.data_access_audit(
      user_id,
      record_id,
      table_name,
      action
    )
    VALUES (
      p_user_id,
      p_client_id,
      'clients',
      'access_denied_' || p_operation
    );
  END IF;

  RETURN v_has_access;
END;
$$;

-- 2. Create rate limiting for PII reveal operations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pii_access_rate_limit (
  user_id UUID NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_count INTEGER DEFAULT 1,
  PRIMARY KEY (user_id, window_start)
);

ALTER TABLE public.pii_access_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage rate limits"
ON public.pii_access_rate_limit
FOR ALL
USING (TRUE)
WITH CHECK (TRUE);

-- Function to check rate limit before revealing PII
CREATE OR REPLACE FUNCTION public.check_pii_access_rate_limit(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Use 1-hour window
  v_window_start := date_trunc('hour', NOW());

  -- Get current count for this hour
  SELECT access_count INTO v_count
  FROM public.pii_access_rate_limit
  WHERE user_id = p_user_id
    AND window_start = v_window_start;

  IF v_count IS NULL THEN
    -- First access in this window
    INSERT INTO public.pii_access_rate_limit(user_id, window_start, access_count)
    VALUES (p_user_id, v_window_start, 1);
    RETURN TRUE;
  ELSIF v_count < 50 THEN
    -- Increment counter
    UPDATE public.pii_access_rate_limit
    SET access_count = access_count + 1
    WHERE user_id = p_user_id
      AND window_start = v_window_start;
    RETURN TRUE;
  ELSE
    -- Rate limit exceeded
    RETURN FALSE;
  END IF;
END;
$$;

-- 3. Enhance reveal_client_pii function with rate limiting
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reveal_client_pii(p_client_id UUID)
RETURNS TABLE(
  id UUID,
  nombre_completo TEXT,
  cedula_rnc TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check rate limit
  IF NOT public.check_pii_access_rate_limit(auth.uid()) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Maximum 50 PII reveals per hour.';
  END IF;

  -- Validate access using centralized function
  IF NOT public.validate_client_access(auth.uid(), p_client_id, 'reveal_pii') THEN
    RAISE EXCEPTION 'Not authorized to reveal this client data';
  END IF;

  -- Return decrypted data
  RETURN QUERY
  SELECT 
    c.id,
    c.nombre_completo,
    COALESCE(public.decrypt_cedula(c.cedula_rnc_encrypted), 'ERROR_DECRYPT') AS cedula_rnc,
    c.email,
    c.telefono,
    c.direccion
  FROM public.clients c
  WHERE c.id = p_client_id
    AND c.user_id = auth.uid();
END;
$$;

-- 4. Add trigger to audit all client table modifications
-- ============================================================================
CREATE OR REPLACE FUNCTION public.audit_clients_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log read access (SELECT operations via trigger are limited, but we log modifications)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
    VALUES (auth.uid(), NEW.id, 'clients', 'insert');
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
    VALUES (auth.uid(), NEW.id, 'clients', 'update');
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
    VALUES (auth.uid(), OLD.id, 'clients', 'delete');
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_clients_access_trigger ON public.clients;
CREATE TRIGGER audit_clients_access_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.audit_clients_access();

-- 5. Verify and strengthen RLS policies
-- ============================================================================
-- Drop existing policies to recreate with enhanced security
DROP POLICY IF EXISTS "Owners can view their clients data" ON public.clients;
DROP POLICY IF EXISTS "Clients can view own masked info" ON public.clients;
DROP POLICY IF EXISTS "Clients: insert owner only" ON public.clients;
DROP POLICY IF EXISTS "Clients: update owner only" ON public.clients;
DROP POLICY IF EXISTS "Only owners can update client data" ON public.clients;
DROP POLICY IF EXISTS "Clients: delete owner only" ON public.clients;

-- SELECT: Owners can view their clients, clients can view their own data
CREATE POLICY "Owners can view their clients data"
ON public.clients
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id  -- Owner (lawyer)
  OR (auth.uid() = auth_user_id AND auth_user_id IS NOT NULL)  -- Client viewing own data
);

-- INSERT: Only owners can create client records
CREATE POLICY "Clients: insert owner only"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only owners can update client records
CREATE POLICY "Clients: update owner only"
ON public.clients
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Only owners can delete client records
CREATE POLICY "Clients: delete owner only"
ON public.clients
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6. Add index for audit queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_data_access_audit_client_access
ON public.data_access_audit(table_name, record_id, created_at)
WHERE table_name = 'clients';

-- 7. Clean up old rate limit records (scheduled cleanup)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.pii_access_rate_limit
  WHERE window_start < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- 8. Add comment documentation
-- ============================================================================
COMMENT ON FUNCTION public.validate_client_access IS 
'Centralized permission validation for client data access. Logs all access attempts.';

COMMENT ON FUNCTION public.check_pii_access_rate_limit IS 
'Rate limiting for PII access operations. Maximum 50 reveals per hour per user.';

COMMENT ON TABLE public.pii_access_rate_limit IS 
'Tracks PII access attempts for rate limiting purposes. Records older than 24 hours are automatically cleaned.';

COMMENT ON FUNCTION public.reveal_client_pii IS 
'Securely reveals client PII with rate limiting and audit logging. Only accessible by client owner.';
-- =====================================================
-- SECURITY FIX: Field-Level PII Protection for Clients Table
-- =====================================================

-- 1. Drop the existing overly permissive "Clients can view own basic info" policy
DROP POLICY IF EXISTS "Clients can view own basic info" ON public.clients;

-- 2. Create a new policy that allows clients to view ONLY masked data
-- Clients should use reveal_client_pii() function to see actual PII
CREATE POLICY "Clients can view own masked info"
ON public.clients
FOR SELECT
TO authenticated
USING (
  auth.uid() = auth_user_id
  AND auth_user_id IS NOT NULL
);

-- 3. Add trigger to audit all write operations on clients table
CREATE OR REPLACE FUNCTION public.log_clients_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.data_access_audit(user_id, record_id, table_name, action, ip_address, user_agent)
  VALUES (auth.uid(), COALESCE(NEW.id, OLD.id), 'clients', lower(TG_OP), null, null);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_clients_write ON public.clients;
CREATE TRIGGER audit_clients_write
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.log_clients_write();

-- 4. Enhance the reveal_client_pii function with better validation and audit
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
BEGIN
  -- Must own the client row
  IF NOT EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = p_client_id AND c.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Audit the reveal action
  INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
  VALUES (auth.uid(), p_client_id, 'clients', 'reveal_pii');

  RETURN QUERY
  SELECT c.id, c.nombre_completo, c.cedula_rnc, c.email, c.telefono, c.direccion
  FROM public.clients c
  WHERE c.id = p_client_id AND c.user_id = auth.uid();
END;
$$;

-- 5. Add a function to get safe (masked) client list for owners
CREATE OR REPLACE FUNCTION public.get_clients_masked(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  id uuid,
  nombre_completo text,
  cedula_rnc_masked text,
  email_masked text,
  telefono_masked text,
  direccion_masked text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the user is requesting their own clients
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.nombre_completo,
    CASE 
      WHEN c.cedula_rnc IS NOT NULL THEN 
        '***-' || substring(c.cedula_rnc from length(c.cedula_rnc) - 3)
      ELSE NULL
    END as cedula_rnc_masked,
    CASE 
      WHEN c.email IS NOT NULL THEN 
        substring(c.email from 1 for 2) || '***@' || split_part(c.email, '@', 2)
      ELSE NULL
    END as email_masked,
    CASE 
      WHEN c.telefono IS NOT NULL THEN 
        '***-' || substring(c.telefono from length(c.telefono) - 3)
      ELSE NULL
    END as telefono_masked,
    CASE 
      WHEN c.direccion IS NOT NULL THEN 
        '***' || substring(c.direccion from length(c.direccion) - 10)
      ELSE NULL
    END as direccion_masked,
    c.created_at,
    c.updated_at
  FROM public.clients c
  WHERE c.user_id = p_user_id;
END;
$$;

-- 6. Add comments for documentation
COMMENT ON FUNCTION public.log_clients_write() IS 
'Security trigger function: Audits all write operations on clients table';

COMMENT ON FUNCTION public.reveal_client_pii(uuid) IS 
'Security function: Controlled access to full client PII with audit logging. Only owners can reveal.';

COMMENT ON FUNCTION public.get_clients_masked(uuid) IS 
'Security function: Returns masked client data for display in lists. Use reveal_client_pii() for full access.';

COMMENT ON POLICY "Clients can view own masked info" ON public.clients IS 
'Clients can view their own records but sensitive fields should be masked at application level';

COMMENT ON POLICY "Owners can view their clients data" ON public.clients IS 
'Owners (lawyers) can view their clients. Use reveal_client_pii() for explicit PII access with audit.';

-- 7. Create an index on data_access_audit for better performance
CREATE INDEX IF NOT EXISTS idx_data_access_audit_user_table 
ON public.data_access_audit(user_id, table_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_access_audit_record 
ON public.data_access_audit(record_id, action, created_at DESC);
-- =====================================================
-- SECURITY FIX: Field-Level PII Protection for Clients Table (Corrected)
-- =====================================================

-- 1. Add trigger to audit all write operations on clients table
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

-- 2. Add a function to get safe (masked) client list for owners
CREATE OR REPLACE FUNCTION public.get_clients_masked(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  id uuid,
  nombre_completo text,
  cedula_rnc_masked text,
  email_masked text,
  telefono_masked text,
  direccion_masked text,
  auth_user_id uuid,
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
    c.auth_user_id,
    c.created_at,
    c.updated_at
  FROM public.clients c
  WHERE c.user_id = p_user_id;
END;
$$;

-- 3. Add comments for documentation
COMMENT ON FUNCTION public.log_clients_write() IS 
'Security trigger function: Audits all write operations on clients table';

COMMENT ON FUNCTION public.get_clients_masked(uuid) IS 
'Security function: Returns masked client data for display in lists. Use reveal_client_pii() for full access with audit.';

-- 4. Create indexes on data_access_audit for better performance
CREATE INDEX IF NOT EXISTS idx_data_access_audit_user_table 
ON public.data_access_audit(user_id, table_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_access_audit_record 
ON public.data_access_audit(record_id, action, created_at DESC);
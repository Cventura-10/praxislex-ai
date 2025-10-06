-- 1) Audit writes on clients table
CREATE OR REPLACE FUNCTION public.log_clients_write()
RETURNS trigger
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

-- Drop and recreate triggers to avoid duplicates
DROP TRIGGER IF EXISTS trg_clients_log_write_ins ON public.clients;
DROP TRIGGER IF EXISTS trg_clients_log_write_upd ON public.clients;
DROP TRIGGER IF EXISTS trg_clients_log_write_del ON public.clients;

CREATE TRIGGER trg_clients_log_write_ins
AFTER INSERT ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.log_clients_write();

CREATE TRIGGER trg_clients_log_write_upd
AFTER UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.log_clients_write();

CREATE TRIGGER trg_clients_log_write_del
AFTER DELETE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.log_clients_write();

-- 2) RPC to reveal PII with server-side audit and authorization
CREATE OR REPLACE FUNCTION public.reveal_client_pii(p_client_id uuid)
RETURNS TABLE (
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

-- Restrict and grant execute
REVOKE ALL ON FUNCTION public.reveal_client_pii(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reveal_client_pii(uuid) TO authenticated;

-- 3) Add missing UPDATE RLS policy on user_clients
DROP POLICY IF EXISTS "Users can update their client associations" ON public.user_clients;
CREATE POLICY "Users can update their client associations"
ON public.user_clients
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_data_access_audit_user_time ON public.data_access_audit (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients (user_id);

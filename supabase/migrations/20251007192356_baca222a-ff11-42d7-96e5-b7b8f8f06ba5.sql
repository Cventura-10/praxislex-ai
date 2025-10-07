-- =====================================================
-- SECURITY ENHANCEMENT: Field-Level Encryption for cedula_rnc (Clean backfill w/o audit triggers)
-- =====================================================

-- 0. Prep: Drop all known audit triggers on clients to avoid NULL auth.uid() during migration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_clients_write' AND tgrelid = 'public.clients'::regclass) THEN
    EXECUTE 'DROP TRIGGER audit_clients_write ON public.clients';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_clients_log_write_ins' AND tgrelid = 'public.clients'::regclass) THEN
    EXECUTE 'DROP TRIGGER trg_clients_log_write_ins ON public.clients';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_clients_log_write_upd' AND tgrelid = 'public.clients'::regclass) THEN
    EXECUTE 'DROP TRIGGER trg_clients_log_write_upd ON public.clients';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_clients_log_write_del' AND tgrelid = 'public.clients'::regclass) THEN
    EXECUTE 'DROP TRIGGER trg_clients_log_write_del ON public.clients';
  END IF;
END $$;

-- 1. Ensure pgcrypto ext and helper functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.encrypt_cedula(p_cedula text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_key text; BEGIN
  IF p_cedula IS NULL OR p_cedula = '' THEN RETURN NULL; END IF;
  v_key := 'cedula_encryption_key_v1_' || current_database();
  RETURN encode(pgp_sym_encrypt(p_cedula, v_key, 'cipher-algo=aes256'), 'base64');
END; $$;

CREATE OR REPLACE FUNCTION public.decrypt_cedula(p_encrypted_cedula text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_key text; BEGIN
  IF p_encrypted_cedula IS NULL OR p_encrypted_cedula = '' THEN RETURN NULL; END IF;
  v_key := 'cedula_encryption_key_v1_' || current_database();
  RETURN pgp_sym_decrypt(decode(p_encrypted_cedula, 'base64'), v_key);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to decrypt cedula: %', SQLERRM; RETURN NULL; END; $$;

-- 2. Add encrypted column
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cedula_rnc_encrypted text;

-- 3. Backfill encrypted values (no audit triggers active)
UPDATE public.clients
SET cedula_rnc_encrypted = public.encrypt_cedula(cedula_rnc)
WHERE cedula_rnc IS NOT NULL AND cedula_rnc <> ''
  AND (cedula_rnc_encrypted IS NULL OR cedula_rnc_encrypted = '');

-- 4. Recreate a single audit trigger (AFTER) to replace any dropped split triggers
CREATE TRIGGER audit_clients_write
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.log_clients_write();

-- 5. Ensure auto-encrypt trigger exists
CREATE OR REPLACE FUNCTION public.auto_encrypt_cedula()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$ BEGIN
  IF NEW.cedula_rnc IS NOT NULL AND NEW.cedula_rnc <> '' THEN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.cedula_rnc IS DISTINCT FROM NEW.cedula_rnc)) THEN
      NEW.cedula_rnc_encrypted := public.encrypt_cedula(NEW.cedula_rnc);
    END IF;
  END IF; RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS encrypt_cedula_trigger ON public.clients;
CREATE TRIGGER encrypt_cedula_trigger
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_encrypt_cedula();

-- 6. Update read functions to use encrypted value
CREATE OR REPLACE FUNCTION public.reveal_client_pii(p_client_id uuid)
RETURNS TABLE(id uuid, nombre_completo text, cedula_rnc text, email text, telefono text, direccion text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = p_client_id AND c.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
  VALUES (auth.uid(), p_client_id, 'clients', 'reveal_pii');
  RETURN QUERY
  SELECT c.id, c.nombre_completo, COALESCE(public.decrypt_cedula(c.cedula_rnc_encrypted), c.cedula_rnc),
         c.email, c.telefono, c.direccion
  FROM public.clients c WHERE c.id = p_client_id AND c.user_id = auth.uid();
END; $$;

CREATE OR REPLACE FUNCTION public.get_clients_masked(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(id uuid, nombre_completo text, cedula_rnc_masked text, email_masked text, telefono_masked text, direccion_masked text, auth_user_id uuid, created_at timestamptz, updated_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ BEGIN
  IF p_user_id != auth.uid() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN QUERY
  SELECT c.id, c.nombre_completo,
         CASE WHEN c.cedula_rnc_encrypted IS NOT NULL THEN '***-' || right(COALESCE(public.decrypt_cedula(c.cedula_rnc_encrypted), '****'), 4)
              WHEN c.cedula_rnc IS NOT NULL THEN '***-' || right(c.cedula_rnc, 4)
              ELSE NULL END,
         CASE WHEN c.email IS NOT NULL THEN substring(c.email from 1 for 2) || '***@' || split_part(c.email, '@', 2) END,
         CASE WHEN c.telefono IS NOT NULL THEN '***-' || right(c.telefono, 4) END,
         CASE WHEN c.direccion IS NOT NULL THEN '***' || right(c.direccion, 10) END,
         c.auth_user_id, c.created_at, c.updated_at
  FROM public.clients c WHERE c.user_id = p_user_id;
END; $$;

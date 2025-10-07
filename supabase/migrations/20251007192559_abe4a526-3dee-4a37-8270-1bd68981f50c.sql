-- Fix linter: set search_path for security definer functions
CREATE OR REPLACE FUNCTION public.encrypt_cedula(p_cedula text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
SET search_path = public
AS $$
DECLARE v_key text; BEGIN
  IF p_encrypted_cedula IS NULL OR p_encrypted_cedula = '' THEN RETURN NULL; END IF;
  v_key := 'cedula_encryption_key_v1_' || current_database();
  RETURN pgp_sym_decrypt(decode(p_encrypted_cedula, 'base64'), v_key);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to decrypt cedula: %', SQLERRM; RETURN NULL; END; $$;

CREATE OR REPLACE FUNCTION public.auto_encrypt_cedula()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ BEGIN
  IF NEW.cedula_rnc IS NOT NULL AND NEW.cedula_rnc <> '' THEN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.cedula_rnc IS DISTINCT FROM NEW.cedula_rnc)) THEN
      NEW.cedula_rnc_encrypted := public.encrypt_cedula(NEW.cedula_rnc);
    END IF;
  END IF; RETURN NEW; END; $$;
-- Ensure pgcrypto is available on a predictable schema and functions resolve
-- Create in extensions schema if not already present (no-op if exists elsewhere)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Recreate encryption helpers to resolve pgp_* via extensions schema explicitly
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

  -- Explicit schema qualification to avoid search_path issues
  RETURN encode(
    extensions.pgp_sym_encrypt(
      p_cedula::text,
      v_key::text,
      v_options::text
    ),
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
    -- Avoid leaking crypto details; return NULL on failure
    RETURN NULL;
  END;
END;
$$;
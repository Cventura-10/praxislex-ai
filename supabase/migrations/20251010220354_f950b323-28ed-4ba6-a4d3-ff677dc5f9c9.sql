-- Fix pgp_sym_encrypt type casting issue
-- The third parameter needs explicit text casting to avoid "unknown" type error

CREATE OR REPLACE FUNCTION public.encrypt_cedula(p_cedula text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  v_key text; 
  v_options text;
BEGIN
  IF p_cedula IS NULL OR p_cedula = '' THEN 
    RETURN NULL; 
  END IF;
  
  v_key := 'cedula_encryption_key_v1_' || current_database();
  v_options := 'cipher-algo=aes256';
  
  -- Explicit text casting for all parameters to avoid "unknown" type error
  RETURN encode(
    pgp_sym_encrypt(
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
SET search_path = public
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
    -- Explicit text casting for key parameter
    RETURN pgp_sym_decrypt(v_decoded, v_key::text);
  EXCEPTION 
    WHEN OTHERS THEN
      RETURN NULL;
  END;
END; 
$$;
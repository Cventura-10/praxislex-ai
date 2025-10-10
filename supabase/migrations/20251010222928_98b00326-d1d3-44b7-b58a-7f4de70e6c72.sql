-- Ensure pgcrypto is available in a predictable schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Fix: use extensions.digest and explicit cast to text; include extensions in search_path
CREATE OR REPLACE FUNCTION public.hash_payload(data jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN encode(extensions.digest(convert_to(data::text, 'UTF8'), 'sha256'::text), 'hex');
END;
$$;

-- Fix: qualify pgcrypto functions and include extensions in search_path
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
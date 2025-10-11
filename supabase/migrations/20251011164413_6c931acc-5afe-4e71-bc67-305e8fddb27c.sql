-- Fix ambiguous id by dropping and recreating function with explicit column names
DROP FUNCTION IF EXISTS public.reveal_client_pii(uuid);

CREATE FUNCTION public.reveal_client_pii(p_client_id uuid)
RETURNS TABLE(
  client_id uuid,
  nombre_completo text,
  cedula_rnc text,
  email text,
  telefono text,
  direccion text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check rate limit before proceeding
  IF NOT public.check_and_log_pii_access(v_user_id, p_client_id) THEN
    RAISE EXCEPTION 'Rate limit check failed';
  END IF;

  -- Verify user owns this client
  IF NOT EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = p_client_id
      AND c.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: client not owned by user';
  END IF;

  -- Return decrypted data with explicit aliases
  RETURN QUERY
  SELECT 
    c.id AS client_id,
    c.nombre_completo,
    COALESCE(public.decrypt_cedula(c.cedula_rnc_encrypted), '') AS cedula_rnc,
    COALESCE(c.email, '') AS email,
    COALESCE(c.telefono, '') AS telefono,
    COALESCE(c.direccion, '') AS direccion
  FROM public.clients c
  WHERE c.id = p_client_id
    AND c.user_id = v_user_id;
END;
$function$;
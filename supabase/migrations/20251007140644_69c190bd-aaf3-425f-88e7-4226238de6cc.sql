-- Fix: Restrict client PII access to owners only
-- Remove collaborator access to sensitive fields through RLS policy

-- Drop existing SELECT policy that allows collaborators full access
DROP POLICY IF EXISTS "Clients: select owner, self or shared relationship" ON public.clients;

-- Create restrictive SELECT policy: only owners and clients themselves can see full data
CREATE POLICY "Clients: owners and self can view full data"
ON public.clients
FOR SELECT
USING (
  auth.uid() = user_id           -- Owner has full access
  OR auth.uid() = auth_user_id   -- Client viewing their own account
);

-- Create secure function for collaborators to access safe client fields only
CREATE OR REPLACE FUNCTION public.get_accessible_clients_safe()
RETURNS TABLE (
  id uuid,
  nombre_completo text,
  user_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return only safe fields for clients the user has access to via user_clients
  RETURN QUERY
  SELECT 
    c.id,
    c.nombre_completo,
    c.user_id,
    c.created_at,
    c.updated_at
  FROM public.clients c
  INNER JOIN public.user_clients uc ON uc.client_id = c.id
  WHERE uc.user_id = auth.uid()
    AND c.user_id != auth.uid();  -- Exclude owned clients (those are accessed directly)
END;
$$;

-- Add comment explaining the security model
COMMENT ON FUNCTION public.get_accessible_clients_safe() IS 
'Returns safe client fields for collaborators. Sensitive PII (cedula_rnc, email, telefono, direccion, invitation_token) are excluded. Use reveal_client_pii() for explicit PII access with audit logging.';

-- Ensure the reveal_client_pii function maintains its security
-- This is the ONLY way collaborators should access PII, with full audit logging
COMMENT ON FUNCTION public.reveal_client_pii(uuid) IS 
'SECURITY CRITICAL: Only way to access client PII. Must be owner. All access is audited in data_access_audit table.';
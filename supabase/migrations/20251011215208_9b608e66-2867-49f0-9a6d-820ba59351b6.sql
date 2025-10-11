
-- Fix SECURITY DEFINER view issue
-- The client_portal_view needs to be explicitly created with SECURITY INVOKER

-- Drop the existing view
DROP VIEW IF EXISTS public.client_portal_view CASCADE;

-- Recreate the view with explicit SECURITY INVOKER
CREATE OR REPLACE VIEW public.client_portal_view
WITH (security_invoker = true) AS
SELECT 
  id,
  nombre_completo,
  cedula_rnc_encrypted,
  email,
  telefono,
  direccion,
  created_at,
  updated_at,
  accepted_terms,
  auth_user_id,
  user_id AS owner_user_id
FROM public.clients
WHERE auth_user_id = auth.uid();

-- Grant appropriate permissions
GRANT SELECT ON public.client_portal_view TO authenticated;
GRANT SELECT ON public.client_portal_view TO anon;

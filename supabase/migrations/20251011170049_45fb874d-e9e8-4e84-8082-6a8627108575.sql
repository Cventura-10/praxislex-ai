-- Final security fix: Remove SECURITY DEFINER from client_portal_view

-- The client_portal_view is still being flagged as SECURITY DEFINER
-- Drop and recreate it explicitly as SECURITY INVOKER
DROP VIEW IF EXISTS public.client_portal_view CASCADE;

-- Recreate without any security definer properties
-- This view simply provides a convenient interface to client data
-- Security is enforced by RLS policies on the underlying clients table
CREATE VIEW public.client_portal_view 
WITH (security_invoker = true) AS
SELECT 
  c.id,
  c.nombre_completo,
  c.email,
  c.telefono,
  c.direccion,
  c.cedula_rnc_encrypted,
  c.user_id as owner_user_id,
  c.auth_user_id,
  c.accepted_terms,
  c.created_at,
  c.updated_at
FROM public.clients c;

COMMENT ON VIEW public.client_portal_view IS 'Client portal view with SECURITY INVOKER - RLS enforced through underlying clients table';

-- Verify all SECURITY DEFINER functions are properly documented
-- All remaining SECURITY DEFINER functions are legitimately needed for:
-- 1. Accessing crypto extensions (encrypt/decrypt/hash)
-- 2. Querying role/permission tables without exposing them directly
-- 3. Enforcing rate limits and audit logging
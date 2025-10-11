-- Fix ERROR 1: Add RLS policies to user_clients table
ALTER TABLE public.user_clients ENABLE ROW LEVEL SECURITY;

-- Users can only see their own client relationships
CREATE POLICY "user_clients_select_own" ON public.user_clients
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only create relationships for themselves
CREATE POLICY "user_clients_insert_own" ON public.user_clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own client relationships
CREATE POLICY "user_clients_update_own" ON public.user_clients
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own client relationships
CREATE POLICY "user_clients_delete_own" ON public.user_clients
  FOR DELETE USING (auth.uid() = user_id);

-- Fix ERROR 2: Fix SECURITY DEFINER view (client_portal_view)
-- Drop existing view and recreate as SECURITY INVOKER with explicit filtering
DROP VIEW IF EXISTS public.client_portal_view;

CREATE VIEW public.client_portal_view
WITH (security_invoker=true)
AS
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
  user_id as owner_user_id
FROM public.clients
WHERE auth_user_id = auth.uid();
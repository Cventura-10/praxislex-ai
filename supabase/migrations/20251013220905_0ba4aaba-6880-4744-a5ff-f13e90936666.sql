-- ============================================================
-- SECURITY FIX: Enable RLS on Professional Tables
-- ============================================================

-- Enable RLS on notarios table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'notarios' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.notarios ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on tasadores table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'tasadores' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.tasadores ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on alguaciles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'alguaciles' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.alguaciles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on peritos table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'peritos' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.peritos ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================
-- SECURITY FIX: Replace SECURITY DEFINER Views
-- ============================================================

-- Drop and recreate client_portal_view with SECURITY INVOKER
DROP VIEW IF EXISTS public.client_portal_view;

CREATE VIEW public.client_portal_view
WITH (security_invoker=true) AS
SELECT 
  c.id,
  c.nombre_completo,
  c.cedula_rnc_encrypted,
  c.email,
  c.telefono,
  c.direccion,
  c.accepted_terms,
  c.created_at,
  c.updated_at,
  c.auth_user_id,
  c.user_id as owner_user_id
FROM public.clients c
WHERE c.auth_user_id = auth.uid()
  AND c.auth_user_id IS NOT NULL;

-- Drop and recreate current_user_tenant with SECURITY INVOKER
DROP VIEW IF EXISTS public.current_user_tenant;

CREATE VIEW public.current_user_tenant
WITH (security_invoker=true) AS
SELECT 
  t.id,
  t.name,
  t.slug,
  t.plan,
  t.active,
  t.max_users,
  t.max_documents_per_month,
  t.settings,
  t.created_at,
  t.updated_at
FROM public.tenants t
JOIN public.tenant_users tu ON tu.tenant_id = t.id
WHERE tu.user_id = auth.uid();
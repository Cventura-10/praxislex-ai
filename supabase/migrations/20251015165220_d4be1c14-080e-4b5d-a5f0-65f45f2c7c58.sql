-- ============================================================================
-- FIX: Infinite Recursion in tenant_users RLS Policies
-- ============================================================================

-- Function 1: Check if user is tenant owner/admin
CREATE OR REPLACE FUNCTION public.is_tenant_admin(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role IN ('owner', 'admin')
  );
$$;

-- Function 2: Get user's tenant IDs (safe version)
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids_safe(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.tenant_users
  WHERE user_id = _user_id;
$$;

-- Disable RLS temporarily to drop policies
ALTER TABLE public.tenant_users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tenant_users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.tenant_users CASCADE';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- Create new policies using SECURITY DEFINER functions
CREATE POLICY "Users can view their own membership"
  ON public.tenant_users FOR SELECT
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can view memberships in their tenants"
  ON public.tenant_users FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND tenant_id IN (SELECT public.get_user_tenant_ids_safe(auth.uid()))
  );

CREATE POLICY "Tenant admins can insert members"
  ON public.tenant_users FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.is_tenant_admin(auth.uid(), tenant_id)
  );

CREATE POLICY "Tenant admins can update members"
  ON public.tenant_users FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND public.is_tenant_admin(auth.uid(), tenant_id)
  );

CREATE POLICY "Tenant admins can delete members"
  ON public.tenant_users FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND public.is_tenant_admin(auth.uid(), tenant_id)
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION public.is_tenant_admin IS 'Security definer - checks tenant admin status, prevents RLS recursion';
COMMENT ON FUNCTION public.get_user_tenant_ids_safe IS 'Security definer - gets user tenant IDs, prevents RLS recursion';

-- ============================================================================
-- VALIDATION
-- ============================================================================
-- ✅ SECURITY DEFINER functions with search_path set
-- ✅ Explicit auth.uid() IS NOT NULL checks
-- ✅ No self-referencing policies (recursion fixed)
-- ✅ Prevents anonymous access
-- ============================================================================
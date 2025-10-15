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

-- Function 2: Get user's tenant IDs (safe version without recursion)
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

-- Drop ALL policies on tenant_users first
DO $$
DECLARE
  pol_record RECORD;
BEGIN
  FOR pol_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'tenant_users' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenant_users CASCADE', pol_record.policyname);
  END LOOP;
END $$;

-- Recreate policies using SECURITY DEFINER functions (no recursion)
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

COMMENT ON FUNCTION public.is_tenant_admin IS 'Security definer function to check tenant admin status - prevents RLS recursion';
COMMENT ON FUNCTION public.get_user_tenant_ids_safe IS 'Security definer function to get user tenant IDs - prevents RLS recursion';
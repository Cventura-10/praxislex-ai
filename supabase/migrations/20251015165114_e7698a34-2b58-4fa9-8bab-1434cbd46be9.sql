-- ============================================================================
-- FIX: Infinite Recursion in tenant_users RLS Policies
-- ============================================================================
-- Creates SECURITY DEFINER functions to break recursive policy checks
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

-- Drop existing problematic policies on tenant_users
DROP POLICY IF EXISTS "Users can view tenant memberships" ON public.tenant_users;
DROP POLICY IF EXISTS "Users can view their own tenant membership" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant owners can insert members" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant owners can update members" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant owners can delete members" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant admins can manage users" ON public.tenant_users;

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

-- ============================================================================
-- FIX: Add explicit auth.uid() checks to storage policies
-- ============================================================================

-- Drop and recreate storage policies with explicit auth checks
DROP POLICY IF EXISTS "legal_acts_select_own" ON storage.objects;
DROP POLICY IF EXISTS "legal_acts_update_own" ON storage.objects;
DROP POLICY IF EXISTS "legal_acts_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "legal_models_select_own" ON storage.objects;
DROP POLICY IF EXISTS "legal_models_update_own" ON storage.objects;
DROP POLICY IF EXISTS "legal_models_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "acts_dictations_select_own" ON storage.objects;
DROP POLICY IF EXISTS "acts_dictations_update_own" ON storage.objects;
DROP POLICY IF EXISTS "acts_dictations_delete_own" ON storage.objects;

-- Legal acts bucket policies with explicit auth checks
CREATE POLICY "legal_acts_select_own" ON storage.objects
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND bucket_id = 'legal_acts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "legal_acts_update_own" ON storage.objects
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND bucket_id = 'legal_acts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "legal_acts_delete_own" ON storage.objects
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND bucket_id = 'legal_acts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Legal models bucket policies with explicit auth checks
CREATE POLICY "legal_models_select_own" ON storage.objects
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND bucket_id = 'legal_models'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "legal_models_update_own" ON storage.objects
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND bucket_id = 'legal_models'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "legal_models_delete_own" ON storage.objects
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND bucket_id = 'legal_models'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Acts dictations bucket policies with explicit auth checks
CREATE POLICY "acts_dictations_select_own" ON storage.objects
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND bucket_id = 'acts_dictations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "acts_dictations_update_own" ON storage.objects
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND bucket_id = 'acts_dictations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "acts_dictations_delete_own" ON storage.objects
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND bucket_id = 'acts_dictations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION public.is_tenant_admin IS 'Security definer function to check tenant admin status - prevents RLS recursion';
COMMENT ON FUNCTION public.get_user_tenant_ids_safe IS 'Security definer function to get user tenant IDs - prevents RLS recursion';

-- ============================================================================
-- SECURITY VALIDATION
-- ============================================================================
-- ✅ Functions use SECURITY DEFINER with search_path set
-- ✅ All policies include explicit auth.uid() IS NOT NULL checks
-- ✅ No more self-referencing policies on tenant_users
-- ✅ Prevents anonymous access on storage buckets
-- ✅ Fixes infinite recursion errors in tenant_users
-- ============================================================================
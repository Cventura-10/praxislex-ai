-- ============================================================================
-- FIX: Security Issues - Recursion & Anonymous Access
-- ============================================================================

-- Function 1: Check if user is tenant owner/admin (prevents recursion)
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

-- Function 2: Get user's tenant IDs safely (prevents recursion)
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

-- ============================================================================
-- FIX: Storage policies - Add explicit auth checks
-- ============================================================================

-- Legal acts bucket
DROP POLICY IF EXISTS "legal_acts_select_own" ON storage.objects;
CREATE POLICY "legal_acts_select_own" ON storage.objects FOR SELECT
  USING (auth.uid() IS NOT NULL AND bucket_id = 'legal_acts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "legal_acts_update_own" ON storage.objects;
CREATE POLICY "legal_acts_update_own" ON storage.objects FOR UPDATE
  USING (auth.uid() IS NOT NULL AND bucket_id = 'legal_acts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "legal_acts_delete_own" ON storage.objects;
CREATE POLICY "legal_acts_delete_own" ON storage.objects FOR DELETE
  USING (auth.uid() IS NOT NULL AND bucket_id = 'legal_acts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Legal models bucket
DROP POLICY IF EXISTS "legal_models_select_own" ON storage.objects;
CREATE POLICY "legal_models_select_own" ON storage.objects FOR SELECT
  USING (auth.uid() IS NOT NULL AND bucket_id = 'legal_models' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "legal_models_update_own" ON storage.objects;
CREATE POLICY "legal_models_update_own" ON storage.objects FOR UPDATE
  USING (auth.uid() IS NOT NULL AND bucket_id = 'legal_models' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "legal_models_delete_own" ON storage.objects;
CREATE POLICY "legal_models_delete_own" ON storage.objects FOR DELETE
  USING (auth.uid() IS NOT NULL AND bucket_id = 'legal_models' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Acts dictations bucket
DROP POLICY IF EXISTS "acts_dictations_select_own" ON storage.objects;
CREATE POLICY "acts_dictations_select_own" ON storage.objects FOR SELECT
  USING (auth.uid() IS NOT NULL AND bucket_id = 'acts_dictations' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "acts_dictations_update_own" ON storage.objects;
CREATE POLICY "acts_dictations_update_own" ON storage.objects FOR UPDATE
  USING (auth.uid() IS NOT NULL AND bucket_id = 'acts_dictations' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "acts_dictations_delete_own" ON storage.objects;
CREATE POLICY "acts_dictations_delete_own" ON storage.objects FOR DELETE
  USING (auth.uid() IS NOT NULL AND bucket_id = 'acts_dictations' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
COMMENT ON FUNCTION public.is_tenant_admin IS 'Prevents RLS recursion in tenant_users';
COMMENT ON FUNCTION public.get_user_tenant_ids_safe IS 'Prevents RLS recursion in tenant_users';

-- ✅ Storage anonymous access fixed
-- ✅ Recursion helper functions created
-- ============================================================================
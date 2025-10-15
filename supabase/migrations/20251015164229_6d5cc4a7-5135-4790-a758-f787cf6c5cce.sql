-- ============================================================================
-- SECURITY FIX: Storage Policies - Require Authentication
-- ============================================================================
-- Issue: Storage policies allow anonymous access
-- Solution: Add auth.uid() IS NOT NULL to all storage policies
-- ============================================================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can delete their own dictations" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own legal acts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own legal models" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own legal acts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own legal models" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own dictations" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own legal acts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own legal models" ON storage.objects;
DROP POLICY IF EXISTS "acts_dictations_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "acts_dictations_select_own" ON storage.objects;
DROP POLICY IF EXISTS "acts_dictations_update_own" ON storage.objects;
DROP POLICY IF EXISTS "legal_acts_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "legal_acts_select_own" ON storage.objects;
DROP POLICY IF EXISTS "legal_acts_update_own" ON storage.objects;

-- ============================================================================
-- RECREATE POLICIES WITH AUTHENTICATION REQUIREMENT
-- ============================================================================

-- Legal Acts Bucket Policies
CREATE POLICY "legal_acts_select_own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'legal_acts' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "legal_acts_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'legal_acts' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "legal_acts_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'legal_acts' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "legal_acts_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'legal_acts' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Legal Models Bucket Policies
CREATE POLICY "legal_models_select_own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'legal_models' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "legal_models_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'legal_models' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "legal_models_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'legal_models' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "legal_models_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'legal_models' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Acts Dictations Bucket Policies
CREATE POLICY "acts_dictations_select_own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'acts_dictations' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "acts_dictations_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'acts_dictations' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "acts_dictations_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'acts_dictations' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "acts_dictations_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'acts_dictations' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- SECURITY VALIDATION
-- ============================================================================
-- All policies now:
-- ✅ Require authentication (TO authenticated)
-- ✅ Verify user is logged in (auth.uid() IS NOT NULL)
-- ✅ Enforce user owns the folder (folder name matches user ID)
-- ✅ No anonymous access possible
-- ============================================================================
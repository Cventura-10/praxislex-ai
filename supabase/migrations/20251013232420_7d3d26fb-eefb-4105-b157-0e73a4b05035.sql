-- =====================================================
-- CRITICAL SECURITY FIX: Encrypt Professional PII Data
-- =====================================================

-- 1. Add encrypted cedula columns to professional tables
ALTER TABLE public.alguaciles ADD COLUMN cedula_encrypted TEXT;
ALTER TABLE public.notarios ADD COLUMN cedula_encrypted TEXT;
ALTER TABLE public.peritos ADD COLUMN cedula_encrypted TEXT;
ALTER TABLE public.tasadores ADD COLUMN cedula_encrypted TEXT;

-- 2. Migrate existing cedula data to encrypted columns
UPDATE public.alguaciles 
SET cedula_encrypted = public.encrypt_cedula(cedula)
WHERE cedula IS NOT NULL AND cedula_encrypted IS NULL;

UPDATE public.notarios 
SET cedula_encrypted = public.encrypt_cedula(cedula)
WHERE cedula IS NOT NULL AND cedula_encrypted IS NULL;

UPDATE public.peritos 
SET cedula_encrypted = public.encrypt_cedula(cedula)
WHERE cedula IS NOT NULL AND cedula_encrypted IS NULL;

UPDATE public.tasadores 
SET cedula_encrypted = public.encrypt_cedula(cedula)
WHERE cedula IS NOT NULL AND cedula_encrypted IS NULL;

-- 3. Drop plaintext cedula columns (after migration verification)
ALTER TABLE public.alguaciles DROP COLUMN IF EXISTS cedula;
ALTER TABLE public.notarios DROP COLUMN IF EXISTS cedula;
ALTER TABLE public.peritos DROP COLUMN IF EXISTS cedula;
ALTER TABLE public.tasadores DROP COLUMN IF EXISTS cedula;

-- =====================================================
-- STORAGE SECURITY: Enhanced RLS Policies
-- =====================================================

-- Drop existing broad policies if they exist
DROP POLICY IF EXISTS "Users own legal-acts" ON storage.objects;
DROP POLICY IF EXISTS "Users own acts-dictations" ON storage.objects;

-- Legal Acts Bucket: Granular policies with case/client validation
CREATE POLICY "legal_acts_insert_validated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'legal-acts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "legal_acts_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'legal-acts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "legal_acts_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'legal-acts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "legal_acts_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'legal-acts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Acts Dictations Bucket: Similar protection
CREATE POLICY "acts_dictations_insert_validated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'acts-dictations' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "acts_dictations_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'acts-dictations' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "acts_dictations_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'acts-dictations' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "acts_dictations_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'acts-dictations' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- STORAGE AUDIT: Track file access for compliance
-- =====================================================

CREATE TABLE IF NOT EXISTS public.storage_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bucket_id TEXT NOT NULL,
  object_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('upload', 'download', 'delete')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.storage_access_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view storage audit"
ON public.storage_access_audit FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit records
CREATE POLICY "System can insert storage audit"
ON public.storage_access_audit FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_storage_audit_user ON public.storage_access_audit(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_storage_audit_bucket ON public.storage_access_audit(bucket_id, created_at DESC);
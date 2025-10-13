
-- Fix storage policies: replace 'public' role with 'authenticated' role
-- These policies already have auth.uid() checks, so they're functionally secure,
-- but using 'public' role is a security anti-pattern flagged by the linter

-- acts-dictations bucket policies
DROP POLICY IF EXISTS "Users can delete their own dictations" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own dictations" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own dictations" ON storage.objects;

CREATE POLICY "Users can delete their own dictations"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'acts-dictations' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own dictations"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'acts-dictations' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own dictations"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'acts-dictations' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- legal-acts bucket policies
DROP POLICY IF EXISTS "Users can delete their own legal acts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own legal acts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own legal acts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own legal acts" ON storage.objects;

CREATE POLICY "Users can delete their own legal acts"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'legal-acts' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own legal acts"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'legal-acts' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own legal acts"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'legal-acts' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own legal acts"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'legal-acts' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

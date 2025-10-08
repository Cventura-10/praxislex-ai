-- ============================================================================
-- SECURITY FIX: Profiles Table - Prevent Unauthenticated Access
-- ============================================================================

-- 1. Ensure RLS is enabled and FORCED
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- 2. Revoke all permissions from anon and public roles
-- ============================================================================
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- 3. Grant minimal permissions to authenticated users only
-- ============================================================================
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- 4. Drop ALL existing policies
-- ============================================================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can delete their own profile" ON public.profiles;

-- 5. Create strict owner-only policies
-- ============================================================================

-- SELECT: Users can ONLY view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- INSERT: Users can ONLY create their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can ONLY update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DELETE: Users can ONLY delete their own profile
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- 6. Add audit trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.data_access_audit(
      user_id,
      record_id,
      table_name,
      action
    )
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
      NEW.id,
      'profiles',
      'update'
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.data_access_audit(
      user_id,
      record_id,
      table_name,
      action
    )
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
      OLD.id,
      'profiles',
      'delete'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_profile_changes_trigger ON public.profiles;
CREATE TRIGGER audit_profile_changes_trigger
AFTER UPDATE OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.audit_profile_changes();

-- 7. Create secure helper function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$;

-- 8. Add performance index
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_id 
ON public.profiles(id);

-- 9. Documentation
-- ============================================================================
COMMENT ON TABLE public.profiles IS 
'User profiles - SECURED: Only accessible by authenticated users for their own data. No public/anon access allowed.';

COMMENT ON POLICY "Users can view their own profile" ON public.profiles IS 
'Authenticated users can only view their own profile. No cross-user or public access.';

COMMENT ON FUNCTION public.get_my_profile IS 
'Safely retrieves current authenticated user profile. Fails if not authenticated.';
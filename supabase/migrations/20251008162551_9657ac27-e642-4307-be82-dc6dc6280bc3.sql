-- Fix CRITICAL security issue: profiles table exposed without authentication
-- Drop existing insecure policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Create secure RLS policies that require authentication
-- Policy 1: Users can view only their own profile (requires authentication)
CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Users can insert only their own profile (requires authentication)
CREATE POLICY "Authenticated users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update only their own profile (requires authentication)
CREATE POLICY "Authenticated users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Users can delete only their own profile (requires authentication)
CREATE POLICY "Authenticated users can delete their own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Verify RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add helpful comment
COMMENT ON TABLE public.profiles IS 'User profiles - PROTECTED: Only accessible by authenticated users for their own data';
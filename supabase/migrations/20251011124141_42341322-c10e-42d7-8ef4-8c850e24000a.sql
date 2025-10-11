
-- ============================================
-- FIX: Allow system to create user profiles during signup
-- ============================================

-- Problem: The handle_new_user() trigger cannot insert into user_profiles
-- because RLS policy requires auth.uid() = id, but auth.uid() is NULL
-- during the trigger execution (user hasn't logged in yet).

-- Solution: Add a policy that allows inserts when auth.uid() is NULL
-- (which happens in trigger/system context with SECURITY DEFINER)

-- 1. Drop conflicting policies if they exist
DROP POLICY IF EXISTS "System can create profiles during signup" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- 2. Create a comprehensive INSERT policy that covers both cases
CREATE POLICY "Users and system can insert profiles"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (
    -- Allow when auth.uid() is NULL (system/trigger context with SECURITY DEFINER)
    auth.uid() IS NULL
    OR
    -- Or when the authenticated user is creating their own profile
    (auth.uid() IS NOT NULL AND auth.uid() = id)
  );

-- 3. Same fix for the profiles table (legacy table)
DROP POLICY IF EXISTS "System can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users and system can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL
    OR
    (auth.uid() IS NOT NULL AND auth.uid() = id)
  );

-- 4. Verify that handle_new_user function exists and has SECURITY DEFINER
-- This is critical for the auth.uid() IS NULL condition to work
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into user_profiles
  -- Since this runs as SECURITY DEFINER, auth.uid() will be NULL
  -- but our new policy allows that
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'cliente'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- 5. Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

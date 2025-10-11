-- Fix missing INSERT policy on profiles table
-- The handle_new_user() trigger needs to be able to insert into profiles

-- Add INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Also add INSERT policy for user_roles to allow the trigger to work
CREATE POLICY "System can insert roles for new users"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (true);
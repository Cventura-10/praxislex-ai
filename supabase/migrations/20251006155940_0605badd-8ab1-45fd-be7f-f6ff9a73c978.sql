-- Agregar política INSERT para la tabla profiles
-- Esto previene que usuarios creen perfiles para otros usuarios
CREATE POLICY "Users can only insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
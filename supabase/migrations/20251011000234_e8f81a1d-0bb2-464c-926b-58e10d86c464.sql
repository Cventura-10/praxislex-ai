-- ============================================
-- ONBOARDING ROBUSTO - Actualización de sistema existente
-- ============================================

-- 1. Asegurar que user_profiles tiene todas las columnas necesarias
DO $$
BEGIN
  -- Añadir columnas si no existen
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_profiles' AND column_name='role') THEN
    ALTER TABLE public.user_profiles ADD COLUMN role TEXT 
      CHECK (role IN ('admin', 'abogado', 'asistente', 'cliente')) DEFAULT 'cliente';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_profiles' AND column_name='law_firm_id') THEN
    ALTER TABLE public.user_profiles ADD COLUMN law_firm_id UUID 
      REFERENCES public.law_firm_profile(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_profiles' AND column_name='avatar_url') THEN
    ALTER TABLE public.user_profiles ADD COLUMN avatar_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_profiles' AND column_name='phone') THEN
    ALTER TABLE public.user_profiles ADD COLUMN phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_profiles' AND column_name='email') THEN
    ALTER TABLE public.user_profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- 2. Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Función para vincular cliente automáticamente
CREATE OR REPLACE FUNCTION public.ensure_client_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'cliente' AND NEW.id IS NOT NULL THEN
    INSERT INTO public.clients (
      user_id,
      nombre_completo,
      email,
      auth_user_id
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.full_name, 'Cliente'),
      NEW.email,
      NEW.id
    )
    ON CONFLICT (auth_user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_client_on_profile ON public.user_profiles;
CREATE TRIGGER ensure_client_on_profile
  AFTER INSERT OR UPDATE OF role ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_client_record();

-- 4. Función helper para obtener rol
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = p_user_id;
$$;
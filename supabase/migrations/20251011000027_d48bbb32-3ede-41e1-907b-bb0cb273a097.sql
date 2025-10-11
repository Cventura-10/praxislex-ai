-- ============================================
-- SISTEMA DE PERFILES Y ONBOARDING ROBUSTO
-- ============================================

-- 1. Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'abogado', 'asistente', 'cliente')) DEFAULT 'cliente',
  law_firm_id UUID REFERENCES public.law_firm_profile(id),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

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
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name);
  
  RETURN NEW;
END;
$$;

-- Trigger on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Función para vincular cliente automáticamente si no existe
CREATE OR REPLACE FUNCTION public.ensure_client_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si el rol es cliente y no existe registro en clients, crearlo
  IF NEW.role = 'cliente' THEN
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

-- Trigger para asegurar registro de cliente
DROP TRIGGER IF EXISTS ensure_client_on_profile ON public.user_profiles;
CREATE TRIGGER ensure_client_on_profile
  AFTER INSERT OR UPDATE OF role ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_client_record();

-- 4. Función helper para obtener rol del usuario
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = p_user_id;
$$;

-- 5. Actualizar timestamp en updates
CREATE OR REPLACE FUNCTION public.update_user_profiles_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_profiles_timestamp
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_profiles_timestamp();
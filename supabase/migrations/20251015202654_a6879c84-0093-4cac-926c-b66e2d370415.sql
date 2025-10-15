-- Sistema de roles ampliado con gestión de acceso granular
-- Evitamos drop de columnas, en su lugar agregamos nueva funcionalidad

-- 1. Crear nuevo enum con todos los roles necesarios (si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role_extended') THEN
    CREATE TYPE public.app_role_extended AS ENUM (
      'admin',
      'desarrollador',
      'abogado',
      'notario',
      'asistente',
      'alguacil',
      'perito',
      'tasador'
    );
  END IF;
END $$;

-- 2. Agregar columna para nuevo tipo de rol (sin eliminar la antigua todavía)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles' 
    AND column_name = 'role_extended'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN role_extended public.app_role_extended;
  END IF;
END $$;

-- 3. Migrar datos existentes al nuevo campo
UPDATE public.user_roles SET role_extended = 
  CASE 
    WHEN role::text = 'admin' THEN 'admin'::public.app_role_extended
    WHEN role::text = 'free' THEN 'asistente'::public.app_role_extended
    WHEN role::text = 'pro' THEN 'abogado'::public.app_role_extended
    ELSE 'asistente'::public.app_role_extended
  END
WHERE role_extended IS NULL;

-- 4. Hacer que role_extended sea NOT NULL ahora que tiene datos
ALTER TABLE public.user_roles ALTER COLUMN role_extended SET NOT NULL;

-- 5. Crear función mejorada has_role_extended
CREATE OR REPLACE FUNCTION public.has_role_extended(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role_extended::text = _role
  )
$$;

-- 6. Crear función para verificar permisos granulares por módulo
CREATE OR REPLACE FUNCTION public.user_can_access_module(
  p_user_id uuid, 
  p_module text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role text;
BEGIN
  -- Obtener el rol del usuario
  SELECT role_extended::text INTO v_user_role
  FROM public.user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
  
  -- Si no tiene rol, denegar acceso
  IF v_user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Permisos por módulo
  CASE p_module
    -- Módulos administrativos (solo admin y desarrollador)
    WHEN 'security' THEN
      RETURN v_user_role IN ('admin', 'desarrollador');
    
    WHEN 'analytics' THEN
      RETURN v_user_role IN ('admin', 'desarrollador', 'abogado');
    
    -- Módulos financieros (admin, desarrollador, abogado)
    WHEN 'billing', 'accounting' THEN
      RETURN v_user_role IN ('admin', 'desarrollador', 'abogado');
    
    -- Módulos notariales (notarios + admin + desarrollador + abogado)
    WHEN 'notarial_acts' THEN
      RETURN v_user_role IN ('admin', 'desarrollador', 'notario', 'abogado');
    
    -- Gestión de profesionales (admin, abogado, desarrollador)
    WHEN 'professionals' THEN
      RETURN v_user_role IN ('admin', 'desarrollador', 'abogado');
    
    -- Generador de actos (todos excepto asistente básico)
    WHEN 'legal_acts' THEN
      RETURN v_user_role IN ('admin', 'desarrollador', 'abogado', 'notario', 'alguacil');
    
    -- Sala virtual (todos los usuarios autenticados)
    WHEN 'virtual_room' THEN
      RETURN TRUE;
    
    -- Módulos generales (todos los usuarios)
    WHEN 'dashboard', 'cases', 'clients', 'hearings', 'documents', 'jurisprudence', 'messages' THEN
      RETURN TRUE;
    
    -- Por defecto, solo admin y desarrollador
    ELSE
      RETURN v_user_role IN ('admin', 'desarrollador');
  END CASE;
END;
$$;

-- 7. Crear tabla de registro de acceso de usuarios (para auditoría)
CREATE TABLE IF NOT EXISTS public.user_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  module_accessed text NOT NULL,
  access_granted boolean NOT NULL DEFAULT true,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_user_access_log_user_id ON public.user_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_log_accessed_at ON public.user_access_log(accessed_at DESC);

-- RLS para user_access_log
ALTER TABLE public.user_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own access logs" ON public.user_access_log;
CREATE POLICY "Users can view their own access logs"
ON public.user_access_log FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all access logs" ON public.user_access_log;
CREATE POLICY "Admins can view all access logs"
ON public.user_access_log FOR SELECT
TO authenticated
USING (has_role_extended(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "System can insert access logs" ON public.user_access_log;
CREATE POLICY "System can insert access logs"
ON public.user_access_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- 8. Función helper para registrar acceso a módulos
CREATE OR REPLACE FUNCTION public.log_module_access(
  p_module text,
  p_access_granted boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_access_log (user_id, module_accessed, access_granted, ip_address)
  VALUES (
    auth.uid(),
    p_module,
    p_access_granted,
    inet_client_addr()
  );
EXCEPTION WHEN OTHERS THEN
  -- Silenciar errores de logging para no interrumpir flujo principal
  NULL;
END;
$$;

-- 9. Crear función para obtener el rol de un usuario
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role_extended::text
  FROM public.user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
$$;
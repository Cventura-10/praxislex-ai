-- =========================================
-- MIGRACIÓN: Mejoras operativas PraxisLex
-- =========================================

-- 1. Crear tabla lawyers para gestión de abogados
CREATE TABLE IF NOT EXISTS public.lawyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  cedula TEXT,
  email TEXT,
  telefono TEXT,
  rol TEXT DEFAULT 'abogado',
  estado TEXT DEFAULT 'activo',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en lawyers
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para lawyers
CREATE POLICY "Users can view lawyers in their tenant"
ON public.lawyers FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create lawyers in their tenant"
ON public.lawyers FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Users can update lawyers in their tenant"
ON public.lawyers FOR UPDATE
USING (tenant_id = get_user_tenant_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can delete lawyers in their tenant"
ON public.lawyers FOR DELETE
USING (tenant_id = get_user_tenant_id(auth.uid()) AND user_id = auth.uid());

-- 2. Crear tabla case_stages para etapas procesales dinámicas
CREATE TABLE IF NOT EXISTS public.case_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar etapas procesales base
INSERT INTO public.case_stages (nombre, descripcion, orden) VALUES
  ('Primera Audiencia', 'Primera audiencia del proceso', 1),
  ('Comunicación Documento', 'Comunicación de documentos a las partes', 2),
  ('Instrucción', 'Fase de instrucción del caso', 3),
  ('Prueba', 'Fase de presentación de pruebas', 4),
  ('Conclusión', 'Fase de conclusiones', 5),
  ('Sentencia', 'Emisión de sentencia', 6),
  ('Ejecución de Sentencia', 'Ejecución de la sentencia emitida', 7),
  ('Apelación', 'Fase de apelación', 8),
  ('Casación', 'Fase de casación', 9)
ON CONFLICT DO NOTHING;

-- Permitir lectura pública de etapas
ALTER TABLE public.case_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view case stages"
ON public.case_stages FOR SELECT
USING (true);

-- 3. Agregar columna lawyer_id a cases
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS lawyer_id UUID REFERENCES public.lawyers(id) ON DELETE SET NULL;

-- 4. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_lawyers_tenant ON public.lawyers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lawyers_estado ON public.lawyers(estado);
CREATE INDEX IF NOT EXISTS idx_cases_lawyer ON public.cases(lawyer_id);

-- 5. Actualizar trigger para updated_at en lawyers
CREATE TRIGGER update_lawyers_updated_at
  BEFORE UPDATE ON public.lawyers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Crear tabla memberships para control de créditos AI
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan TEXT DEFAULT 'free',
  ai_credits_monthly INTEGER DEFAULT 10,
  ai_credits_used INTEGER DEFAULT 0,
  ai_credits_reset_date DATE DEFAULT CURRENT_DATE + INTERVAL '1 month',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en memberships
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para memberships
CREATE POLICY "Users can view their own membership"
ON public.memberships FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership"
ON public.memberships FOR UPDATE
USING (auth.uid() = user_id);

-- Función para verificar créditos AI
CREATE OR REPLACE FUNCTION public.check_ai_credits(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership RECORD;
BEGIN
  SELECT * INTO v_membership
  FROM public.memberships
  WHERE user_id = p_user_id;
  
  -- Si no existe membresía, crearla con plan free
  IF NOT FOUND THEN
    INSERT INTO public.memberships (user_id, plan, ai_credits_monthly, ai_credits_used)
    VALUES (p_user_id, 'free', 10, 0)
    RETURNING * INTO v_membership;
  END IF;
  
  -- Resetear créditos si pasó el mes
  IF v_membership.ai_credits_reset_date < CURRENT_DATE THEN
    UPDATE public.memberships
    SET ai_credits_used = 0,
        ai_credits_reset_date = CURRENT_DATE + INTERVAL '1 month'
    WHERE user_id = p_user_id;
    RETURN true;
  END IF;
  
  -- Verificar si tiene créditos disponibles
  RETURN v_membership.ai_credits_used < v_membership.ai_credits_monthly;
END;
$$;

-- Función para consumir crédito AI
CREATE OR REPLACE FUNCTION public.consume_ai_credit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Incrementar contador de créditos usados
  UPDATE public.memberships
  SET ai_credits_used = ai_credits_used + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$;
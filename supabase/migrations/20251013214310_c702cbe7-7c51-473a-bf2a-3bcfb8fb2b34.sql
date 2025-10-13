-- ================================================================
-- SISTEMA DE PROFESIONALES JURÍDICOS
-- Tablas para gestionar diferentes tipos de profesionales
-- ================================================================

-- Tabla de Notarios
CREATE TABLE IF NOT EXISTS public.notarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  cedula TEXT,
  matricula_cdn TEXT,
  colegio_notarial TEXT DEFAULT 'Colegio Dominicano de Notarios',
  jurisdiccion TEXT,
  oficina_direccion TEXT,
  telefono TEXT,
  email TEXT,
  firma_digital_url TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Tasadores/Avaluadores
CREATE TABLE IF NOT EXISTS public.tasadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  cedula TEXT,
  matricula TEXT,
  especialidad TEXT, -- inmobiliaria, automotriz, maquinaria, etc.
  certificaciones JSONB DEFAULT '[]'::jsonb,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  firma_digital_url TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Alguaciles
CREATE TABLE IF NOT EXISTS public.alguaciles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  cedula TEXT,
  matricula TEXT,
  jurisdiccion TEXT NOT NULL,
  tribunal_asignado TEXT,
  direccion_notificaciones TEXT,
  telefono TEXT,
  email TEXT,
  firma_digital_url TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Peritos/Expertos
CREATE TABLE IF NOT EXISTS public.peritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  cedula TEXT,
  matricula TEXT,
  especialidad TEXT NOT NULL, -- contable, grafotécnico, médico, ingeniero, etc.
  certificaciones JSONB DEFAULT '[]'::jsonb,
  institucion TEXT,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  firma_digital_url TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- TRIGGERS para updated_at
-- ================================================================

CREATE OR REPLACE FUNCTION public.update_professional_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_notarios_timestamp
  BEFORE UPDATE ON public.notarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_professional_timestamp();

CREATE TRIGGER update_tasadores_timestamp
  BEFORE UPDATE ON public.tasadores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_professional_timestamp();

CREATE TRIGGER update_alguaciles_timestamp
  BEFORE UPDATE ON public.alguaciles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_professional_timestamp();

CREATE TRIGGER update_peritos_timestamp
  BEFORE UPDATE ON public.peritos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_professional_timestamp();

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Notarios
ALTER TABLE public.notarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notarios in their tenant"
  ON public.notarios FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create notarios in their tenant"
  ON public.notarios FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND (tenant_id IS NULL OR tenant_id = get_user_tenant_id(auth.uid()))
  );

CREATE POLICY "Users can update notarios in their tenant"
  ON public.notarios FOR UPDATE
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can delete notarios in their tenant"
  ON public.notarios FOR DELETE
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND user_id = auth.uid());

-- Tasadores
ALTER TABLE public.tasadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasadores in their tenant"
  ON public.tasadores FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create tasadores in their tenant"
  ON public.tasadores FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND (tenant_id IS NULL OR tenant_id = get_user_tenant_id(auth.uid()))
  );

CREATE POLICY "Users can update tasadores in their tenant"
  ON public.tasadores FOR UPDATE
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can delete tasadores in their tenant"
  ON public.tasadores FOR DELETE
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND user_id = auth.uid());

-- Alguaciles
ALTER TABLE public.alguaciles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alguaciles in their tenant"
  ON public.alguaciles FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create alguaciles in their tenant"
  ON public.alguaciles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND (tenant_id IS NULL OR tenant_id = get_user_tenant_id(auth.uid()))
  );

CREATE POLICY "Users can update alguaciles in their tenant"
  ON public.alguaciles FOR UPDATE
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can delete alguaciles in their tenant"
  ON public.alguaciles FOR DELETE
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND user_id = auth.uid());

-- Peritos
ALTER TABLE public.peritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view peritos in their tenant"
  ON public.peritos FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create peritos in their tenant"
  ON public.peritos FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND (tenant_id IS NULL OR tenant_id = get_user_tenant_id(auth.uid()))
  );

CREATE POLICY "Users can update peritos in their tenant"
  ON public.peritos FOR UPDATE
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can delete peritos in their tenant"
  ON public.peritos FOR DELETE
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND user_id = auth.uid());

-- ================================================================
-- ÍNDICES para mejorar rendimiento
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_notarios_user_id ON public.notarios(user_id);
CREATE INDEX IF NOT EXISTS idx_notarios_tenant_id ON public.notarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notarios_estado ON public.notarios(estado);

CREATE INDEX IF NOT EXISTS idx_tasadores_user_id ON public.tasadores(user_id);
CREATE INDEX IF NOT EXISTS idx_tasadores_tenant_id ON public.tasadores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasadores_especialidad ON public.tasadores(especialidad);

CREATE INDEX IF NOT EXISTS idx_alguaciles_user_id ON public.alguaciles(user_id);
CREATE INDEX IF NOT EXISTS idx_alguaciles_tenant_id ON public.alguaciles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alguaciles_jurisdiccion ON public.alguaciles(jurisdiccion);

CREATE INDEX IF NOT EXISTS idx_peritos_user_id ON public.peritos(user_id);
CREATE INDEX IF NOT EXISTS idx_peritos_tenant_id ON public.peritos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_peritos_especialidad ON public.peritos(especialidad);
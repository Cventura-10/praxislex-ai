-- =====================================================
-- SISTEMA DE ROLES Y MÓDULO NOTARIAL
-- Basado en Ley 140-15 República Dominicana
-- =====================================================

-- 1. Actualizar enum de roles para incluir roles específicos del sistema legal
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role_new') THEN
    CREATE TYPE public.app_role_new AS ENUM (
      'admin',           -- Administrador del sistema
      'abogado',         -- Abogado con permisos de facturación y generación
      'notario',         -- Notario con permisos para actos notariales
      'asistente',       -- Asistente legal (solo gestión de datos)
      'alguacil',        -- Alguacil (solo emplazamientos y notificaciones)
      'cliente',         -- Cliente (acceso limitado al portal)
      'desarrollador'    -- Desarrollador/Diseñador (acceso total)
    );
  END IF;
END $$;

-- 2. Crear tabla de actos notariales (basada en Ley 140-15)
CREATE TABLE IF NOT EXISTS public.notarial_acts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  notario_id UUID REFERENCES public.notarios(id),
  
  -- Clasificación según Ley 140-15
  tipo_acto TEXT NOT NULL CHECK (tipo_acto IN (
    'autentico',           -- Actos auténticos (Art. 5)
    'firma_privada',       -- Legalización de firmas (Art. 6)
    'declaracion_unilateral' -- Declaraciones unilaterales
  )),
  
  acto_especifico TEXT NOT NULL, -- Ej: contrato_prestamo_hipoteca, acta_notoriedad
  
  -- Datos del acto
  titulo TEXT NOT NULL,
  numero_protocolo TEXT,
  fecha_instrumentacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ciudad TEXT NOT NULL,
  provincia TEXT,
  
  -- Partes (JSONB para flexibilidad)
  comparecientes JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de partes
  testigos JSONB DEFAULT '[]'::jsonb,                -- Testigos instrumentales si aplica
  
  -- Contenido
  objeto TEXT NOT NULL,           -- Objeto del acto
  clausulas JSONB DEFAULT '[]'::jsonb, -- Cláusulas específicas
  contenido_completo TEXT,        -- Contenido generado final
  
  -- Firma y autenticación
  firmado BOOLEAN DEFAULT FALSE,
  fecha_firma TIMESTAMPTZ,
  firma_digital_url TEXT,
  
  -- Documentación
  documento_url TEXT,
  formato_exportado TEXT CHECK (formato_exportado IN ('docx', 'pdf')),
  
  -- Relaciones opcionales
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  
  -- Auditoría
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para actos notariales
CREATE INDEX IF NOT EXISTS idx_notarial_acts_user ON public.notarial_acts(user_id);
CREATE INDEX IF NOT EXISTS idx_notarial_acts_tenant ON public.notarial_acts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notarial_acts_notario ON public.notarial_acts(notario_id);
CREATE INDEX IF NOT EXISTS idx_notarial_acts_tipo ON public.notarial_acts(tipo_acto);
CREATE INDEX IF NOT EXISTS idx_notarial_acts_fecha ON public.notarial_acts(fecha_instrumentacion DESC);

-- RLS para actos notariales
ALTER TABLE public.notarial_acts ENABLE ROW LEVEL SECURITY;

-- Solo el usuario propietario puede ver sus actos notariales
CREATE POLICY "Users can view their own notarial acts"
ON public.notarial_acts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Solo el usuario propietario puede crear actos notariales
CREATE POLICY "Users can create their own notarial acts"
ON public.notarial_acts FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  tenant_id = get_user_tenant_id(auth.uid()) AND
  (case_id IS NULL OR user_owns_case(auth.uid(), case_id)) AND
  (client_id IS NULL OR user_owns_client(auth.uid(), client_id))
);

-- Solo el usuario propietario puede actualizar sus actos
CREATE POLICY "Users can update their own notarial acts"
ON public.notarial_acts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Solo el usuario propietario puede eliminar sus actos
CREATE POLICY "Users can delete their own notarial acts"
ON public.notarial_acts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_notarial_acts_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_notarial_acts_timestamp
BEFORE UPDATE ON public.notarial_acts
FOR EACH ROW
EXECUTE FUNCTION public.update_notarial_acts_timestamp();

-- 4. Función para verificar permisos por rol
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role_new;
BEGIN
  -- Obtener rol del usuario (usar la tabla user_roles existente temporalmente)
  -- Nota: Necesitaremos migrar los datos después
  SELECT role::text INTO v_role
  FROM public.user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
  
  -- Si no tiene rol, devolve false
  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Permisos por rol
  CASE p_permission
    WHEN 'generate_legal_acts' THEN
      RETURN v_role IN ('admin', 'abogado', 'notario', 'desarrollador');
    WHEN 'create_invoices' THEN
      RETURN v_role IN ('admin', 'abogado', 'desarrollador');
    WHEN 'manage_professionals' THEN
      RETURN v_role IN ('admin', 'abogado', 'desarrollador');
    WHEN 'access_security' THEN
      RETURN v_role IN ('admin', 'desarrollador');
    WHEN 'full_access' THEN
      RETURN v_role IN ('admin', 'desarrollador');
    WHEN 'notarial_acts' THEN
      RETURN v_role IN ('admin', 'notario', 'desarrollador');
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

-- 5. Auditoría de cambios en actos notariales
CREATE OR REPLACE FUNCTION public.audit_notarial_acts_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changes JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_changes := jsonb_build_object(
      'operation', 'INSERT',
      'tipo_acto', NEW.tipo_acto,
      'acto_especifico', NEW.acto_especifico,
      'titulo', NEW.titulo,
      'ciudad', NEW.ciudad
    );
    PERFORM public.log_audit_event('notarial_acts', NEW.id, 'INSERT', v_changes);
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_changes := jsonb_build_object(
      'operation', 'UPDATE',
      'firmado_changed', (OLD.firmado IS DISTINCT FROM NEW.firmado),
      'old_firmado', OLD.firmado,
      'new_firmado', NEW.firmado
    );
    PERFORM public.log_audit_event('notarial_acts', NEW.id, 'UPDATE', v_changes);
    
  ELSIF TG_OP = 'DELETE' THEN
    v_changes := jsonb_build_object(
      'operation', 'DELETE',
      'tipo_acto', OLD.tipo_acto,
      'titulo', OLD.titulo
    );
    PERFORM public.log_audit_event('notarial_acts', OLD.id, 'DELETE', v_changes);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_audit_notarial_acts
AFTER INSERT OR UPDATE OR DELETE ON public.notarial_acts
FOR EACH ROW
EXECUTE FUNCTION public.audit_notarial_acts_changes();

-- 6. Comentarios para documentación
COMMENT ON TABLE public.notarial_acts IS 'Actos notariales según Ley 140-15 de República Dominicana';
COMMENT ON COLUMN public.notarial_acts.tipo_acto IS 'Clasificación: autentico (Art. 5), firma_privada (Art. 6), declaracion_unilateral';
COMMENT ON COLUMN public.notarial_acts.numero_protocolo IS 'Número en el protocolo notarial';
COMMENT ON COLUMN public.notarial_acts.comparecientes IS 'Array de partes que comparecen (vendedores, compradores, etc.)';
COMMENT ON COLUMN public.notarial_acts.testigos IS 'Testigos instrumentales cuando la ley lo requiera';
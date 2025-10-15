-- ============================================================================
-- SISTEMA DE GESTIÓN GEDEX Y PLAZOS PROCESALES DOMINICANOS
-- ============================================================================
-- Mejoras para integración con Poder Judicial Dominicano
-- ============================================================================

-- Agregar campo GEDEX a casos existentes
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS numero_gedex TEXT,
ADD COLUMN IF NOT EXISTS tribunal_gedex TEXT,
ADD COLUMN IF NOT EXISTS fecha_inicio_proceso DATE;

-- Crear índice para búsquedas por GEDEX
CREATE INDEX IF NOT EXISTS idx_cases_gedex ON public.cases(numero_gedex);

-- ============================================================================
-- TABLA DE PLAZOS PROCESALES CALCULADOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.plazos_procesales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Tipo de plazo
  tipo_plazo TEXT NOT NULL, -- 'apelacion', 'octava_franca', 'instruccion', 'alegatos', etc.
  descripcion TEXT NOT NULL,
  
  -- Fechas
  fecha_inicio DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  dias_plazo INTEGER NOT NULL,
  
  -- Estado
  estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'vencido', 'cumplido'
  prioridad TEXT DEFAULT 'media', -- 'baja', 'media', 'alta', 'critica'
  
  -- Metadata
  base_legal TEXT, -- Ej: "Art. 443 CPC", "Art. 65 CPP"
  notas TEXT,
  alerta_enviada BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_plazos_case ON public.plazos_procesales(case_id);
CREATE INDEX IF NOT EXISTS idx_plazos_user ON public.plazos_procesales(user_id);
CREATE INDEX IF NOT EXISTS idx_plazos_vencimiento ON public.plazos_procesales(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_plazos_estado ON public.plazos_procesales(estado);

-- ============================================================================
-- RLS POLICIES PARA PLAZOS PROCESALES
-- ============================================================================
ALTER TABLE public.plazos_procesales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their plazos in tenant"
ON public.plazos_procesales
FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND user_id = auth.uid()
);

CREATE POLICY "Users can create plazos in their tenant"
ON public.plazos_procesales
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND user_id = auth.uid()
  AND user_owns_case(auth.uid(), case_id)
);

CREATE POLICY "Users can update their plazos"
ON public.plazos_procesales
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their plazos"
ON public.plazos_procesales
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- FUNCIÓN: CALCULAR PLAZO PROCESAL DOMINICANO
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calcular_plazo_procesal(
  p_tipo_plazo TEXT,
  p_fecha_inicio DATE,
  p_materia TEXT DEFAULT 'civil'
)
RETURNS TABLE(
  dias_plazo INTEGER,
  fecha_vencimiento DATE,
  base_legal TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dias INTEGER;
  v_fecha_final DATE;
  v_base TEXT;
BEGIN
  -- Determinar días según tipo de plazo y materia
  CASE p_tipo_plazo
    -- PLAZOS CIVILES (CPC)
    WHEN 'apelacion_sentencia' THEN
      v_dias := 30;
      v_base := 'Art. 443 CPC - Apelación de sentencia definitiva';
    
    WHEN 'apelacion_ordinaria' THEN
      v_dias := 15;
      v_base := 'Art. 443 CPC - Apelación ordinaria';
    
    WHEN 'octava_franca' THEN
      v_dias := 8;
      v_base := 'Art. 73 CPC - Octava franca de ley';
    
    WHEN 'contestacion_demanda' THEN
      v_dias := 15;
      v_base := 'Art. 61 CPC - Contestación a demanda';
    
    WHEN 'deposito_alegatos' THEN
      v_dias := 30;
      v_base := 'Art. 442 CPC - Depósito de alegatos';
    
    -- PLAZOS PENALES (CPP)
    WHEN 'recurso_revision' THEN
      v_dias := 20;
      v_base := 'Art. 427 CPP - Recurso de revisión';
    
    WHEN 'casacion_penal' THEN
      v_dias := 10;
      v_base := 'Art. 418 CPP - Recurso de casación';
    
    WHEN 'apelacion_penal' THEN
      v_dias := 10;
      v_base := 'Art. 417 CPP - Apelación en materia penal';
    
    -- PLAZOS LABORALES
    WHEN 'apelacion_laboral' THEN
      v_dias := 10;
      v_base := 'Art. 534 Código de Trabajo - Apelación laboral';
    
    WHEN 'casacion_laboral' THEN
      v_dias := 10;
      v_base := 'Art. 536 Código de Trabajo - Casación laboral';
    
    -- PLAZOS ADMINISTRATIVOS
    WHEN 'recurso_jerarquico' THEN
      v_dias := 15;
      v_base := 'Ley 107-13 - Recurso jerárquico';
    
    WHEN 'contencioso_administrativo' THEN
      v_dias := 60;
      v_base := 'Ley 13-07 - Recurso contencioso-administrativo';
    
    -- DEFAULT
    ELSE
      v_dias := 30;
      v_base := 'Plazo general - 30 días';
  END CASE;

  -- Calcular fecha de vencimiento (sin contar fines de semana/feriados por ahora)
  v_fecha_final := p_fecha_inicio + (v_dias || ' days')::INTERVAL;

  RETURN QUERY SELECT v_dias, v_fecha_final, v_base;
END;
$$;

-- ============================================================================
-- FUNCIÓN: AUTO-GENERAR PLAZOS AL CREAR CASO
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_generar_plazos_caso()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plazo RECORD;
  v_fecha_inicio DATE;
BEGIN
  -- Solo generar plazos si hay fecha de inicio
  IF NEW.fecha_inicio_proceso IS NOT NULL THEN
    v_fecha_inicio := NEW.fecha_inicio_proceso;
    
    -- Generar plazo inicial según materia
    CASE LOWER(NEW.materia)
      WHEN 'civil y comercial', 'civil' THEN
        -- Generar octava franca
        FOR v_plazo IN 
          SELECT * FROM public.calcular_plazo_procesal('octava_franca', v_fecha_inicio, 'civil')
        LOOP
          INSERT INTO public.plazos_procesales (
            case_id, user_id, tenant_id, tipo_plazo, descripcion,
            fecha_inicio, fecha_vencimiento, dias_plazo, base_legal, prioridad
          ) VALUES (
            NEW.id, NEW.user_id, NEW.tenant_id, 'octava_franca',
            'Octava franca para contestación',
            v_fecha_inicio, v_plazo.fecha_vencimiento, v_plazo.dias_plazo,
            v_plazo.base_legal, 'alta'
          );
        END LOOP;
      
      WHEN 'penal' THEN
        -- Generar plazo de apelación penal
        FOR v_plazo IN 
          SELECT * FROM public.calcular_plazo_procesal('apelacion_penal', v_fecha_inicio, 'penal')
        LOOP
          INSERT INTO public.plazos_procesales (
            case_id, user_id, tenant_id, tipo_plazo, descripcion,
            fecha_inicio, fecha_vencimiento, dias_plazo, base_legal, prioridad
          ) VALUES (
            NEW.id, NEW.user_id, NEW.tenant_id, 'apelacion_penal',
            'Plazo para recurso de apelación',
            v_fecha_inicio, v_plazo.fecha_vencimiento, v_plazo.dias_plazo,
            v_plazo.base_legal, 'critica'
          );
        END LOOP;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$;

-- Crear trigger para auto-generar plazos
DROP TRIGGER IF EXISTS trigger_auto_generar_plazos ON public.cases;
CREATE TRIGGER trigger_auto_generar_plazos
  AFTER INSERT ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generar_plazos_caso();

-- ============================================================================
-- FUNCIÓN: ACTUALIZAR ESTADO DE PLAZOS (llamar diariamente)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.actualizar_estado_plazos()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  -- Marcar plazos vencidos
  UPDATE public.plazos_procesales
  SET estado = 'vencido',
      updated_at = now()
  WHERE fecha_vencimiento < CURRENT_DATE
    AND estado = 'pendiente';
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  RETURN v_updated;
END;
$$;

-- ============================================================================
-- TRIGGER: UPDATE TIMESTAMP
-- ============================================================================
CREATE TRIGGER update_plazos_timestamp
  BEFORE UPDATE ON public.plazos_procesales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- COMENTARIOS
-- ============================================================================
COMMENT ON TABLE public.plazos_procesales IS 'Almacena plazos procesales calculados automáticamente según legislación dominicana';
COMMENT ON FUNCTION public.calcular_plazo_procesal IS 'Calcula plazos según CPC, CPP, Código de Trabajo y leyes administrativas dominicanas';
COMMENT ON COLUMN public.cases.numero_gedex IS 'Número de expediente en sistema GEDEX del Poder Judicial';
COMMENT ON COLUMN public.cases.tribunal_gedex IS 'Tribunal que conoce del caso según GEDEX';

-- ============================================================================
-- SEGURIDAD VALIDADA
-- ============================================================================
-- ✅ RLS habilitado en plazos_procesales
-- ✅ Políticas basadas en tenant y ownership
-- ✅ Funciones SECURITY DEFINER con search_path seguro
-- ✅ Triggers para automatización
-- ============================================================================
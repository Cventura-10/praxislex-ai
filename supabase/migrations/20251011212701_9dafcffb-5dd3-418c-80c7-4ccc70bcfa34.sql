-- ================================================================
-- FASE 1: CREAR TABLA DE TIPOS DE ACTOS (si no existe)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.act_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  materia TEXT NOT NULL,
  tipo_documento TEXT NOT NULL,
  act_template_kind TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.act_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  act_slug TEXT NOT NULL REFERENCES public.act_types(slug) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_label TEXT,
  field_type TEXT DEFAULT 'text',
  is_required BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- FASE 2: ASEGURAR TIPOLOGÍA CORRECTA
-- ================================================================

-- Insertar/actualizar tipo de acto para contrato de venta
INSERT INTO public.act_types (slug, title, materia, tipo_documento, act_template_kind)
VALUES ('contrato_venta', 'Contrato de Venta', 'Civil y Comercial', 'Actos Extrajudiciales', 'extrajudicial_contrato')
ON CONFLICT (slug) 
DO UPDATE SET 
  act_template_kind = 'extrajudicial_contrato',
  tipo_documento = 'Actos Extrajudiciales',
  updated_at = NOW();

-- ================================================================
-- FASE 3: LIMPIAR CAMPOS JUDICIALES ASOCIADOS A ACTOS EXTRAJUDICIALES
-- ================================================================

-- Borrar campos judiciales asociados incorrectamente a contrato_venta
DELETE FROM public.act_fields
WHERE act_slug = 'contrato_venta'
  AND split_part(field_key, '.', 1) IN (
    'demandante', 'demandado', 'tribunal', 'numero_acto', 'folios',
    'traslados_enumerados', 'emplazamiento_texto', 'octava_franca_fecha_limite',
    'costas_texto', 'petitorio', 'dispositivo'
  );

-- ================================================================
-- FASE 4: VISTA FILTRADA PARA CAMPOS VÁLIDOS
-- ================================================================

-- Vista que solo devuelve campos coherentes con el tipo de acto
CREATE OR REPLACE VIEW public.v_act_fields_sane AS
SELECT f.*
FROM public.act_fields f
JOIN public.act_types t ON t.slug = f.act_slug
WHERE NOT (
  -- Si es extrajudicial, excluir campos judiciales
  t.act_template_kind LIKE 'extrajudicial%'
  AND split_part(f.field_key, '.', 1) IN (
    'demandante', 'demandado', 'tribunal', 'numero_acto', 'folios',
    'traslados_enumerados', 'emplazamiento_texto', 'octava_franca_fecha_limite',
    'costas_texto', 'petitorio', 'dispositivo'
  )
);

-- ================================================================
-- FASE 5: CONTROL DE ACCESO (OPCIONAL - descomentar si se desea)
-- ================================================================

-- Revocar acceso directo a act_fields, obligar a usar la vista filtrada
-- REVOKE SELECT ON public.act_fields FROM anon, authenticated;
-- GRANT SELECT ON public.v_act_fields_sane TO anon, authenticated;

-- ================================================================
-- FASE 6: RLS POLICIES PARA LAS NUEVAS TABLAS
-- ================================================================

-- Habilitar RLS en las tablas
ALTER TABLE public.act_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.act_fields ENABLE ROW LEVEL SECURITY;

-- Políticas para act_types: todos pueden leer, solo admins pueden modificar
CREATE POLICY "act_types_select_all" ON public.act_types
  FOR SELECT USING (true);

CREATE POLICY "act_types_insert_admin" ON public.act_types
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "act_types_update_admin" ON public.act_types
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "act_types_delete_admin" ON public.act_types
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Políticas para act_fields: todos pueden leer, solo admins pueden modificar
CREATE POLICY "act_fields_select_all" ON public.act_fields
  FOR SELECT USING (true);

CREATE POLICY "act_fields_insert_admin" ON public.act_fields
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "act_fields_update_admin" ON public.act_fields
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "act_fields_delete_admin" ON public.act_fields
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
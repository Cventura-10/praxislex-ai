-- Fase 4: Historial de Documentos
-- Bucket para almacenar documentos generados
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated_documents',
  'generated_documents',
  false,
  52428800, -- 50MB
  ARRAY[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- RLS para bucket generated_documents
CREATE POLICY "Usuarios pueden ver sus documentos generados"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated_documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Usuarios pueden subir sus documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'generated_documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Usuarios pueden actualizar sus documentos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'generated_documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Usuarios pueden eliminar sus documentos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'generated_documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Tabla para tracking de versiones de documentos
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_act_id UUID REFERENCES public.generated_acts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  tenant_id UUID,
  version_number INT NOT NULL DEFAULT 1,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT DEFAULT 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(generated_act_id, version_number)
);

-- Enable RLS
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies para document_versions
CREATE POLICY "Usuarios pueden ver sus versiones de documentos"
ON public.document_versions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Usuarios pueden crear versiones de documentos"
ON public.document_versions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar sus versiones"
ON public.document_versions FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Usuarios pueden eliminar sus versiones"
ON public.document_versions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Índices para optimización
CREATE INDEX idx_document_versions_act ON public.document_versions(generated_act_id);
CREATE INDEX idx_document_versions_user ON public.document_versions(user_id);
CREATE INDEX idx_document_versions_created ON public.document_versions(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_document_versions_timestamp
BEFORE UPDATE ON public.document_versions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fase 2: Metadata de plantillas
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('judicial', 'extrajudicial', 'notarial')),
  storage_path TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  activo BOOLEAN DEFAULT true,
  requiere_notario BOOLEAN DEFAULT false,
  requiere_contrato BOOLEAN DEFAULT false,
  roles_partes JSONB DEFAULT '[]'::jsonb,
  campos_adicionales JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies para templates (solo lectura para todos)
CREATE POLICY "Todos pueden ver plantillas activas"
ON public.document_templates FOR SELECT
TO authenticated
USING (activo = true);

CREATE POLICY "Solo admins pueden gestionar plantillas"
ON public.document_templates FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
  )
);

-- Índice para búsqueda
CREATE INDEX idx_templates_slug ON public.document_templates(slug);
CREATE INDEX idx_templates_categoria ON public.document_templates(categoria);

-- Trigger para updated_at
CREATE TRIGGER update_templates_timestamp
BEFORE UPDATE ON public.document_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar plantilla de contrato de alquiler
INSERT INTO public.document_templates (
  slug,
  nombre,
  descripcion,
  categoria,
  storage_path,
  version,
  activo,
  requiere_notario,
  requiere_contrato,
  roles_partes,
  campos_adicionales
) VALUES (
  'contrato-alquiler',
  'Contrato de Alquiler',
  'Contrato de arrendamiento de bienes inmuebles',
  'extrajudicial',
  'contrato_alquiler.docx',
  '1.0',
  true,
  true,
  true,
  '[
    {"role": "arrendador", "label": "Arrendador(es)", "min": 1, "max": 5},
    {"role": "arrendatario", "label": "Arrendatario(s)", "min": 1, "max": 5}
  ]'::jsonb,
  '[
    {"field": "inmueble_descripcion", "label": "Descripción del Inmueble", "type": "textarea", "required": true},
    {"field": "uso", "label": "Uso del Inmueble", "type": "select", "options": ["residencial", "comercial", "industrial"], "required": true},
    {"field": "canon_monto", "label": "Canon Mensual (RD$)", "type": "number", "required": true},
    {"field": "plazo_meses", "label": "Plazo (meses)", "type": "number", "required": true}
  ]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  updated_at = now();

-- Función para obtener siguiente versión de documento
CREATE OR REPLACE FUNCTION public.get_next_document_version(p_act_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_version INT;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version
  FROM public.document_versions
  WHERE generated_act_id = p_act_id;
  
  RETURN v_next_version;
END;
$$;
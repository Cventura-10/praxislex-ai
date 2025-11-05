-- ============================================================================
-- Módulo: Configuración de Estilo (Aprendizaje desde Documentos)
-- Propósito: Aprender estilo/formato de documentos legales subidos por el usuario
-- ============================================================================

-- Crear bucket para documentos fuente (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legal-source-docs',
  'legal-source-docs',
  false,
  20971520, -- 20MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/rtf',
    'application/vnd.oasis.opendocument.text',
    'text/html',
    'text/plain',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para legal-source-docs
CREATE POLICY "Users can upload source docs to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'legal-source-docs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own source docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'legal-source-docs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own source docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'legal-source-docs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Tabla: doc_learning_uploads (archivos subidos para análisis)
CREATE TABLE IF NOT EXISTS public.doc_learning_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  pages INTEGER,
  ocr_used BOOLEAN DEFAULT false,
  checksum_sha256 TEXT,
  extracted_text TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processed', 'failed')),
  warnings JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para doc_learning_uploads
CREATE INDEX IF NOT EXISTS idx_doc_learning_uploads_tenant ON public.doc_learning_uploads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_doc_learning_uploads_status ON public.doc_learning_uploads(status);
CREATE INDEX IF NOT EXISTS idx_doc_learning_uploads_created ON public.doc_learning_uploads(created_at);

-- RLS para doc_learning_uploads
ALTER TABLE public.doc_learning_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view uploads in their tenant"
ON public.doc_learning_uploads FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create uploads in their tenant"
ON public.doc_learning_uploads FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update uploads in their tenant"
ON public.doc_learning_uploads FOR UPDATE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete uploads in their tenant"
ON public.doc_learning_uploads FOR DELETE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Tabla: doc_learning_runs (ejecuciones de análisis)
CREATE TABLE IF NOT EXISTS public.doc_learning_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  docs_count INTEGER NOT NULL DEFAULT 0,
  summary JSONB DEFAULT '{}'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para doc_learning_runs
CREATE INDEX IF NOT EXISTS idx_doc_learning_runs_tenant ON public.doc_learning_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_doc_learning_runs_status ON public.doc_learning_runs(status);
CREATE INDEX IF NOT EXISTS idx_doc_learning_runs_created ON public.doc_learning_runs(created_at DESC);

-- RLS para doc_learning_runs
ALTER TABLE public.doc_learning_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view runs in their tenant"
ON public.doc_learning_runs FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create runs in their tenant"
ON public.doc_learning_runs FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update runs in their tenant"
ON public.doc_learning_runs FOR UPDATE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Tabla: doc_learning_variables (variables detectadas)
CREATE TABLE IF NOT EXISTS public.doc_learning_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  run_id UUID NOT NULL REFERENCES public.doc_learning_runs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pattern TEXT,
  examples JSONB DEFAULT '[]'::jsonb,
  required BOOLEAN DEFAULT false,
  confidence NUMERIC(5,2) DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para doc_learning_variables
CREATE INDEX IF NOT EXISTS idx_doc_learning_variables_tenant ON public.doc_learning_variables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_doc_learning_variables_run ON public.doc_learning_variables(run_id);

-- RLS para doc_learning_variables
ALTER TABLE public.doc_learning_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view variables in their tenant"
ON public.doc_learning_variables FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can manage variables in their tenant"
ON public.doc_learning_variables FOR ALL
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- Tabla: doc_learning_clauses (cláusulas detectadas)
CREATE TABLE IF NOT EXISTS public.doc_learning_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  run_id UUID NOT NULL REFERENCES public.doc_learning_runs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  hash TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  confidence NUMERIC(5,2) DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para doc_learning_clauses
CREATE INDEX IF NOT EXISTS idx_doc_learning_clauses_tenant ON public.doc_learning_clauses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_doc_learning_clauses_run ON public.doc_learning_clauses(run_id);
CREATE INDEX IF NOT EXISTS idx_doc_learning_clauses_hash ON public.doc_learning_clauses(hash);

-- RLS para doc_learning_clauses
ALTER TABLE public.doc_learning_clauses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view clauses in their tenant"
ON public.doc_learning_clauses FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can manage clauses in their tenant"
ON public.doc_learning_clauses FOR ALL
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- Tabla: style_profiles (perfiles de estilo publicados)
CREATE TABLE IF NOT EXISTS public.style_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  run_id UUID REFERENCES public.doc_learning_runs(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  layout_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  lexicon_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  clause_library_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  variable_map_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para style_profiles
CREATE INDEX IF NOT EXISTS idx_style_profiles_tenant ON public.style_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_style_profiles_active ON public.style_profiles(tenant_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_style_profiles_version ON public.style_profiles(tenant_id, version DESC);

-- RLS para style_profiles
ALTER TABLE public.style_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view profiles in their tenant"
ON public.style_profiles FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create profiles in their tenant"
ON public.style_profiles FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update profiles in their tenant"
ON public.style_profiles FOR UPDATE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Trigger para desactivar perfiles previos al publicar uno nuevo
CREATE OR REPLACE FUNCTION public.deactivate_previous_style_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si el nuevo perfil está activo, desactivar todos los demás del mismo tenant
  IF NEW.active = true THEN
    UPDATE public.style_profiles
    SET active = false, updated_at = now()
    WHERE tenant_id = NEW.tenant_id
      AND id != NEW.id
      AND active = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_deactivate_previous_style_profiles
AFTER INSERT OR UPDATE ON public.style_profiles
FOR EACH ROW
WHEN (NEW.active = true)
EXECUTE FUNCTION public.deactivate_previous_style_profiles();

-- Función helper para obtener el perfil activo de un tenant
CREATE OR REPLACE FUNCTION public.get_active_style_profile(p_tenant_id UUID)
RETURNS TABLE(
  id UUID,
  version INTEGER,
  layout_json JSONB,
  lexicon_json JSONB,
  clause_library_json JSONB,
  variable_map_json JSONB,
  metrics_json JSONB,
  published_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    version,
    layout_json,
    lexicon_json,
    clause_library_json,
    variable_map_json,
    metrics_json,
    published_at
  FROM public.style_profiles
  WHERE tenant_id = p_tenant_id
    AND active = true
  ORDER BY version DESC
  LIMIT 1;
$$;
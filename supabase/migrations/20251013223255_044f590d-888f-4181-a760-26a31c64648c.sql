-- Tabla para almacenar actos contractuales y notariales generados
CREATE TABLE IF NOT EXISTS public.generated_acts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  
  -- Información del acto
  tipo_acto text NOT NULL,
  materia text NOT NULL,
  titulo text NOT NULL,
  ciudad text NOT NULL,
  provincia text,
  fecha_actuacion timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Partes involucradas (JSONB para flexibilidad)
  vendedores jsonb[] DEFAULT '{}',
  compradores jsonb[] DEFAULT '{}',
  testigos jsonb[] DEFAULT '{}',
  
  -- Profesionales involucrados
  notario_id uuid REFERENCES public.notarios(id) ON DELETE SET NULL,
  abogado_id uuid REFERENCES public.lawyers(id) ON DELETE SET NULL,
  tasador_id uuid REFERENCES public.tasadores(id) ON DELETE SET NULL,
  perito_id uuid REFERENCES public.peritos(id) ON DELETE SET NULL,
  
  -- Contenido del documento
  contenido text NOT NULL,
  clausulas jsonb DEFAULT '[]',
  
  -- Metadatos del documento
  documento_url text,
  formato_exportado text, -- 'docx' o 'pdf'
  firmado boolean DEFAULT false,
  fecha_firma timestamp with time zone,
  
  -- Audio de dictado (referencia a storage)
  audio_dictado_url text,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_acts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own generated acts"
  ON public.generated_acts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generated acts"
  ON public.generated_acts
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND (case_id IS NULL OR user_owns_case(auth.uid(), case_id))
    AND (client_id IS NULL OR user_owns_client(auth.uid(), client_id))
  );

CREATE POLICY "Users can update their own generated acts"
  ON public.generated_acts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated acts"
  ON public.generated_acts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_generated_acts_updated_at
  BEFORE UPDATE ON public.generated_acts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para mejorar rendimiento
CREATE INDEX idx_generated_acts_user_id ON public.generated_acts(user_id);
CREATE INDEX idx_generated_acts_tenant_id ON public.generated_acts(tenant_id);
CREATE INDEX idx_generated_acts_case_id ON public.generated_acts(case_id);
CREATE INDEX idx_generated_acts_tipo_acto ON public.generated_acts(tipo_acto);
CREATE INDEX idx_generated_acts_created_at ON public.generated_acts(created_at DESC);

-- Trigger de auditoría
CREATE OR REPLACE FUNCTION audit_generated_acts_changes()
RETURNS trigger
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
      'titulo', NEW.titulo,
      'ciudad', NEW.ciudad
    );
    PERFORM public.log_audit_event('generated_acts', NEW.id, 'INSERT', v_changes);
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_changes := jsonb_build_object(
      'operation', 'UPDATE',
      'firmado_changed', (OLD.firmado IS DISTINCT FROM NEW.firmado),
      'old_firmado', OLD.firmado,
      'new_firmado', NEW.firmado
    );
    PERFORM public.log_audit_event('generated_acts', NEW.id, 'UPDATE', v_changes);
    
  ELSIF TG_OP = 'DELETE' THEN
    v_changes := jsonb_build_object(
      'operation', 'DELETE',
      'tipo_acto', OLD.tipo_acto,
      'titulo', OLD.titulo
    );
    PERFORM public.log_audit_event('generated_acts', OLD.id, 'DELETE', v_changes);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_generated_acts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.generated_acts
  FOR EACH ROW
  EXECUTE FUNCTION audit_generated_acts_changes();

-- Storage bucket para actos legales
INSERT INTO storage.buckets (id, name, public)
VALUES ('legal-acts', 'legal-acts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket para dictados de voz
INSERT INTO storage.buckets (id, name, public)
VALUES ('acts-dictations', 'acts-dictations', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies para storage de actos legales
CREATE POLICY "Users can view their own legal acts"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'legal-acts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own legal acts"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'legal-acts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own legal acts"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'legal-acts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own legal acts"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'legal-acts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS policies para storage de dictados
CREATE POLICY "Users can view their own dictations"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'acts-dictations' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own dictations"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'acts-dictations' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own dictations"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'acts-dictations' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
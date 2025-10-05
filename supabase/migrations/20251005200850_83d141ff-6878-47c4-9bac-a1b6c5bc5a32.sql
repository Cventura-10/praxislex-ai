-- Crear tabla para documentos legales generados
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL,
  materia TEXT NOT NULL,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  contenido_word BYTEA,
  demandante_nombre TEXT,
  demandado_nombre TEXT,
  juzgado TEXT,
  numero_expediente TEXT,
  fecha_generacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Los usuarios pueden ver sus propios documentos"
  ON public.legal_documents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propios documentos"
  ON public.legal_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios documentos"
  ON public.legal_documents
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios documentos"
  ON public.legal_documents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para mejorar rendimiento
CREATE INDEX idx_legal_documents_user_id ON public.legal_documents(user_id);
CREATE INDEX idx_legal_documents_fecha ON public.legal_documents(fecha_generacion DESC);
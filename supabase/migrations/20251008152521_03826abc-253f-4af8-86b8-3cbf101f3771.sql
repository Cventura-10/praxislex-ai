-- ============================================
-- FASE 3: RAG JURÍDICO - VECTOR SEARCH
-- ============================================

-- 1. Habilitar extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Crear tabla de jurisprudencias vectorizadas
CREATE TABLE IF NOT EXISTS public.jurisprudence_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Metadata de la jurisprudencia
  titulo TEXT NOT NULL,
  materia TEXT NOT NULL,
  tribunal TEXT,
  sala TEXT,
  numero_sentencia TEXT,
  fecha_sentencia DATE,
  url_fuente TEXT,
  
  -- Contenido
  contenido TEXT NOT NULL,
  resumen TEXT,
  
  -- Embedding (1536 dimensiones para text-embedding-3-small de OpenAI)
  embedding vector(1536),
  
  -- Tags y categorías
  tags TEXT[],
  relevancia_score NUMERIC DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  indexed_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.jurisprudence_embeddings ENABLE ROW LEVEL SECURITY;

-- Índice HNSW para búsqueda rápida de vectores
CREATE INDEX IF NOT EXISTS jurisprudence_embeddings_vector_idx 
  ON public.jurisprudence_embeddings 
  USING hnsw (embedding vector_cosine_ops);

-- Índices adicionales
CREATE INDEX IF NOT EXISTS idx_jurisprudence_materia ON public.jurisprudence_embeddings(materia);
CREATE INDEX IF NOT EXISTS idx_jurisprudence_fecha ON public.jurisprudence_embeddings(fecha_sentencia DESC);
CREATE INDEX IF NOT EXISTS idx_jurisprudence_user ON public.jurisprudence_embeddings(user_id);

-- 3. Tabla de citaciones en documentos generados
CREATE TABLE IF NOT EXISTS public.document_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  jurisprudence_id UUID REFERENCES public.jurisprudence_embeddings(id) ON DELETE SET NULL,
  
  -- Contexto de la citación
  cited_text TEXT NOT NULL,
  context_paragraph TEXT,
  position_in_doc INTEGER,
  
  -- Relevancia
  similarity_score NUMERIC,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.document_citations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_citations_document ON public.document_citations(document_id);
CREATE INDEX IF NOT EXISTS idx_citations_jurisprudence ON public.document_citations(jurisprudence_id);

-- 4. Tabla de uso de IA (cuotas por plan)
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo de operación
  operation_type TEXT NOT NULL, -- 'embedding', 'completion', 'search'
  model_used TEXT,
  
  -- Consumo
  tokens_used INTEGER DEFAULT 0,
  cost_usd NUMERIC DEFAULT 0,
  
  -- Metadata
  request_metadata JSONB,
  response_metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON public.ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON public.ai_usage(created_at DESC);

-- 5. Función de búsqueda semántica
CREATE OR REPLACE FUNCTION public.search_jurisprudence(
  query_embedding vector(1536),
  match_threshold NUMERIC DEFAULT 0.7,
  match_count INTEGER DEFAULT 10,
  filter_materia TEXT DEFAULT NULL,
  filter_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  materia TEXT,
  tribunal TEXT,
  numero_sentencia TEXT,
  fecha_sentencia DATE,
  url_fuente TEXT,
  contenido TEXT,
  resumen TEXT,
  similarity NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    je.id,
    je.titulo,
    je.materia,
    je.tribunal,
    je.numero_sentencia,
    je.fecha_sentencia,
    je.url_fuente,
    je.contenido,
    je.resumen,
    1 - (je.embedding <=> query_embedding) AS similarity
  FROM public.jurisprudence_embeddings je
  WHERE 
    (filter_materia IS NULL OR je.materia = filter_materia)
    AND (filter_user_id IS NULL OR je.user_id = filter_user_id)
    AND (1 - (je.embedding <=> query_embedding)) > match_threshold
  ORDER BY je.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6. Función para obtener uso de IA del mes actual
CREATE OR REPLACE FUNCTION public.get_monthly_ai_usage(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  total_tokens BIGINT,
  total_cost NUMERIC,
  operations_count BIGINT,
  by_operation JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(tokens_used), 0)::BIGINT AS total_tokens,
    COALESCE(SUM(cost_usd), 0) AS total_cost,
    COUNT(*)::BIGINT AS operations_count,
    jsonb_object_agg(
      operation_type,
      jsonb_build_object(
        'count', COUNT(*),
        'tokens', COALESCE(SUM(tokens_used), 0),
        'cost', COALESCE(SUM(cost_usd), 0)
      )
    ) AS by_operation
  FROM public.ai_usage
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', now())
    AND created_at < date_trunc('month', now()) + interval '1 month';
END;
$$;

-- 7. RLS Policies

-- jurisprudence_embeddings: usuarios ven sus propias jurisprudencias
CREATE POLICY "Users can view their jurisprudence"
  ON public.jurisprudence_embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their jurisprudence"
  ON public.jurisprudence_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their jurisprudence"
  ON public.jurisprudence_embeddings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their jurisprudence"
  ON public.jurisprudence_embeddings FOR DELETE
  USING (auth.uid() = user_id);

-- document_citations: acceso basado en documento
CREATE POLICY "Users can view citations of their documents"
  ON public.document_citations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.legal_documents ld
      WHERE ld.id = document_citations.document_id
        AND ld.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert citations in their documents"
  ON public.document_citations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.legal_documents ld
      WHERE ld.id = document_citations.document_id
        AND ld.user_id = auth.uid()
    )
  );

-- ai_usage: usuarios solo ven su propio uso
CREATE POLICY "Users can view their AI usage"
  ON public.ai_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Solo sistema puede insertar (via SECURITY DEFINER functions)
CREATE POLICY "System can insert AI usage"
  ON public.ai_usage FOR INSERT
  WITH CHECK (true);

-- 8. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_jurisprudence_updated_at()
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

DROP TRIGGER IF EXISTS update_jurisprudence_timestamp ON public.jurisprudence_embeddings;
CREATE TRIGGER update_jurisprudence_timestamp
  BEFORE UPDATE ON public.jurisprudence_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_jurisprudence_updated_at();

-- 9. Comentarios de documentación
COMMENT ON TABLE public.jurisprudence_embeddings IS 'Vector embeddings of jurisprudence for semantic search';
COMMENT ON COLUMN public.jurisprudence_embeddings.embedding IS '1536-dimensional vector from text-embedding-3-small';
COMMENT ON TABLE public.document_citations IS 'Citations linking generated documents to jurisprudence sources';
COMMENT ON TABLE public.ai_usage IS 'Track AI API usage and costs per user for quota enforcement';
COMMENT ON FUNCTION public.search_jurisprudence IS 'Semantic search over jurisprudence using vector similarity';

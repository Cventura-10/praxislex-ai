-- Full-text search setup for PraxisLex
-- Enables powerful search across all entities

-- Create Spanish legal text search configuration
CREATE TEXT SEARCH CONFIGURATION spanish_legal (COPY = pg_catalog.spanish);

-- Create materialized view for search index
CREATE MATERIALIZED VIEW IF NOT EXISTS search_index AS
SELECT 
    'case'::text as entity_type,
    c.id as entity_id,
    c.titulo as title,
    c.descripcion as description,
    c.numero_expediente as reference,
    c.user_id,
    to_tsvector('spanish', 
        coalesce(c.titulo, '') || ' ' ||
        coalesce(c.descripcion, '') || ' ' ||
        coalesce(c.numero_expediente, '') || ' ' ||
        coalesce(c.materia, '')
    ) as search_vector,
    c.created_at
FROM cases c

UNION ALL

SELECT 
    'client'::text as entity_type,
    cl.id as entity_id,
    cl.nombre_completo as title,
    cl.direccion as description,
    cl.email as reference,
    cl.user_id,
    to_tsvector('spanish',
        coalesce(cl.nombre_completo, '') || ' ' ||
        coalesce(cl.email, '') || ' ' ||
        coalesce(cl.telefono, '') || ' ' ||
        coalesce(cl.direccion, '')
    ) as search_vector,
    cl.created_at
FROM clients cl

UNION ALL

SELECT 
    'document'::text as entity_type,
    d.id as entity_id,
    d.titulo as title,
    left(d.contenido, 500) as description,
    d.tipo_documento as reference,
    d.user_id,
    to_tsvector('spanish',
        coalesce(d.titulo, '') || ' ' ||
        coalesce(d.contenido, '') || ' ' ||
        coalesce(d.tipo_documento, '') || ' ' ||
        coalesce(d.materia, '')
    ) as search_vector,
    d.created_at
FROM legal_documents d

UNION ALL

SELECT 
    'invoice'::text as entity_type,
    i.id as entity_id,
    i.numero_factura as title,
    i.concepto as description,
    i.estado as reference,
    i.user_id,
    to_tsvector('spanish',
        coalesce(i.numero_factura, '') || ' ' ||
        coalesce(i.concepto, '')
    ) as search_vector,
    i.created_at::timestamp
FROM invoices i;

-- Create indexes on search vector for performance
CREATE INDEX IF NOT EXISTS idx_search_vector ON search_index USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_search_user ON search_index(user_id);
CREATE INDEX IF NOT EXISTS idx_search_type ON search_index(entity_type);
CREATE INDEX IF NOT EXISTS idx_search_created ON search_index(created_at DESC);

-- Function to refresh search index
CREATE OR REPLACE FUNCTION refresh_search_index()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY search_index;
END;
$$;

-- Advanced search function with ranking
CREATE OR REPLACE FUNCTION search_entities(
    p_query text,
    p_user_id uuid,
    p_entity_types text[] DEFAULT NULL,
    p_limit int DEFAULT 20
)
RETURNS TABLE (
    entity_type text,
    entity_id uuid,
    title text,
    description text,
    reference text,
    rank real,
    created_at timestamp
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validate input
    IF p_query IS NULL OR trim(p_query) = '' THEN
        RETURN;
    END IF;

    -- Clean query for tsquery
    p_query := regexp_replace(trim(p_query), '\s+', ' & ', 'g');
    
    RETURN QUERY
    SELECT 
        s.entity_type,
        s.entity_id,
        s.title,
        s.description,
        s.reference,
        ts_rank(s.search_vector, to_tsquery('spanish', p_query)) as rank,
        s.created_at::timestamp
    FROM search_index s
    WHERE s.user_id = p_user_id
        AND (p_entity_types IS NULL OR s.entity_type = ANY(p_entity_types))
        AND s.search_vector @@ to_tsquery('spanish', p_query)
    ORDER BY rank DESC, s.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Table for saved searches
CREATE TABLE IF NOT EXISTS saved_searches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    filters jsonb NOT NULL DEFAULT '{}',
    entity_type text NOT NULL,
    is_favorite boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on saved_searches
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved_searches
CREATE POLICY "Users can view their own saved searches"
ON saved_searches FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved searches"
ON saved_searches FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches"
ON saved_searches FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches"
ON saved_searches FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes on saved_searches
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_type ON saved_searches(entity_type);
CREATE INDEX IF NOT EXISTS idx_saved_searches_favorite ON saved_searches(is_favorite) WHERE is_favorite = true;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_searches_timestamp()
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

CREATE TRIGGER update_saved_searches_updated_at
    BEFORE UPDATE ON saved_searches
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_searches_timestamp();

-- Comments for documentation
COMMENT ON MATERIALIZED VIEW search_index IS 'Full-text search index for all searchable entities';
COMMENT ON FUNCTION search_entities IS 'Search across all entities with full-text ranking';
COMMENT ON FUNCTION refresh_search_index IS 'Refresh the materialized search index';
COMMENT ON TABLE saved_searches IS 'User-saved search queries and filters';
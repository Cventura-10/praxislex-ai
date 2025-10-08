-- Fix security warnings from linter

-- 1. Move materialized view out of public API exposure
-- Revoke permissions from anon and authenticated roles
REVOKE ALL ON search_index FROM anon;
REVOKE ALL ON search_index FROM authenticated;

-- Only allow access through the search function
GRANT EXECUTE ON FUNCTION search_entities TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_search_index TO authenticated;

-- 2. Ensure text search config is properly set up
-- The spanish_legal config is fine in public schema for our use case
-- Adding comment for documentation
COMMENT ON TEXT SEARCH CONFIGURATION spanish_legal IS 'Spanish language configuration optimized for legal terminology';

-- 3. Add additional security to saved_searches
-- Already has RLS enabled, add constraint to prevent injection
ALTER TABLE saved_searches ADD CONSTRAINT check_entity_type 
CHECK (entity_type IN ('case', 'client', 'document', 'invoice'));

-- Add constraint on name length
ALTER TABLE saved_searches ADD CONSTRAINT check_name_length
CHECK (length(name) >= 1 AND length(name) <= 100);

-- 4. Add function to safely refresh index (only for admins or scheduled jobs)
CREATE OR REPLACE FUNCTION can_refresh_search_index()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Update refresh function to check permissions
CREATE OR REPLACE FUNCTION refresh_search_index()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only admins can manually refresh
    IF NOT can_refresh_search_index() THEN
        RAISE EXCEPTION 'Only administrators can refresh the search index';
    END IF;
    
    REFRESH MATERIALIZED VIEW CONCURRENTLY search_index;
END;
$$;

-- 5. Add rate limiting to search function to prevent abuse
CREATE TABLE IF NOT EXISTS search_rate_limit (
    user_id uuid NOT NULL,
    search_count integer DEFAULT 1,
    window_start timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id, window_start)
);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_search_rate_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer;
BEGIN
    -- Count searches in last minute
    SELECT COALESCE(SUM(search_count), 0) INTO v_count
    FROM search_rate_limit
    WHERE user_id = p_user_id
    AND window_start > now() - interval '1 minute';
    
    -- Allow up to 60 searches per minute
    IF v_count >= 60 THEN
        RETURN false;
    END IF;
    
    -- Record this search
    INSERT INTO search_rate_limit (user_id, window_start)
    VALUES (p_user_id, date_trunc('minute', now()))
    ON CONFLICT (user_id, window_start)
    DO UPDATE SET search_count = search_rate_limit.search_count + 1;
    
    -- Cleanup old records (older than 5 minutes)
    DELETE FROM search_rate_limit
    WHERE window_start < now() - interval '5 minutes';
    
    RETURN true;
END;
$$;

-- Update search function with rate limiting
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
    -- Check rate limit
    IF NOT check_search_rate_limit(p_user_id) THEN
        RAISE EXCEPTION 'Search rate limit exceeded. Please wait before searching again.';
    END IF;

    -- Validate input
    IF p_query IS NULL OR trim(p_query) = '' THEN
        RETURN;
    END IF;

    -- Sanitize and validate limit
    p_limit := LEAST(GREATEST(p_limit, 1), 100);

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

COMMENT ON FUNCTION check_search_rate_limit IS 'Rate limiting for search queries - max 60 per minute per user';
COMMENT ON TABLE search_rate_limit IS 'Tracks search API usage for rate limiting';
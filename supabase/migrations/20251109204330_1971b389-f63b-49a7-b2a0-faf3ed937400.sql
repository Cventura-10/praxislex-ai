-- Fix search_path for security functions
CREATE OR REPLACE FUNCTION public.upsert_agent_pattern(
  p_user_id UUID,
  p_act_slug TEXT,
  p_pattern_key TEXT,
  p_pattern_value JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.agent_patterns (user_id, act_slug, pattern_key, pattern_value, usage_count, last_used_at)
  VALUES (p_user_id, p_act_slug, p_pattern_key, p_pattern_value, 1, now())
  ON CONFLICT (user_id, act_slug, pattern_key)
  DO UPDATE SET
    pattern_value = EXCLUDED.pattern_value,
    usage_count = agent_patterns.usage_count + 1,
    last_used_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_agent_suggestions(
  p_user_id UUID,
  p_act_slug TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  pattern_key TEXT,
  pattern_value JSONB,
  usage_count INTEGER,
  last_used_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.pattern_key,
    ap.pattern_value,
    ap.usage_count,
    ap.last_used_at
  FROM public.agent_patterns ap
  WHERE ap.user_id = p_user_id 
    AND ap.act_slug = p_act_slug
  ORDER BY ap.usage_count DESC, ap.last_used_at DESC
  LIMIT p_limit;
END;
$$;
-- =====================================================
-- SECURITY FIX: Add search_path to AI-OS SECURITY DEFINER functions
-- Addresses final 4 linter warnings: Function Search Path Mutable
-- Ensures all SECURITY DEFINER functions have explicit search_path
-- =====================================================

-- Fix analyze_classification_performance
CREATE OR REPLACE FUNCTION public.analyze_classification_performance(
  p_user_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  intent TEXT,
  avg_confidence FLOAT,
  success_rate FLOAT,
  total_attempts INTEGER,
  avg_response_time_ms INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    asa.intent,
    ROUND(AVG(asa.confidence)::NUMERIC, 3)::FLOAT as avg_confidence,
    ROUND(
      (COUNT(*) FILTER (WHERE asa.success = true))::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100,
      2
    )::FLOAT as success_rate,
    COUNT(*)::INTEGER as total_attempts,
    ROUND(AVG(asa.response_time_ms)::NUMERIC, 0)::INTEGER as avg_response_time_ms
  FROM ai_os_session_analytics asa
  WHERE asa.user_id = p_user_id
    AND asa.created_at > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY asa.intent
  ORDER BY total_attempts DESC;
END;
$$;

-- Fix detect_user_pattern
CREATE OR REPLACE FUNCTION public.detect_user_pattern(
  p_user_id UUID,
  p_pattern_type TEXT,
  p_pattern_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pattern_id UUID;
  v_existing_pattern RECORD;
BEGIN
  -- Buscar patrón existente similar
  SELECT * INTO v_existing_pattern
  FROM ai_user_patterns
  WHERE user_id = p_user_id
    AND pattern_type = p_pattern_type
    AND pattern_data ->> 'sequence' = p_pattern_data ->> 'sequence'
  LIMIT 1;

  IF FOUND THEN
    -- Actualizar patrón existente
    UPDATE ai_user_patterns
    SET 
      occurrences = occurrences + 1,
      frequency = LEAST((occurrences + 1)::FLOAT / GREATEST(
        EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400, 1
      ), 1.0),
      last_occurred_at = NOW(),
      updated_at = NOW()
    WHERE id = v_existing_pattern.id
    RETURNING id INTO v_pattern_id;
  ELSE
    -- Crear nuevo patrón
    INSERT INTO ai_user_patterns (
      user_id,
      tenant_id,
      pattern_type,
      pattern_data,
      frequency,
      last_occurred_at
    )
    VALUES (
      p_user_id,
      get_user_tenant_id(p_user_id),
      p_pattern_type,
      p_pattern_data,
      0.1, -- Frecuencia inicial baja
      NOW()
    )
    RETURNING id INTO v_pattern_id;
  END IF;

  RETURN v_pattern_id;
END;
$$;

-- Fix get_proactive_suggestions
CREATE OR REPLACE FUNCTION public.get_proactive_suggestions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 3
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_suggestions JSONB;
BEGIN
  SELECT JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'pattern_id', id,
      'type', pattern_type,
      'message', pattern_data ->> 'message',
      'frequency', ROUND(frequency::NUMERIC, 2),
      'occurrences', occurrences
    )
  ) INTO v_suggestions
  FROM (
    SELECT *
    FROM ai_user_patterns
    WHERE user_id = p_user_id
      AND accepted IS NULL  -- No ha respondido
      AND frequency >= 0.6  -- Alta frecuencia
      AND (last_suggested_at IS NULL OR last_suggested_at < NOW() - INTERVAL '7 days')
    ORDER BY frequency DESC, occurrences DESC
    LIMIT p_limit
  ) sub;

  RETURN COALESCE(v_suggestions, '[]'::JSONB);
END;
$$;

-- Fix get_ai_os_metrics
CREATE OR REPLACE FUNCTION public.get_ai_os_metrics(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metrics JSONB;
  v_total_queries INTEGER;
  v_success_rate FLOAT;
  v_avg_confidence FLOAT;
  v_avg_response_time INTEGER;
  v_agent_usage JSONB;
  v_top_intents JSONB;
BEGIN
  -- Total de queries
  SELECT COUNT(*) INTO v_total_queries
  FROM ai_os_session_analytics
  WHERE user_id = p_user_id
    AND created_at > NOW() - (p_days || ' days')::INTERVAL;

  -- Tasa de éxito
  SELECT 
    ROUND(
      (COUNT(*) FILTER (WHERE success = true))::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100, 
      2
    )
  INTO v_success_rate
  FROM ai_os_session_analytics
  WHERE user_id = p_user_id
    AND created_at > NOW() - (p_days || ' days')::INTERVAL;

  -- Confidence promedio
  SELECT ROUND(AVG(confidence)::NUMERIC, 2) INTO v_avg_confidence
  FROM ai_os_session_analytics
  WHERE user_id = p_user_id
    AND created_at > NOW() - (p_days || ' days')::INTERVAL
    AND confidence IS NOT NULL;

  -- Tiempo de respuesta promedio
  SELECT ROUND(AVG(response_time_ms)::NUMERIC, 0)::INTEGER INTO v_avg_response_time
  FROM ai_os_session_analytics
  WHERE user_id = p_user_id
    AND created_at > NOW() - (p_days || ' days')::INTERVAL
    AND response_time_ms IS NOT NULL;

  -- Uso por agente
  SELECT JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'agent', agent_name,
      'count', count,
      'percentage', ROUND((count::NUMERIC / v_total_queries * 100)::NUMERIC, 1)
    )
  ) INTO v_agent_usage
  FROM (
    SELECT 
      COALESCE(agent_name, 'unknown') as agent_name,
      COUNT(*)::INTEGER as count
    FROM ai_os_session_analytics
    WHERE user_id = p_user_id
      AND created_at > NOW() - (p_days || ' days')::INTERVAL
    GROUP BY agent_name
    ORDER BY count DESC
    LIMIT 10
  ) sub;

  -- Top intents
  SELECT JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'intent', intent,
      'count', count,
      'avg_confidence', avg_conf
    )
  ) INTO v_top_intents
  FROM (
    SELECT 
      intent,
      COUNT(*)::INTEGER as count,
      ROUND(AVG(confidence)::NUMERIC, 2) as avg_conf
    FROM ai_os_session_analytics
    WHERE user_id = p_user_id
      AND created_at > NOW() - (p_days || ' days')::INTERVAL
    GROUP BY intent
    ORDER BY count DESC
    LIMIT 10
  ) sub;

  -- Construir objeto de métricas
  v_metrics := JSONB_BUILD_OBJECT(
    'total_queries', COALESCE(v_total_queries, 0),
    'success_rate', COALESCE(v_success_rate, 0),
    'avg_confidence', COALESCE(v_avg_confidence, 0),
    'avg_response_time_ms', COALESCE(v_avg_response_time, 0),
    'agent_usage', COALESCE(v_agent_usage, '[]'::JSONB),
    'top_intents', COALESCE(v_top_intents, '[]'::JSONB),
    'period_days', p_days
  );

  RETURN v_metrics;
END;
$$;
-- ============================================================
-- FASE 7: ANALYTICS Y OPTIMIZACIÓN DEL AI-OS
-- ============================================================

-- Tabla para métricas de sesión (tracking detallado)
CREATE TABLE IF NOT EXISTS ai_os_session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  intent TEXT NOT NULL,
  agent_name TEXT,
  confidence FLOAT,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para patrones de usuario (sugerencias proactivas)
CREATE TABLE IF NOT EXISTS ai_user_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  pattern_type TEXT NOT NULL, -- 'sequence', 'preference', 'schedule'
  pattern_data JSONB NOT NULL,
  frequency FLOAT NOT NULL DEFAULT 0.0,
  occurrences INTEGER DEFAULT 1,
  last_occurred_at TIMESTAMPTZ,
  last_suggested_at TIMESTAMPTZ,
  accepted BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimización de queries
CREATE INDEX IF NOT EXISTS idx_session_analytics_user_created 
  ON ai_os_session_analytics(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_analytics_intent 
  ON ai_os_session_analytics(intent, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_analytics_success 
  ON ai_os_session_analytics(success, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_patterns_user 
  ON ai_user_patterns(user_id, frequency DESC);

CREATE INDEX IF NOT EXISTS idx_user_patterns_type 
  ON ai_user_patterns(pattern_type, frequency DESC);

-- RLS Policies
ALTER TABLE ai_os_session_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_patterns ENABLE ROW LEVEL SECURITY;

-- Users can view their own analytics
CREATE POLICY "Users can view their analytics"
  ON ai_os_session_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert analytics
CREATE POLICY "System can insert analytics"
  ON ai_os_session_analytics FOR INSERT
  WITH CHECK (true);

-- Users can view their patterns
CREATE POLICY "Users can view their patterns"
  ON ai_user_patterns FOR SELECT
  USING (auth.uid() = user_id);

-- System can manage patterns
CREATE POLICY "System can manage patterns"
  ON ai_user_patterns FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- FUNCIONES RPC PARA ANALYTICS
-- ============================================================

-- Función: Obtener métricas de uso del AI-OS
CREATE OR REPLACE FUNCTION get_ai_os_metrics(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Analizar performance de clasificación
CREATE OR REPLACE FUNCTION analyze_classification_performance(
  p_user_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  intent TEXT,
  avg_confidence FLOAT,
  success_rate FLOAT,
  total_attempts INTEGER,
  avg_response_time_ms INTEGER
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Detectar y actualizar patrones de usuario
CREATE OR REPLACE FUNCTION detect_user_pattern(
  p_user_id UUID,
  p_pattern_type TEXT,
  p_pattern_data JSONB
)
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener sugerencias proactivas
CREATE OR REPLACE FUNCTION get_proactive_suggestions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 3
)
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
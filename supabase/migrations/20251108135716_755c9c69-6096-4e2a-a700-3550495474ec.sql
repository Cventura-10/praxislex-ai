-- FASE 0: Telemetría y logs
CREATE TABLE IF NOT EXISTS public.error_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  origin TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_user ON public.error_logs(user_id, created_at DESC);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "error_logs: admin only" ON public.error_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role_extended IN ('admin', 'desarrollador')
    )
  );

-- Memoria del agente IA (eventos y patrones aprendidos)
CREATE TABLE IF NOT EXISTS public.agent_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  act_slug TEXT,
  event_type TEXT NOT NULL,
  summary TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_events_user ON public.agent_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_slug ON public.agent_events(user_id, act_slug, created_at DESC);

ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events: rw own user" ON public.agent_events
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Memoria de patrones (frecuencias, valores comunes, etc.)
CREATE TABLE IF NOT EXISTS public.agent_patterns (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  act_slug TEXT NOT NULL,
  pattern_key TEXT NOT NULL,
  pattern_value JSONB NOT NULL,
  usage_count INT NOT NULL DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, act_slug, pattern_key)
);

CREATE INDEX IF NOT EXISTS idx_agent_patterns_user ON public.agent_patterns(user_id, act_slug);

ALTER TABLE public.agent_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patterns: rw own user" ON public.agent_patterns
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Función para obtener patrones sugeridos
CREATE OR REPLACE FUNCTION public.get_agent_suggestions(
  p_user_id UUID,
  p_act_slug TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  pattern_key TEXT,
  pattern_value JSONB,
  usage_count INT,
  last_used_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pattern_key,
    pattern_value,
    usage_count,
    last_used_at
  FROM public.agent_patterns
  WHERE user_id = p_user_id
    AND act_slug = p_act_slug
  ORDER BY usage_count DESC, last_used_at DESC
  LIMIT p_limit;
$$;

-- Función para actualizar o insertar patrón
CREATE OR REPLACE FUNCTION public.upsert_agent_pattern(
  p_user_id UUID,
  p_act_slug TEXT,
  p_pattern_key TEXT,
  p_pattern_value JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.agent_patterns(user_id, act_slug, pattern_key, pattern_value, usage_count, last_used_at)
  VALUES (p_user_id, p_act_slug, p_pattern_key, p_pattern_value, 1, NOW())
  ON CONFLICT (user_id, act_slug, pattern_key)
  DO UPDATE SET
    pattern_value = p_pattern_value,
    usage_count = agent_patterns.usage_count + 1,
    last_used_at = NOW();
END;
$$;
-- Create agent_events table to log user actions
CREATE TABLE IF NOT EXISTS public.agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  act_slug TEXT NOT NULL,
  event_type TEXT NOT NULL,
  summary TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create agent_patterns table to store learned patterns
CREATE TABLE IF NOT EXISTS public.agent_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  act_slug TEXT NOT NULL,
  pattern_key TEXT NOT NULL,
  pattern_value JSONB NOT NULL,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, act_slug, pattern_key)
);

-- Enable RLS
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_patterns ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_events
CREATE POLICY "Users can insert their own events"
  ON public.agent_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own events"
  ON public.agent_events FOR SELECT
  USING (auth.uid() = user_id);

-- RLS policies for agent_patterns
CREATE POLICY "Users can view their own patterns"
  ON public.agent_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patterns"
  ON public.agent_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patterns"
  ON public.agent_patterns FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_agent_events_user_act ON public.agent_events(user_id, act_slug, created_at DESC);
CREATE INDEX idx_agent_patterns_user_act ON public.agent_patterns(user_id, act_slug, usage_count DESC);

-- Function to upsert agent patterns
CREATE OR REPLACE FUNCTION public.upsert_agent_pattern(
  p_user_id UUID,
  p_act_slug TEXT,
  p_pattern_key TEXT,
  p_pattern_value JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to get agent suggestions
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
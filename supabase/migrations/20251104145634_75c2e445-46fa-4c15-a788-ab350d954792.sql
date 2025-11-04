-- ============================================
-- CLEANUP: Drop any partially created objects
-- ============================================

-- Drop indexes if they exist
DROP INDEX IF EXISTS public.idx_signature_envelopes_user;
DROP INDEX IF EXISTS public.idx_signature_envelopes_tenant;
DROP INDEX IF EXISTS public.idx_document_signatures_envelope;
DROP INDEX IF EXISTS public.idx_document_signatures_email;
DROP INDEX IF EXISTS public.idx_edge_rate_limits_lookup;

-- Drop tables if they exist (CASCADE will drop dependent policies)
DROP TABLE IF EXISTS public.document_signatures CASCADE;
DROP TABLE IF EXISTS public.signature_envelopes CASCADE;
DROP TABLE IF EXISTS public.edge_function_rate_limits CASCADE;

-- ============================================
-- FIX 1: Create digital signature tables with RLS
-- ============================================

-- Create signature_envelopes table
CREATE TABLE public.signature_envelopes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  document_version_id UUID REFERENCES public.document_versions(id) ON DELETE SET NULL,
  generated_act_id UUID REFERENCES public.generated_acts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'pending', 'completed', 'declined', 'expired')),
  signers JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at TIMESTAMPTZ,
  message TEXT,
  require_all_signatures BOOLEAN NOT NULL DEFAULT true,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create document_signatures table
CREATE TABLE public.document_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  envelope_id UUID NOT NULL REFERENCES public.signature_envelopes(id) ON DELETE CASCADE,
  signer_email TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  signer_role TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined')),
  signed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  signature_data TEXT,
  ip_address INET,
  user_agent TEXT,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.signature_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;

-- RLS policies for signature_envelopes
CREATE POLICY "Users view own envelopes"
  ON public.signature_envelopes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own envelopes"
  ON public.signature_envelopes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own envelopes"
  ON public.signature_envelopes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own envelopes"
  ON public.signature_envelopes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for document_signatures
CREATE POLICY "Users view signatures for own envelopes"
  ON public.document_signatures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.signature_envelopes
      WHERE id = document_signatures.envelope_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users create signatures"
  ON public.document_signatures FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.signature_envelopes
      WHERE id = document_signatures.envelope_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Signers update their signatures"
  ON public.document_signatures FOR UPDATE
  USING (signer_email = auth.email() OR 
    EXISTS (
      SELECT 1 FROM public.signature_envelopes
      WHERE id = document_signatures.envelope_id
      AND user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_signature_envelopes_user ON public.signature_envelopes(user_id);
CREATE INDEX idx_signature_envelopes_tenant ON public.signature_envelopes(tenant_id);
CREATE INDEX idx_document_signatures_envelope ON public.document_signatures(envelope_id);
CREATE INDEX idx_document_signatures_email ON public.document_signatures(signer_email);

-- ============================================
-- FIX 2: Create rate limiting infrastructure
-- ============================================

CREATE TABLE public.edge_function_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 1,
  last_request_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, function_name, window_start)
);

-- Enable RLS
ALTER TABLE public.edge_function_rate_limits ENABLE ROW LEVEL SECURITY;

-- System manages rate limits
CREATE POLICY "System manages rate limits"
  ON public.edge_function_rate_limits FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index
CREATE INDEX idx_edge_rate_limits_lookup ON public.edge_function_rate_limits(user_id, function_name, window_start DESC);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_edge_function_rate_limit(
  p_user_id UUID,
  p_function_name TEXT,
  p_max_per_minute INTEGER DEFAULT 10,
  p_max_per_hour INTEGER DEFAULT 100
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_minute_start TIMESTAMPTZ;
  v_hour_start TIMESTAMPTZ;
  v_minute_count INTEGER;
  v_hour_count INTEGER;
BEGIN
  v_minute_start := date_trunc('minute', now());
  v_hour_start := date_trunc('hour', now());
  
  -- Count requests in last minute
  SELECT COALESCE(SUM(request_count), 0)
  INTO v_minute_count
  FROM public.edge_function_rate_limits
  WHERE user_id = p_user_id
    AND function_name = p_function_name
    AND window_start >= v_minute_start;
  
  -- Count requests in last hour
  SELECT COALESCE(SUM(request_count), 0)
  INTO v_hour_count
  FROM public.edge_function_rate_limits
  WHERE user_id = p_user_id
    AND function_name = p_function_name
    AND window_start >= v_hour_start;
  
  -- Check limits
  IF v_minute_count >= p_max_per_minute THEN
    RETURN FALSE;
  END IF;
  
  IF v_hour_count >= p_max_per_hour THEN
    RETURN FALSE;
  END IF;
  
  -- Increment counter
  INSERT INTO public.edge_function_rate_limits (user_id, function_name, window_start, request_count)
  VALUES (p_user_id, p_function_name, v_minute_start, 1)
  ON CONFLICT (user_id, function_name, window_start)
  DO UPDATE SET 
    request_count = edge_function_rate_limits.request_count + 1,
    last_request_at = now();
  
  -- Cleanup old records
  DELETE FROM public.edge_function_rate_limits
  WHERE window_start < now() - INTERVAL '24 hours';
  
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_edge_function_rate_limit TO authenticated;
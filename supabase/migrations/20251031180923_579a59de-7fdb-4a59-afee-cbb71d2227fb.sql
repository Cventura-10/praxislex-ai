-- Create calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acto_slug TEXT,
  expediente_id TEXT,
  materia TEXT,
  tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('Notificación', 'Audiencia', 'Plazo', 'Depósito', 'Firma', 'Entrega', 'Otro')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  ubicacion TEXT,
  inicio TIMESTAMPTZ NOT NULL,
  fin TIMESTAMPTZ NOT NULL,
  zona_horaria TEXT DEFAULT 'America/Santo_Domingo',
  recordatorios JSONB DEFAULT '[]'::jsonb,
  responsables TEXT[] DEFAULT ARRAY[]::TEXT[],
  partes_relacionadas TEXT[] DEFAULT ARRAY[]::TEXT[],
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_curso', 'cumplido', 'vencido', 'reprogramado')),
  prioridad TEXT DEFAULT 'media' CHECK (prioridad IN ('alta', 'media', 'baja')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their calendar events"
  ON public.calendar_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create calendar events"
  ON public.calendar_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their calendar events"
  ON public.calendar_events
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their calendar events"
  ON public.calendar_events
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create signature_envelopes table
CREATE TABLE IF NOT EXISTS public.signature_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acto_slug TEXT NOT NULL,
  documento_origen TEXT NOT NULL,
  documento_url TEXT,
  firmantes JSONB NOT NULL DEFAULT '[]'::jsonb,
  placeholders_firmas JSONB DEFAULT '[]'::jsonb,
  politicas JSONB NOT NULL DEFAULT '{
    "fidelidad_template": "STRICT",
    "hash_pdf": "sha256",
    "audit_trail_embed": true
  }'::jsonb,
  estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviado', 'visto', 'firmado_parcial', 'firmado_total', 'rechazado', 'expirado')),
  audit_trail JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.signature_envelopes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their signature envelopes"
  ON public.signature_envelopes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create signature envelopes"
  ON public.signature_envelopes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their signature envelopes"
  ON public.signature_envelopes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_inicio ON public.calendar_events(inicio);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_tenant ON public.calendar_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_estado ON public.calendar_events(estado);
CREATE INDEX IF NOT EXISTS idx_calendar_events_responsables ON public.calendar_events USING GIN(responsables);

CREATE INDEX IF NOT EXISTS idx_signature_envelopes_user ON public.signature_envelopes(user_id);
CREATE INDEX IF NOT EXISTS idx_signature_envelopes_tenant ON public.signature_envelopes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_signature_envelopes_estado ON public.signature_envelopes(estado);

-- Trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_calendar_event_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_events_timestamp
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_calendar_event_timestamp();

CREATE TRIGGER update_signature_envelopes_timestamp
  BEFORE UPDATE ON public.signature_envelopes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_calendar_event_timestamp();
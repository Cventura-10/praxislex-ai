-- Crear tabla para sesiones de videoconferencia
CREATE TABLE IF NOT EXISTS public.video_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  meeting_link TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_video_sessions_user_id ON public.video_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_case_id ON public.video_sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_scheduled_at ON public.video_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_video_sessions_status ON public.video_sessions(status);

-- Trigger para auto-asignar tenant_id
CREATE TRIGGER video_sessions_auto_tenant
  BEFORE INSERT ON public.video_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_tenant();

-- Trigger para actualizar updated_at
CREATE TRIGGER video_sessions_updated_at
  BEFORE UPDATE ON public.video_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own video sessions"
  ON public.video_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own video sessions"
  ON public.video_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video sessions"
  ON public.video_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video sessions"
  ON public.video_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentarios
COMMENT ON TABLE public.video_sessions IS 'Sesiones de videoconferencia programadas con clientes';
COMMENT ON COLUMN public.video_sessions.meeting_link IS 'Enlace seguro generado para la videoconferencia';
COMMENT ON COLUMN public.video_sessions.status IS 'Estado: scheduled, active, completed, cancelled';
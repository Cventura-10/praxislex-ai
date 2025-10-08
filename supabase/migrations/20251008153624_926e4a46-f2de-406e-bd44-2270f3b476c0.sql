-- Fase 6: Sistema de Notificaciones y Recordatorios

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error', 'reminder')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT NOT NULL CHECK (category IN ('hearing', 'deadline', 'payment', 'case', 'client', 'system')),
  related_id UUID,
  related_table TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE public.notifications IS 'Sistema de notificaciones para usuarios';
COMMENT ON COLUMN public.notifications.type IS 'Tipo visual de notificación';
COMMENT ON COLUMN public.notifications.priority IS 'Prioridad de la notificación';
COMMENT ON COLUMN public.notifications.category IS 'Categoría funcional de la notificación';
COMMENT ON COLUMN public.notifications.related_id IS 'ID del registro relacionado';
COMMENT ON COLUMN public.notifications.related_table IS 'Tabla del registro relacionado';
COMMENT ON COLUMN public.notifications.metadata IS 'Datos adicionales en JSON';

-- Índices para rendimiento
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_category ON public.notifications(category);
CREATE INDEX idx_notifications_expires_at ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Tabla de recordatorios
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
  related_id UUID,
  related_table TEXT,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  repeat_type TEXT CHECK (repeat_type IN ('none', 'daily', 'weekly', 'monthly')),
  repeat_until TIMESTAMP WITH TIME ZONE,
  channels TEXT[] DEFAULT ARRAY['in_app']::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.reminders IS 'Sistema de recordatorios programados';
COMMENT ON COLUMN public.reminders.remind_at IS 'Fecha y hora para enviar el recordatorio';
COMMENT ON COLUMN public.reminders.repeat_type IS 'Tipo de repetición del recordatorio';
COMMENT ON COLUMN public.reminders.channels IS 'Canales de envío: in_app, email, push';

-- Índices para recordatorios
CREATE INDEX idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX idx_reminders_remind_at ON public.reminders(remind_at);
CREATE INDEX idx_reminders_is_sent ON public.reminders(is_sent);
CREATE INDEX idx_reminders_active_pending ON public.reminders(is_active, is_sent, remind_at) WHERE is_active = true AND is_sent = false;

-- Tabla de preferencias de notificaciones
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  hearing_reminders BOOLEAN NOT NULL DEFAULT true,
  deadline_reminders BOOLEAN NOT NULL DEFAULT true,
  payment_reminders BOOLEAN NOT NULL DEFAULT true,
  case_updates BOOLEAN NOT NULL DEFAULT true,
  client_messages BOOLEAN NOT NULL DEFAULT false,
  reminder_advance_hours INTEGER NOT NULL DEFAULT 24,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notification_preferences IS 'Preferencias de notificaciones por usuario';

-- RLS Policies para notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies para reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their reminders"
  ON public.reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their reminders"
  ON public.reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their reminders"
  ON public.reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their reminders"
  ON public.reminders FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies para notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Función para crear notificación
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_priority TEXT DEFAULT 'medium',
  p_category TEXT DEFAULT 'system',
  p_related_id UUID DEFAULT NULL,
  p_related_table TEXT DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    priority,
    category,
    related_id,
    related_table,
    action_url,
    action_label,
    metadata
  )
  VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_priority,
    p_category,
    p_related_id,
    p_related_table,
    p_action_url,
    p_action_label,
    p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

COMMENT ON FUNCTION public.create_notification IS 'Crea una nueva notificación para un usuario';

-- Función para marcar notificación como leída
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true,
      read_at = now()
  WHERE id = p_notification_id
    AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- Función para marcar todas las notificaciones como leídas
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET is_read = true,
      read_at = now()
  WHERE user_id = auth.uid()
    AND is_read = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Función para limpiar notificaciones antiguas
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Eliminar notificaciones leídas de más de 30 días
  DELETE FROM public.notifications
  WHERE is_read = true
    AND read_at < now() - interval '30 days';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Eliminar notificaciones expiradas
  DELETE FROM public.notifications
  WHERE expires_at IS NOT NULL
    AND expires_at < now();

  RETURN v_count;
END;
$$;

-- Trigger para actualizar updated_at en reminders
CREATE OR REPLACE FUNCTION public.update_reminders_updated_at()
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

CREATE TRIGGER update_reminders_timestamp
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reminders_updated_at();

-- Trigger para crear notificaciones automáticas en audiencias
CREATE OR REPLACE FUNCTION public.notify_hearing_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Crear notificación
  PERFORM public.create_notification(
    NEW.user_id,
    'Nueva audiencia programada',
    'Se ha programado una audiencia para el caso: ' || NEW.caso,
    'info',
    'high',
    'hearing',
    NEW.id,
    'hearings',
    '/audiencias',
    'Ver audiencia',
    jsonb_build_object('fecha', NEW.fecha, 'hora', NEW.hora)
  );

  -- Crear recordatorio automático 24 horas antes
  INSERT INTO public.reminders (
    user_id,
    title,
    description,
    remind_at,
    related_id,
    related_table,
    channels
  )
  VALUES (
    NEW.user_id,
    'Recordatorio: Audiencia mañana',
    'Tienes una audiencia programada para: ' || NEW.caso,
    (NEW.fecha || ' ' || NEW.hora)::TIMESTAMP - interval '24 hours',
    NEW.id,
    'hearings',
    ARRAY['in_app', 'email']::TEXT[]
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER hearing_created_notification
  AFTER INSERT ON public.hearings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_hearing_created();

-- Habilitar realtime para notificaciones
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
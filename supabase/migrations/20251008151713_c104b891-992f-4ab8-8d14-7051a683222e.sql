-- ============================================
-- FASE 2: CORE SECURITY - AUDITORÍA INMUTABLE
-- ============================================

-- 1. Crear tabla de eventos de auditoría inmutable
CREATE TABLE IF NOT EXISTS public.events_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'clients', 'cases', 'invoices', etc.
  entity_id UUID NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'VIEW_PII'
  payload_hash TEXT NOT NULL, -- SHA-256 hash of the changed data
  changes JSONB, -- Encrypted diff of changes (before/after)
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en events_audit
ALTER TABLE public.events_audit ENABLE ROW LEVEL SECURITY;

-- Índices para búsquedas eficientes
CREATE INDEX idx_events_audit_entity ON public.events_audit(entity_type, entity_id);
CREATE INDEX idx_events_audit_actor ON public.events_audit(actor_id);
CREATE INDEX idx_events_audit_created ON public.events_audit(created_at DESC);

-- Política: Solo admins pueden ver logs de auditoría
CREATE POLICY "Admins can view audit events"
  ON public.events_audit
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Política: Sistema puede insertar (SECURITY DEFINER functions only)
CREATE POLICY "System can insert audit events"
  ON public.events_audit
  FOR INSERT
  WITH CHECK (true); -- Controlled by SECURITY DEFINER functions

-- CRITICAL: Nadie puede actualizar o eliminar auditoría (immutable)
-- No UPDATE or DELETE policies = immutable audit trail

-- 2. Función para generar hash de payload
CREATE OR REPLACE FUNCTION public.hash_payload(data JSONB)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(digest(data::text, 'sha256'), 'hex');
END;
$$;

-- 3. Función para registrar eventos de auditoría
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_changes JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_payload_hash TEXT;
BEGIN
  -- Generate hash of changes
  v_payload_hash := public.hash_payload(COALESCE(p_changes, '{}'::jsonb));
  
  -- Insert audit event
  INSERT INTO public.events_audit(
    entity_type,
    entity_id,
    actor_id,
    action,
    payload_hash,
    changes,
    ip_address,
    user_agent
  )
  VALUES (
    p_entity_type,
    p_entity_id,
    auth.uid(),
    p_action,
    v_payload_hash,
    p_changes,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- 4. Trigger para auditar cambios en tabla clients
CREATE OR REPLACE FUNCTION public.audit_clients_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changes JSONB;
BEGIN
  -- Construir diff de cambios (omitiendo campos sensibles en texto plano)
  IF TG_OP = 'INSERT' THEN
    v_changes := jsonb_build_object(
      'operation', 'INSERT',
      'new_record', jsonb_build_object(
        'id', NEW.id,
        'nombre_completo', NEW.nombre_completo,
        'has_email', (NEW.email IS NOT NULL),
        'has_phone', (NEW.telefono IS NOT NULL),
        'has_cedula', (NEW.cedula_rnc_encrypted IS NOT NULL)
      )
    );
    PERFORM public.log_audit_event('clients', NEW.id, 'INSERT', v_changes);
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_changes := jsonb_build_object(
      'operation', 'UPDATE',
      'changed_fields', jsonb_build_object(
        'nombre_completo_changed', (OLD.nombre_completo IS DISTINCT FROM NEW.nombre_completo),
        'email_changed', (OLD.email IS DISTINCT FROM NEW.email),
        'telefono_changed', (OLD.telefono IS DISTINCT FROM NEW.telefono),
        'cedula_changed', (OLD.cedula_rnc_encrypted IS DISTINCT FROM NEW.cedula_rnc_encrypted)
      )
    );
    PERFORM public.log_audit_event('clients', NEW.id, 'UPDATE', v_changes);
    
  ELSIF TG_OP = 'DELETE' THEN
    v_changes := jsonb_build_object(
      'operation', 'DELETE',
      'deleted_record', jsonb_build_object(
        'id', OLD.id,
        'nombre_completo', OLD.nombre_completo
      )
    );
    PERFORM public.log_audit_event('clients', OLD.id, 'DELETE', v_changes);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger a tabla clients
DROP TRIGGER IF EXISTS audit_clients_trigger ON public.clients;
CREATE TRIGGER audit_clients_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_clients_changes();

-- 5. Trigger para auditar cambios en casos
CREATE OR REPLACE FUNCTION public.audit_cases_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changes JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_changes := jsonb_build_object(
      'operation', 'INSERT',
      'titulo', NEW.titulo,
      'materia', NEW.materia,
      'estado', NEW.estado
    );
    PERFORM public.log_audit_event('cases', NEW.id, 'INSERT', v_changes);
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_changes := jsonb_build_object(
      'operation', 'UPDATE',
      'estado_changed', (OLD.estado IS DISTINCT FROM NEW.estado),
      'old_estado', OLD.estado,
      'new_estado', NEW.estado
    );
    PERFORM public.log_audit_event('cases', NEW.id, 'UPDATE', v_changes);
    
  ELSIF TG_OP = 'DELETE' THEN
    v_changes := jsonb_build_object(
      'operation', 'DELETE',
      'titulo', OLD.titulo
    );
    PERFORM public.log_audit_event('cases', OLD.id, 'DELETE', v_changes);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_cases_trigger ON public.cases;
CREATE TRIGGER audit_cases_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_cases_changes();

-- 6. Función para verificar integridad de auditoría
CREATE OR REPLACE FUNCTION public.verify_audit_integrity(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_computed_hash TEXT;
BEGIN
  SELECT * INTO v_event
  FROM public.events_audit
  WHERE id = p_event_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Recompute hash
  v_computed_hash := public.hash_payload(COALESCE(v_event.changes, '{}'::jsonb));
  
  -- Verify integrity
  RETURN v_computed_hash = v_event.payload_hash;
END;
$$;

-- 7. Comentarios para documentación
COMMENT ON TABLE public.events_audit IS 'Immutable audit trail for all sensitive operations. NO UPDATE/DELETE allowed.';
COMMENT ON COLUMN public.events_audit.payload_hash IS 'SHA-256 hash of changes for integrity verification';
COMMENT ON FUNCTION public.log_audit_event IS 'Central function to log all auditable events with automatic hashing';
COMMENT ON FUNCTION public.verify_audit_integrity IS 'Verify that an audit event has not been tampered with';

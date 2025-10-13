-- ============================================================================
-- CORRECCIONES CRÍTICAS DE SEGURIDAD Y PERFORMANCE - PRAXISLEX v1.0 BETA
-- ============================================================================

-- CRÍTICO #1: Eliminar y recrear client_portal_view SIN SECURITY DEFINER
-- Esto previene escalada de privilegios
DROP VIEW IF EXISTS public.client_portal_view;

CREATE OR REPLACE VIEW public.client_portal_view AS
SELECT 
  c.id,
  c.nombre_completo,
  c.cedula_rnc_encrypted,
  c.email,
  c.telefono,
  c.direccion,
  c.accepted_terms,
  c.created_at,
  c.updated_at,
  c.auth_user_id,
  c.user_id as owner_user_id
FROM public.clients c;

COMMENT ON VIEW public.client_portal_view IS 'Vista para portal de clientes - SIN SECURITY DEFINER para prevenir escalada de privilegios';

-- ============================================================================
-- PERFORMANCE: Agregar índices faltantes críticos
-- ============================================================================

-- Índice para mensajes cliente-abogado (búsqueda bidireccional)
CREATE INDEX IF NOT EXISTS idx_client_messages_sender_recipient 
ON public.client_messages(sender_id, recipient_id);

-- Índice para ordenamiento cronológico de mensajes
CREATE INDEX IF NOT EXISTS idx_client_messages_created_at 
ON public.client_messages(created_at DESC);

-- Índices para relaciones de casos
CREATE INDEX IF NOT EXISTS idx_cases_client_id 
ON public.cases(client_id) WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cases_lawyer_id 
ON public.cases(lawyer_id) WHERE lawyer_id IS NOT NULL;

-- Índice compuesto para facturas (filtrado común por cliente y estado)
CREATE INDEX IF NOT EXISTS idx_invoices_client_id_estado 
ON public.invoices(client_id, estado) WHERE client_id IS NOT NULL;

-- ============================================================================
-- INTEGRIDAD: Constraint único en preferencias de notificaciones
-- ============================================================================

-- Asegurar que cada usuario tenga solo un registro de preferencias
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
ON public.notification_preferences(user_id);

-- ============================================================================
-- BÚSQUEDA OPTIMIZADA: Índices full-text para casos y clientes
-- ============================================================================

-- Índice GIN para búsqueda full-text en casos
CREATE INDEX IF NOT EXISTS idx_cases_search 
ON public.cases USING gin(to_tsvector('spanish', 
  COALESCE(titulo, '') || ' ' || 
  COALESCE(numero_expediente, '') || ' ' || 
  COALESCE(descripcion, '')
));

-- Índice GIN para búsqueda full-text en clientes
CREATE INDEX IF NOT EXISTS idx_clients_search 
ON public.clients USING gin(to_tsvector('spanish', 
  COALESCE(nombre_completo, '') || ' ' || 
  COALESCE(email, '')
));

-- ============================================================================
-- DOCUMENTACIÓN DE SEGURIDAD ADICIONAL
-- ============================================================================

COMMENT ON TABLE public.pii_access_rate_limit IS 'Rate limiting para acceso a PII - 50 accesos por hora por usuario. Limpieza automática de registros antiguos con cleanup_old_rate_limits()';

COMMENT ON TABLE public.events_audit IS 'Registro de auditoría inmutable con hash SHA-256. Verificar integridad con verify_audit_integrity(event_id). Solo administradores pueden leer.';

-- Recordatorio para habilitar protección contra contraseñas filtradas
-- ACCIÓN MANUAL REQUERIDA: En Supabase Dashboard -> Authentication -> Settings
-- Habilitar "Leaked Password Protection" para producción
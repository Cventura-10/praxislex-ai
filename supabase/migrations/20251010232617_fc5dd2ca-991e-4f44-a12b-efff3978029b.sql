-- Crear vista consolidada del portal del cliente (sin RLS directo en vista)
CREATE OR REPLACE VIEW public.client_portal_view 
WITH (security_barrier = true) AS
SELECT
  c.id AS client_id,
  c.user_id AS owner_user_id,
  c.auth_user_id,
  c.nombre_completo AS client_nombre,
  c.email AS client_email,
  c.telefono,
  c.direccion,
  c.accepted_terms,
  -- Casos
  cs.id AS case_id,
  cs.titulo AS case_titulo,
  cs.numero_expediente,
  cs.materia AS case_materia,
  cs.estado AS case_estado,
  cs.juzgado AS case_juzgado,
  cs.etapa_procesal,
  cs.descripcion AS case_descripcion,
  -- Audiencias
  h.id AS audiencia_id,
  h.fecha AS audiencia_fecha,
  h.hora AS audiencia_hora,
  h.tipo AS audiencia_tipo,
  h.juzgado AS audiencia_juzgado,
  h.ubicacion AS audiencia_ubicacion,
  h.estado AS audiencia_estado,
  h.caso AS audiencia_caso_nombre,
  -- Facturas
  inv.id AS invoice_id,
  inv.numero_factura,
  inv.concepto AS invoice_concepto,
  inv.monto AS invoice_monto,
  inv.subtotal AS invoice_subtotal,
  inv.itbis AS invoice_itbis,
  inv.estado AS invoice_estado,
  inv.fecha AS invoice_fecha,
  -- Pagos
  p.id AS payment_id,
  p.monto AS payment_monto,
  p.metodo_pago AS payment_metodo,
  p.fecha AS payment_fecha,
  p.concepto AS payment_concepto,
  -- Documentos legales
  ld.id AS document_id,
  ld.titulo AS document_titulo,
  ld.tipo_documento,
  ld.materia AS document_materia,
  ld.fecha_generacion AS document_fecha
FROM public.clients c
LEFT JOIN public.cases cs ON cs.client_id = c.id
LEFT JOIN public.hearings h ON h.case_id = cs.id
LEFT JOIN public.invoices inv ON inv.client_id = c.id
LEFT JOIN public.payments p ON p.client_id = c.id
LEFT JOIN public.legal_documents ld ON ld.user_id = c.user_id
WHERE (c.auth_user_id = auth.uid() OR c.user_id = auth.uid());

-- Crear función helper para obtener resumen del cliente
CREATE OR REPLACE FUNCTION public.get_client_summary(p_client_id uuid)
RETURNS TABLE (
  casos_activos bigint,
  proximas_audiencias bigint,
  total_facturado numeric,
  total_pagado numeric,
  saldo_pendiente numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el usuario tiene acceso a este cliente
  IF NOT EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = p_client_id
      AND (auth_user_id = auth.uid() OR user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to client data';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(DISTINCT cs.id) FILTER (WHERE cs.estado = 'activo')::bigint as casos_activos,
    COUNT(DISTINCT h.id) FILTER (WHERE h.fecha >= CURRENT_DATE AND h.estado != 'cancelada')::bigint as proximas_audiencias,
    COALESCE(SUM(inv.monto), 0)::numeric as total_facturado,
    COALESCE(SUM(p.monto), 0)::numeric as total_pagado,
    (COALESCE(SUM(inv.monto), 0) - COALESCE(SUM(p.monto), 0))::numeric as saldo_pendiente
  FROM public.clients c
  LEFT JOIN public.cases cs ON cs.client_id = c.id
  LEFT JOIN public.hearings h ON h.case_id = cs.id
  LEFT JOIN public.invoices inv ON inv.client_id = c.id
  LEFT JOIN public.payments p ON p.client_id = c.id
  WHERE c.id = p_client_id;
END;
$$;
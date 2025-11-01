-- ============================================================================
-- PRAXIS LEX v3.2 - Corrección de Seguridad
-- ============================================================================

-- Eliminar la vista v_notarios con SECURITY DEFINER y recrearla sin él
DROP VIEW IF EXISTS public.v_notarios;

CREATE VIEW public.v_notarios 
WITH (security_invoker = true)
AS
SELECT
  n.id,
  n.user_id,
  n.tenant_id,
  n.nombre,
  COALESCE(n.exequatur, '') AS exequatur,
  COALESCE(n.telefono, '') AS telefono,
  COALESCE(n.email, '') AS email,
  COALESCE(n.oficina_direccion, '') AS oficina,
  n.municipio_id,
  m.nombre AS municipio_nombre,
  m.provincia_id,
  p.nombre AS provincia_nombre,
  COALESCE(n.jurisdiccion, '') AS jurisdiccion,
  (LEFT(COALESCE(n.cedula_encrypted, ''), 3) || '-****-****') AS cedula_mask
FROM public.notarios n
LEFT JOIN public.municipios m ON m.id = n.municipio_id
LEFT JOIN public.provincias p ON p.id = m.provincia_id
WHERE n.user_id = auth.uid();

-- Habilitar RLS en act_sequences
ALTER TABLE public.act_sequences ENABLE ROW LEVEL SECURITY;

-- Política para que todos los usuarios autenticados puedan leer sequences
CREATE POLICY "All authenticated users can read sequences" 
  ON public.act_sequences 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Política para que solo el sistema pueda modificar sequences (a través de funciones)
-- Las inserciones/actualizaciones se harán vía SECURITY DEFINER function